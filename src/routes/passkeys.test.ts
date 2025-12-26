import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import passkeys from './passkeys'
import type { Variables } from '../types/hono'

// Mock SimpleWebAuthn server
vi.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: vi.fn(),
  verifyRegistrationResponse: vi.fn(),
  generateAuthenticationOptions: vi.fn(),
  verifyAuthenticationResponse: vi.fn(),
}))

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-jwt-token'),
  },
}))

// Mock supabase
vi.mock('../lib/supabase', () => ({
  createSupabaseClient: vi.fn(),
  supabaseAdmin: {
    from: vi.fn(),
    auth: { admin: { getUserById: vi.fn() } },
  },
}))

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import { supabaseAdmin } from '../lib/supabase'

describe('Passkey Registration Routes', () => {
  let app: Hono<{ Variables: Variables }>
  const mockUser = { id: 'user-123', email: 'test@example.com', user_metadata: { display_name: 'Test User' } }
  const mockSupabase = {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    app = new Hono<{ Variables: Variables }>()

    // Set up authenticated context for registration routes
    app.use('/passkeys/*', async (c, next) => {
      c.set('user', mockUser as any)
      c.set('supabase', mockSupabase as any)
      await next()
    })
    app.route('/passkeys', passkeys)
  })

  describe('POST /passkeys/challenge - Start Registration', () => {
    it('returns registration options for authenticated user', async () => {
      const mockOptions = {
        challenge: 'mock-challenge-base64',
        rp: { name: 'Test App', id: 'localhost' },
        user: { id: 'user-123', name: 'test@example.com', displayName: 'Test User' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        timeout: 60000,
        attestation: 'none',
      }

      vi.mocked(generateRegistrationOptions).mockResolvedValue(mockOptions as any)

      // Mock credentials lookup (no existing credentials)
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], count: 0 }),
        }),
      })

      // Mock challenge insert
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'challenge-1', value: 'mock-challenge-base64' } }),
        }),
      })
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'credentials') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], count: 0 }),
            }),
          }
        }
        if (table === 'challenges') {
          return { upsert: mockInsert }
        }
        return {}
      })

      const res = await app.request('/passkeys/challenge', { method: 'POST' })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.challenge).toBe('mock-challenge-base64')
      expect(generateRegistrationOptions).toHaveBeenCalled()
    })

    it('excludes existing credentials from registration options', async () => {
      const existingCredentials = [
        { credential_id: 'cred-1', credential_type: 'public-key', transports: ['internal'] },
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'credentials') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: existingCredentials, count: 1 }),
            }),
          }
        }
        if (table === 'challenges') {
          return {
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'challenge-1' } }),
              }),
            }),
          }
        }
        return {}
      })

      vi.mocked(generateRegistrationOptions).mockResolvedValue({ challenge: 'test' } as any)

      await app.request('/passkeys/challenge', { method: 'POST' })

      expect(generateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          excludeCredentials: expect.arrayContaining([
            expect.objectContaining({ id: 'cred-1' }),
          ]),
        })
      )
    })
  })

  describe('POST /passkeys/verify - Verify Registration', () => {
    it('verifies registration and saves credential', async () => {
      const mockVerification = {
        verified: true,
        registrationInfo: {
          credentialType: 'public-key',
          credential: {
            id: 'new-cred-id',
            publicKey: new Uint8Array([1, 2, 3]),
            counter: 0,
          },
          aaguid: 'test-aaguid',
          userVerified: true,
          credentialDeviceType: 'multiDevice',
          credentialBackedUp: true,
        },
      }

      vi.mocked(verifyRegistrationResponse).mockResolvedValue(mockVerification as any)

      // Mock challenge retrieval
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'challenges') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'challenge-1', value: 'stored-challenge' } }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'credentials') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: 'saved-cred-id',
                    credential_id: 'new-cred-id',
                    friendly_name: 'Passkey created',
                  },
                }),
              }),
            }),
          }
        }
        return {}
      })

      const res = await app.request('/passkeys/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'new-cred-id',
          rawId: 'base64-raw-id',
          response: { attestationObject: 'base64', clientDataJSON: 'base64', transports: ['internal'] },
          type: 'public-key',
        }),
      })
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.credential_id).toBe('new-cred-id')
      expect(verifyRegistrationResponse).toHaveBeenCalled()
    })

    it('returns 400 when verification fails', async () => {
      vi.mocked(verifyRegistrationResponse).mockResolvedValue({ verified: false } as any)

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'challenges') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'challenge-1', value: 'stored-challenge' } }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {}
      })

      const res = await app.request('/passkeys/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'cred-id', response: {} }),
      })
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.error).toBe('Verification failed')
    })
  })
})

