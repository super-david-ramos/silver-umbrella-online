import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Hono } from 'hono'
import { sandboxMiddleware } from './sandbox'
import type { Variables } from '../types/hono'

// Mock supabase to avoid environment variable requirements
vi.mock('./supabase', () => ({
  createSupabaseClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } })
    }
  }))
}))

// Import authMiddleware after mocking
import { authMiddleware } from './middleware'

describe('Sandbox Integration with Auth Middleware', () => {
  let app: Hono<{ Variables: Variables & { isSandbox?: boolean } }>
  let originalEnv: string | undefined

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV
    app = new Hono<{ Variables: Variables & { isSandbox?: boolean } }>()
    // Apply sandbox middleware BEFORE auth middleware (as in index.ts)
    app.use('*', sandboxMiddleware, authMiddleware)
    app.get('/test', (c) => {
      const user = c.get('user')
      const isSandbox = c.get('isSandbox')
      return c.json({ user, isSandbox })
    })
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  it('skips auth when sandbox mode is active', async () => {
    process.env.NODE_ENV = 'development'

    const res = await app.request('/test', {
      headers: { 'X-Sandbox-Mode': 'true' }
    })
    const json = await res.json()

    // Should succeed without Authorization header (sandbox bypass)
    expect(res.status).toBe(200)
    expect(json.isSandbox).toBe(true)
    expect(json.user).toBeDefined()
    expect(json.user.id).toBe('sandbox-user-000')
  })

  it('requires auth when sandbox mode is not active', async () => {
    process.env.NODE_ENV = 'development'

    const res = await app.request('/test')
    const json = await res.json()

    // Should fail without Authorization header (normal auth flow)
    expect(res.status).toBe(401)
    expect(json.error).toBe('Missing authorization header')
  })

  it('disables sandbox in production and requires auth', async () => {
    process.env.NODE_ENV = 'production'

    const res = await app.request('/test', {
      headers: { 'X-Sandbox-Mode': 'true' }
    })
    const json = await res.json()

    // Should fail even with sandbox header in production
    expect(res.status).toBe(401)
    expect(json.error).toBe('Missing authorization header')
  })
})
