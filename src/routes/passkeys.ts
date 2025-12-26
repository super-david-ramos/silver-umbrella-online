import { Hono } from 'hono'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server'
import { isoUint8Array } from '@simplewebauthn/server/helpers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../lib/supabase'
import type { Variables } from '../types/hono'
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server'

const passkeys = new Hono<{ Variables: Variables }>()

// Environment variables for WebAuthn
const rpName = process.env.WEBAUTHN_RELYING_PARTY_NAME || 'Notes App'
const jwtSecret = process.env.SUPABASE_AUTH_JWT_SECRET || 'your-jwt-secret'
const jwtIssuer = process.env.SUPABASE_AUTH_JWT_ISSUER || 'supabase'

// Helper to get RP ID and origin from request (dynamic detection for deployment flexibility)
function getWebAuthnConfig(c: { req: { header: (name: string) => string | undefined } }) {
  // Use environment variables if set, otherwise detect from request
  const host = c.req.header('host') || 'localhost:3000'
  const hostname = host.split(':')[0] // Remove port if present
  const protocol = c.req.header('x-forwarded-proto') || 'http'

  const rpId = process.env.WEBAUTHN_RELYING_PARTY_ID || hostname
  const origin = process.env.WEBAUTHN_RELYING_PARTY_ORIGIN || `${protocol}://${host}`

  return { rpId, origin }
}

// ============================================
// REGISTRATION ROUTES (require authenticated user)
// ============================================

// POST /passkeys/challenge - Start passkey registration
passkeys.post('/challenge', async (c) => {
  const user = c.get('user')
  const supabase = c.get('supabase')
  const { rpId } = getWebAuthnConfig(c)

  // Get existing credentials for this user (to exclude from registration)
  const { data: credentials } = await supabase
    .from('credentials')
    .select('credential_id, credential_type, transports')
    .eq('user_id', user.id)

  const options = await generateRegistrationOptions({
    rpName,
    rpID: rpId,
    userName: user.email || user.id,
    userID: isoUint8Array.fromASCIIString(user.id),
    userDisplayName: user.user_metadata?.display_name || user.email || 'User',
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
    },
    excludeCredentials: credentials?.map((cred) => ({
      id: cred.credential_id,
      type: cred.credential_type as 'public-key',
      transports: cred.transports as AuthenticatorTransportFuture[],
    })) || [],
  })

  // Store challenge for verification
  await supabase
    .from('challenges')
    .upsert([{ user_id: user.id, value: options.challenge }], { onConflict: 'user_id' })
    .select('*')
    .maybeSingle()

  return c.json(options)
})

// POST /passkeys/verify - Verify passkey registration
passkeys.post('/verify', async (c) => {
  const user = c.get('user')
  const supabase = c.get('supabase')
  const data = await c.req.json()
  const { rpId, origin } = getWebAuthnConfig(c)

  // Get stored challenge
  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Delete challenge (one-time use)
  if (challenge) {
    await supabase.from('challenges').delete().eq('id', challenge.id)
  }

  const verificationOpts: VerifyRegistrationResponseOpts = {
    response: data,
    expectedChallenge: challenge?.value || '',
    expectedOrigin: origin,
    expectedRPID: rpId,
  }

  const verification = await verifyRegistrationResponse(verificationOpts)

  if (!verification.verified) {
    return c.json({ error: 'Verification failed' }, 400)
  }

  const { registrationInfo } = verification

  // Save credential to database
  const credentialData = {
    user_id: user.id,
    friendly_name: `Passkey created ${new Date().toLocaleString()}`,
    credential_type: registrationInfo?.credentialType || 'public-key',
    credential_id: registrationInfo?.credential.id || data.id,
    public_key: Buffer.from(registrationInfo?.credential.publicKey || []).toString('base64'),
    aaguid: registrationInfo?.aaguid,
    sign_count: registrationInfo?.credential.counter || 0,
    transports: data.response?.transports || [],
    user_verification_status: registrationInfo?.userVerified ? 'verified' : 'unverified',
    device_type: registrationInfo?.credentialDeviceType === 'singleDevice' ? 'single_device' : 'multi_device',
    backup_state: registrationInfo?.credentialBackedUp ? 'backed_up' : 'not_backed_up',
  }

  const { data: savedCredential } = await supabase
    .from('credentials')
    .insert([credentialData])
    .select('*')
    .maybeSingle()

  return c.json({
    credential_id: savedCredential?.credential_id,
    friendly_name: savedCredential?.friendly_name,
    credential_type: savedCredential?.credential_type,
    device_type: savedCredential?.device_type,
    backup_state: savedCredential?.backup_state,
    created_at: savedCredential?.created_at,
  }, 201)
})

