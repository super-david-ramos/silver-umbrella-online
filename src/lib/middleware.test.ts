import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { authMiddleware } from './middleware'
import type { Variables } from '../types/hono'

// Mock the supabase module
vi.mock('./supabase', () => ({
  createSupabaseClient: vi.fn((token: string) => ({
    auth: {
      getUser: vi.fn()
    }
  }))
}))

import { createSupabaseClient } from './supabase'

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
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Invalid token')
        })
      }
    }
    vi.mocked(createSupabaseClient).mockReturnValue(mockSupabase as any)

    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer invalid-token' }
    })
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: 'Invalid or expired token' })
  })

  it('sets user and supabase on context when token is valid', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    }
    vi.mocked(createSupabaseClient).mockReturnValue(mockSupabase as any)

    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer valid-token' }
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.message).toBe('success')
    expect(json.user).toEqual(mockUser)
  })

  it('passes supabase client to context', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    }
    vi.mocked(createSupabaseClient).mockReturnValue(mockSupabase as any)

    // Create app that uses supabase from context
    const testApp = new Hono<{ Variables: Variables }>()
    testApp.use('*', authMiddleware)
    testApp.get('/test', (c) => {
      const supabase = c.get('supabase')
      return c.json({ hasSupabase: !!supabase })
    })

    const res = await testApp.request('/test', {
      headers: { Authorization: 'Bearer valid-token' }
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.hasSupabase).toBe(true)
  })
})