describe('Passkey Authentication Routes', () => {
  let app: Hono<{ Variables: Variables }>

  beforeEach(() => {
    vi.clearAllMocks()
    app = new Hono<{ Variables: Variables }>()
    app.route('/auth', passkeys)
  })

  describe('POST /auth/passkey - Start Authentication', () => {
    it('returns authentication options', async () => {
      const mockOptions = {
        challenge: 'auth-challenge-base64',
        timeout: 60000,
        rpId: 'localhost',
        allowCredentials: [],
        userVerification: 'preferred',
      }

      vi.mocked(generateAuthenticationOptions).mockResolvedValue(mockOptions as any)

      // Mock challenge insert
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'auth-challenge-1' } }),
          }),
        }),
      } as any)

      const res = await app.request('/auth/passkey', { method: 'POST' })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.challenge).toBe('auth-challenge-base64')
      expect(json.challengeId).toBe('auth-challenge-1')
      expect(generateAuthenticationOptions).toHaveBeenCalled()
    })
  })

  describe('POST /auth/passkey/verify - Verify Authentication', () => {
    it('verifies authentication and returns user', async () => {
      const mockCredential = {
        credential_id: 'existing-cred',
        user_id: 'user-123',
        public_key: Buffer.from([1, 2, 3]).toString('base64'),
        sign_count: 5,
        transports: ['internal'],
      }

      const mockUser = { id: 'user-123', email: 'test@example.com' }

      vi.mocked(verifyAuthenticationResponse).mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 6 },
      } as any)

      // Mock Supabase operations
      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === 'challenges') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'challenge-1', value: 'stored-challenge' } }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any
        }
        if (table === 'credentials') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: mockCredential }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any
        }
        return {} as any
      })

      vi.mocked(supabaseAdmin.auth.admin.getUserById).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      const res = await app.request('/auth/passkey/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'existing-cred',
          challengeId: 'challenge-1',
          response: { authenticatorData: 'base64', clientDataJSON: 'base64', signature: 'base64' },
        }),
      })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.verified).toBe(true)
      expect(json.user.id).toBe('user-123')
    })

    it('returns 404 when credential not found', async () => {
      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === 'challenges') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'challenge-1', value: 'stored-challenge' } }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any
        }
        if (table === 'credentials') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              }),
            }),
          } as any
        }
        return {} as any
      })

      const res = await app.request('/auth/passkey/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'nonexistent-cred', challengeId: 'challenge-1', response: {} }),
      })
      const json = await res.json()

      expect(res.status).toBe(404)
      expect(json.error).toBe('Credential not found')
    })

    it('returns 400 when verification fails', async () => {
      vi.mocked(verifyAuthenticationResponse).mockResolvedValue({ verified: false } as any)

      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === 'challenges') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'challenge-1', value: 'stored-challenge' } }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any
        }
        if (table === 'credentials') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    credential_id: 'cred',
                    user_id: 'user-1',
                    public_key: 'key',
                    sign_count: 0,
                    transports: [],
                  },
                }),
              }),
            }),
          } as any
        }
        return {} as any
      })

      const res = await app.request('/auth/passkey/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'cred', challengeId: 'challenge-1', response: {} }),
      })
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.error).toBe('Authentication failed')
    })
  })

  describe('POST /auth/session - Create Session', () => {
    it('creates JWT session token for verified user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        phone: null,
        app_metadata: {},
        user_metadata: { display_name: 'Test' },
      }

      const res = await app.request('/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUser),
      })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.access_token).toBe('mock-jwt-token')
      expect(json.token_type).toBe('bearer')
      expect(json.expires_in).toBe(3600)
    })

    it('returns 400 when user data is missing', async () => {
      const res = await app.request('/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.error).toBe('User data required')
    })
  })
})