// ============================================
// AUTHENTICATION ROUTES (no auth required)
// ============================================

// POST /auth/passkey - Start passkey authentication
passkeys.post('/passkey', async (c) => {
  const { rpId } = getWebAuthnConfig(c)

  const options = await generateAuthenticationOptions({
    rpID: rpId,
    userVerification: 'preferred',
    allowCredentials: [],
  })

  // Store challenge (without user_id since user is not authenticated yet)
  const { data: challenge } = await supabaseAdmin
    .from('challenges')
    .insert([{ value: options.challenge }])
    .select('*')
    .maybeSingle()

  return c.json({ ...options, challengeId: challenge?.id })
})

// POST /auth/passkey/verify - Verify passkey authentication
passkeys.post('/passkey/verify', async (c) => {
  const data = await c.req.json()
  const { challengeId } = data
  const { rpId, origin } = getWebAuthnConfig(c)

  // Get stored challenge
  const { data: challenge } = await supabaseAdmin
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .maybeSingle()

  // Delete challenge (one-time use)
  if (challenge) {
    await supabaseAdmin.from('challenges').delete().eq('id', challenge.id)
  }

  // Get credential from database
  const { data: credential } = await supabaseAdmin
    .from('credentials')
    .select('*')
    .eq('credential_id', data.id)
    .maybeSingle()

  if (!credential) {
    return c.json({ error: 'Credential not found' }, 404)
  }

  const verificationOpts: VerifyAuthenticationResponseOpts = {
    response: data,
    expectedChallenge: challenge?.value || '',
    expectedOrigin: origin,
    expectedRPID: rpId,
    credential: {
      id: credential.credential_id,
      publicKey: new Uint8Array(Buffer.from(credential.public_key, 'base64')),
      counter: credential.sign_count,
      transports: credential.transports as AuthenticatorTransportFuture[],
    },
    requireUserVerification: false,
  }

  const verification = await verifyAuthenticationResponse(verificationOpts)

  if (!verification.verified) {
    return c.json({ error: 'Authentication failed' }, 400)
  }

  // Get user from Supabase
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(credential.user_id)

  // Update credential's last used time and counter
  await supabaseAdmin
    .from('credentials')
    .update({
      sign_count: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq('credential_id', credential.credential_id)

  return c.json({ verified: true, user: userData?.user })
})

// POST /auth/demo-user - Create a demo user for testing (development only)
passkeys.post('/demo-user', async (c) => {
  const { email } = await c.req.json()

  if (!email) {
    return c.json({ error: 'Email is required' }, 400)
  }

  // Check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find((u) => u.email === email)

  let user
  if (existingUser) {
    user = existingUser
  } else {
    // Create a new user in Supabase Auth
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm for demo
      user_metadata: { display_name: 'Demo User' },
    })

    if (error) {
      return c.json({ error: error.message }, 400)
    }
    user = newUser.user
  }

  // Create a session token for the user
  const issuedAt = Math.floor(Date.now() / 1000)
  const expirationTime = issuedAt + 3600

  const payload = {
    iss: jwtIssuer,
    sub: user.id,
    aud: 'authenticated',
    exp: expirationTime,
    iat: issuedAt,
    email: user.email,
    phone: user.phone,
    app_metadata: user.app_metadata || {},
    user_metadata: user.user_metadata || {},
    role: 'authenticated',
    is_anonymous: false,
  }

  const accessToken = jwt.sign(payload, jwtSecret, {
    algorithm: 'HS256',
  })

  return c.json({
    user,
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 3600,
  }, 201)
})

// POST /auth/session - Create JWT session after passkey verification
passkeys.post('/session', async (c) => {
  const userData = await c.req.json()

  if (!userData?.id) {
    return c.json({ error: 'User data required' }, 400)
  }

  const issuedAt = Math.floor(Date.now() / 1000)
  const expirationTime = issuedAt + 3600 // 1 hour expiry

  const payload = {
    iss: jwtIssuer,
    sub: userData.id,
    aud: 'authenticated',
    exp: expirationTime,
    iat: issuedAt,
    email: userData.email,
    phone: userData.phone,
    app_metadata: userData.app_metadata || {},
    user_metadata: userData.user_metadata || {},
    role: 'authenticated',
    is_anonymous: false,
  }

  const accessToken = jwt.sign(payload, jwtSecret, {
    algorithm: 'HS256',
  })

  return c.json({
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 3600,
  })
})

export default passkeys
