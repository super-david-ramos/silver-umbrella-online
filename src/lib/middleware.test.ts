import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import jwt from 'jsonwebtoken'
import { authMiddleware } from './middleware'
import type { Variables } from '../types/hono'

const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret'

describe('authMiddleware', () => {
  let app: Hono<{ Variables: Variables }>

  beforeEach(() => {
    vi.clearAllMocks()
    app = new Hono<{ Variables: Variables }>()
    app.use('*', authMiddleware)
    app.get('/protected', (c) => c.json({ message: 'success', user: c.get('user') }))
  })

  it('returns 401 when Authorization header is missing', async () => {
    const res = await app.request('/protected')
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: 'Missing authorization header' })
  })

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: 'Basic abc123' }
    })
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: 'Missing authorization header' })
  })

  it('returns 401 when token is invalid', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer invalid-token' }
    })
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: 'Invalid or expired token' })
  })

  it('sets user on context when JWT token is valid', async () => {
    const validToken = jwt.sign(
      {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'authenticated',
        aud: 'authenticated'
      },
      jwtSecret,
      { expiresIn: '1h' }
    )

    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${validToken}` }
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.message).toBe('success')
    expect(json.user.id).toBe('user-123')
    expect(json.user.email).toBe('test@example.com')
  })

  it('returns 401 when JWT is expired', async () => {
    const expiredToken = jwt.sign(
      { sub: 'user-123', email: 'test@example.com' },
      jwtSecret,
      { expiresIn: '-1h' }
    )

    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${expiredToken}` }
    })
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: 'Invalid or expired token' })
  })

  it('returns 401 when JWT has wrong signature', async () => {
    const wrongSecretToken = jwt.sign(
      { sub: 'user-123', email: 'test@example.com' },
      'wrong-secret',
      { expiresIn: '1h' }
    )

    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${wrongSecretToken}` }
    })
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: 'Invalid or expired token' })
  })

  it('allows sandbox mode when user is already set', async () => {
    const sandboxApp = new Hono<{ Variables: Variables }>()

    // Middleware that sets sandbox context before authMiddleware
    sandboxApp.use('*', async (c, next) => {
      c.set('isSandbox', true)
      c.set('user', { id: 'sandbox-user', email: 'sandbox@test.local' })
      await next()
    })
    sandboxApp.use('*', authMiddleware)
    sandboxApp.get('/protected', (c) => c.json({ message: 'success', user: c.get('user') }))

    const res = await sandboxApp.request('/protected')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.message).toBe('success')
    expect(json.user.id).toBe('sandbox-user')
  })
})
