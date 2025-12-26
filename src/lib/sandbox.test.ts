import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import { sandboxMiddleware, SANDBOX_USER } from './sandbox'
import type { Variables } from '../types/hono'

describe('sandboxMiddleware', () => {
  let app: Hono<{ Variables: Variables & { isSandbox?: boolean } }>
  let originalEnv: string | undefined
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    originalEnv = process.env.NODE_ENV
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    app = new Hono<{ Variables: Variables & { isSandbox?: boolean } }>()
    app.use('*', sandboxMiddleware)
    app.get('/test', (c) => {
      const user = c.get('user')
      const isSandbox = c.get('isSandbox')
      return c.json({ user, isSandbox })
    })
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    consoleLogSpy.mockRestore()
  })

  it('activates on X-Sandbox-Mode: true header', async () => {
    process.env.NODE_ENV = 'development'

    const res = await app.request('/test', {
      headers: { 'X-Sandbox-Mode': 'true' }
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.user).toEqual(SANDBOX_USER)
    expect(json.isSandbox).toBe(true)
    expect(consoleLogSpy).toHaveBeenCalledWith('[SANDBOX] Request using sandbox mode')
  })

  it('activates on ?sandbox=true query param', async () => {
    process.env.NODE_ENV = 'development'

    const res = await app.request('/test?sandbox=true')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.user).toEqual(SANDBOX_USER)
    expect(json.isSandbox).toBe(true)
    expect(consoleLogSpy).toHaveBeenCalledWith('[SANDBOX] Request using sandbox mode')
  })

  it('is disabled when NODE_ENV === production', async () => {
    process.env.NODE_ENV = 'production'

    const res = await app.request('/test', {
      headers: { 'X-Sandbox-Mode': 'true' }
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.user).toBeUndefined()
    expect(json.isSandbox).toBeUndefined()
    expect(consoleLogSpy).not.toHaveBeenCalled()
  })

  it('is disabled for ?sandbox=true in production', async () => {
    process.env.NODE_ENV = 'production'

    const res = await app.request('/test?sandbox=true')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.user).toBeUndefined()
    expect(json.isSandbox).toBeUndefined()
    expect(consoleLogSpy).not.toHaveBeenCalled()
  })

  it('sets correct user context with all required fields', async () => {
    process.env.NODE_ENV = 'development'

    const res = await app.request('/test', {
      headers: { 'X-Sandbox-Mode': 'true' }
    })
    const json = await res.json()

    expect(json.user).toHaveProperty('id')
    expect(json.user).toHaveProperty('email')
    expect(json.user.id).toBe('sandbox-user-000')
    expect(json.user.email).toBe('sandbox@testing.local')
    expect(json.user.app_metadata.workspace_id).toBe('sandbox-workspace-000')
    expect(json.user.user_metadata.name).toBe('Sandbox User')
  })

  it('passes through when not in sandbox mode', async () => {
    process.env.NODE_ENV = 'development'

    const res = await app.request('/test')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.user).toBeUndefined()
    expect(json.isSandbox).toBeUndefined()
    expect(consoleLogSpy).not.toHaveBeenCalled()
  })

  it('does not activate with X-Sandbox-Mode: false', async () => {
    process.env.NODE_ENV = 'development'

    const res = await app.request('/test', {
      headers: { 'X-Sandbox-Mode': 'false' }
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.user).toBeUndefined()
    expect(json.isSandbox).toBeUndefined()
    expect(consoleLogSpy).not.toHaveBeenCalled()
  })

  it('does not activate with ?sandbox=false', async () => {
    process.env.NODE_ENV = 'development'

    const res = await app.request('/test?sandbox=false')
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.user).toBeUndefined()
    expect(json.isSandbox).toBeUndefined()
    expect(consoleLogSpy).not.toHaveBeenCalled()
  })
})
