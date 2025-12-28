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
import { query, queryOne, queryRow } from '../lib/db'
import type { Variables, User } from '../types/hono'
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server'
import { randomUUID } from 'crypto'

const passkeys = new Hono<{ Variables: Variables }>()

// Environment variables for WebAuthn
const rpName = process.env.WEBAUTHN_RELYING_PARTY_NAME || 'Notes App'
const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret'
const jwtIssuer = process.env.JWT_ISSUER || 'notes-app'

interface Credential {
  id: string
  user_id: string
  friendly_name: string
  credential_type: string
  credential_id: string
  public_key: string
  aaguid: string
  sign_count: number
  transports: string[]
  user_verification_status: string
  device_type: string
  backup_state: string
  created_at: string
  last_used_at: string
}

interface Challenge {
  id: string
  user_id: string | null
  value: string
  created_at: string
}

interface DbUser {
  id: string
  email: string
  display_name: string | null
  created_at: string
}

// WebAuthn configuration
function getWebAuthnConfig(c: { req: { header: (name: string) => string | undefined } }) {
  const envRpId = process.env.WEBAUTHN_RELYING_PARTY_ID
  const envOrigin = process.env.WEBAUTHN_RELYING_PARTY_ORIGIN

  if (envRpId && envOrigin) {
    return { rpId: envRpId, origin: envOrigin }
  }

  const host = c.req.header('host') || 'localhost:3000'
  const hostname = host.split(':')[0]
  const protocol = c.req.header('x-forwarded-proto') || 'http'

  const rpId = envRpId || hostname
  const origin = envOrigin || `${protocol}://${host}`

  if (!envRpId || !envOrigin) {
    console.warn(
      'WebAuthn: Using dynamic origin detection. Set WEBAUTHN_RELYING_PARTY_ID and WEBAUTHN_RELYING_PARTY_ORIGIN env vars for production.',
      { detectedRpId: rpId, detectedOrigin: origin }
    )
  }

  return { rpId, origin }
}

// ============================================
// REGISTRATION ROUTES (require authenticated user)
// ============================================

