import { describe, it, expect, vi } from 'vitest'

// Mock supabase before importing app
vi.mock('./lib/supabase', () => ({
  supabaseAdmin: {},
  createSupabaseClient: vi.fn(() => ({
    auth: { getUser: vi.fn() },
    from: vi.fn()
  }))
}))

import app from './index'

describe('API health check', () => {
  it('returns status ok and version on GET /', async () => {
    const res = await app.request('/')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ status: 'ok', version: '1.0.0' })
  })
})
