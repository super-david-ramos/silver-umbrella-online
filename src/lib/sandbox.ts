import { Context, Next } from 'hono'
import type { User } from '@supabase/supabase-js'

// Sandbox constants
export const SANDBOX_USER_ID = 'sandbox-user-000'
export const SANDBOX_WORKSPACE_ID = 'sandbox-workspace-000'

// Sandbox user object matching Supabase User type
export const SANDBOX_USER: User = {
  id: SANDBOX_USER_ID,
  email: 'sandbox@testing.local',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2025-01-01T00:00:00Z',
  app_metadata: { workspace_id: SANDBOX_WORKSPACE_ID },
  user_metadata: { name: 'Sandbox User' },
}

/**
 * Sandbox middleware - allows bypassing auth for testing purposes
 * Activates when:
 * - X-Sandbox-Mode: true header is present, OR
 * - ?sandbox=true query parameter is present
 * - AND (NODE_ENV !== 'production' OR ENABLE_SANDBOX === 'true')
 */
export async function sandboxMiddleware(c: Context, next: Next) {
  // Block sandbox mode in production unless explicitly enabled
  const sandboxEnabled = process.env.ENABLE_SANDBOX === 'true'
  if (process.env.NODE_ENV === 'production' && !sandboxEnabled) {
    await next()
    return
  }

  // Check for sandbox mode activation
  const headerValue = c.req.header('X-Sandbox-Mode')
  const queryParam = c.req.query('sandbox')

  const isSandboxRequested = headerValue === 'true' || queryParam === 'true'

  if (isSandboxRequested) {
    // Set sandbox user and flag in context
    c.set('user', SANDBOX_USER)
    c.set('isSandbox', true)

    // Log sandbox mode activation
    console.log('[SANDBOX] Request using sandbox mode')
  }

  await next()
}