// POST /passkeys/challenge - Start passkey registration
passkeys.post('/challenge', async (c) => {
  const user = c.get('user')
  const { rpId } = getWebAuthnConfig(c)

  // Get existing credentials for this user (to exclude from registration)
  const credentials = await query<Credential>(
    'SELECT credential_id, credential_type, transports FROM credentials WHERE user_id = $1',
    [user.id]
  )

  const options = await generateRegistrationOptions({
    rpName,
    rpID: rpId,
    userName: user.email || user.id,
    userID: isoUint8Array.fromASCIIString(user.id),
    userDisplayName: user.user_metadata?.display_name as string || user.email || 'User',
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

  // Store challenge for verification (upsert)
  await query(
    `INSERT INTO challenges (user_id, value)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET value = $2, created_at = NOW()`,
    [user.id, options.challenge]
  )

  return c.json(options)
})

// POST /passkeys/verify - Verify passkey registration
passkeys.post('/verify', async (c) => {
  const user = c.get('user')
  const data = await c.req.json()
  const { rpId, origin } = getWebAuthnConfig(c)

  // Get stored challenge
  const challenge = await queryOne<Challenge>(
    'SELECT * FROM challenges WHERE user_id = $1',
    [user.id]
  )

  // Delete challenge (one-time use)
  if (challenge) {
    await query('DELETE FROM challenges WHERE id = $1', [challenge.id])
  }

  const verificationOpts: VerifyRegistrationResponseOpts = {
    response: data,
    expectedChallenge: challenge?.value || '',
    expectedOrigin: origin,
    expectedRPID: rpId,
  }

  let verification
  try {
    verification = await verifyRegistrationResponse(verificationOpts)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown verification error'
    console.error('Registration verification error:', errorMessage, { rpId, origin, expectedChallenge: challenge?.value ? '[present]' : '[missing]' })
    return c.json({ error: `Verification failed: ${errorMessage}` }, 400)
  }

  if (!verification.verified) {
    return c.json({ error: 'Verification failed' }, 400)
  }

  const { registrationInfo } = verification

  // Save credential to database
  const savedCredential = await queryRow<Credential>(
    `INSERT INTO credentials (
      user_id, friendly_name, credential_type, credential_id, public_key,
      aaguid, sign_count, transports, user_verification_status, device_type, backup_state
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      user.id,
      `Passkey created ${new Date().toLocaleString()}`,
      registrationInfo?.credentialType || 'public-key',
      registrationInfo?.credential.id || data.id,
      Buffer.from(registrationInfo?.credential.publicKey || []).toString('base64'),
      registrationInfo?.aaguid,
      registrationInfo?.credential.counter || 0,
      data.response?.transports || [],
      registrationInfo?.userVerified ? 'verified' : 'unverified',
      registrationInfo?.credentialDeviceType === 'singleDevice' ? 'single_device' : 'multi_device',
      registrationInfo?.credentialBackedUp ? 'backed_up' : 'not_backed_up',
    ]
  )

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
  const challenge = await queryRow<Challenge>(
    'INSERT INTO challenges (value) VALUES ($1) RETURNING *',
    [options.challenge]
  )

  return c.json({ ...options, challengeId: challenge?.id })
})

// POST /auth/passkey/verify - Verify passkey authentication
passkeys.post('/passkey/verify', async (c) => {
  const data = await c.req.json()
  const { challengeId } = data
  const { rpId, origin } = getWebAuthnConfig(c)

  // Get stored challenge
  const challenge = await queryOne<Challenge>(
    'SELECT * FROM challenges WHERE id = $1',
    [challengeId]
  )

  // Delete challenge (one-time use)
  if (challenge) {
    await query('DELETE FROM challenges WHERE id = $1', [challenge.id])
  }

  // Get credential from database
  const credential = await queryOne<Credential>(
    'SELECT * FROM credentials WHERE credential_id = $1',
    [data.id]
  )

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

  let verification
  try {
    verification = await verifyAuthenticationResponse(verificationOpts)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown verification error'
    console.error('Authentication verification error:', errorMessage, { rpId, origin })
    return c.json({ error: `Authentication failed: ${errorMessage}` }, 400)
  }

  if (!verification.verified) {
    return c.json({ error: 'Authentication failed' }, 400)
  }

  // Get user from database
  const dbUser = await queryOne<DbUser>(
    'SELECT * FROM users WHERE id = $1',
    [credential.user_id]
  )

  // Update credential's last used time and counter
  await query(
    `UPDATE credentials SET sign_count = $1, last_used_at = NOW()
     WHERE credential_id = $2`,
    [verification.authenticationInfo.newCounter, credential.credential_id]
  )

  return c.json({ verified: true, user: dbUser })
})

// POST /auth/demo-user - Create a demo user for testing
passkeys.post('/demo-user', async (c) => {
  const { email } = await c.req.json()

  if (!email) {
    return c.json({ error: 'Email is required' }, 400)
  }

  // Check if user already exists
  let user = await queryOne<DbUser>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  )

  if (!user) {
    // Create a new user
    user = await queryRow<DbUser>(
      `INSERT INTO users (id, email, display_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [randomUUID(), email, 'Demo User']
    )

    if (!user) {
      return c.json({ error: 'Failed to create user' }, 500)
    }

    // Create default workspace and membership
    const workspaceId = randomUUID()
    await query(
      `INSERT INTO workspaces (id, name) VALUES ($1, $2)`,
      [workspaceId, 'Personal']
    )
    await query(
      `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)`,
      [workspaceId, user.id, 'owner']
    )
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
    user_metadata: { display_name: user.display_name },
    role: 'authenticated',
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
    user_metadata: userData.user_metadata || {},
    role: 'authenticated',
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
