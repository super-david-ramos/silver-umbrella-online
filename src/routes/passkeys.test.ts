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

// Mock db module
vi.mock('../lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
  queryRow: vi.fn()
}))

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import { query, queryOne, queryRow } from '../lib/db'

describe('Passkey Registration Routes', () => {
  let app: Hono<{ Variables: Variables }>
  const mockUser = { id: 'user-123', email: 'test@example.com', user_metadata: { display_name: 'Test User' } }

  beforeEach(() => {
    vi.clearAllMocks()
    app = new Hono<{ Variables: Variables }>()

    // Set up authenticated context for registration routes
    app.use('/passkeys/*', async (c, next) => {
      c.set('user', mockUser as any)
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
      }

      vi.mocked(generateRegistrationOptions).mockResolvedValue(mockOptions as any)
      vi.mocked(query).mockResolvedValueOnce([]) // no existing credentials
      vi.mocked(query).mockResolvedValueOnce([]) // upsert challenge

      const res = await app.request('/passkeys/challenge', { method: 'POST' })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.challenge).toBe('mock-challenge-base64')
      expect(generateRegistrationOptions).toHaveBeenCalled()
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
      vi.mocked(queryOne).mockResolvedValueOnce({ id: 'challenge-1', value: 'stored-challenge' })
      vi.mocked(query).mockResolvedValueOnce([]) // delete challenge
      vi.mocked(queryRow).mockResolvedValueOnce({
        credential_id: 'new-cred-id',
        friendly_name: 'Passkey created',
      })

      const res = await app.request('/passkeys/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'new-cred-id',
          response: { attestationObject: 'base64', clientDataJSON: 'base64', transports: ['internal'] },
        }),
      })
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.credential_id).toBe('new-cred-id')
    })

    it('returns 400 when verification fails', async () => {
      vi.mocked(verifyRegistrationResponse).mockResolvedValue({ verified: false } as any)
      vi.mocked(queryOne).mockResolvedValueOnce({ id: 'challenge-1', value: 'stored-challenge' })
      vi.mocked(query).mockResolvedValueOnce([]) // delete challenge

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
      }

      vi.mocked(generateAuthenticationOptions).mockResolvedValue(mockOptions as any)
      vi.mocked(queryRow).mockResolvedValueOnce({ id: 'auth-challenge-1' })

      const res = await app.request('/auth/passkey', { method: 'POST' })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.challenge).toBe('auth-challenge-base64')
      expect(json.challengeId).toBe('auth-challenge-1')
    })
  })

  describe('POST /auth/passkey/verify - Verify Authentication', () => {
    it('returns 404 when credential not found', async () => {
      vi.mocked(queryOne).mockResolvedValueOnce({ id: 'challenge-1', value: 'stored-challenge' })
      vi.mocked(query).mockResolvedValueOnce([]) // delete challenge
      vi.mocked(queryOne).mockResolvedValueOnce(null) // no credential found

      const res = await app.request('/auth/passkey/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'nonexistent-cred', challengeId: 'challenge-1', response: {} }),
      })
      const json = await res.json()

      expect(res.status).toBe(404)
      expect(json.error).toBe('Credential not found')
    })
  })

  describe('POST /auth/session - Create Session', () => {
    it('creates JWT session token for verified user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
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
