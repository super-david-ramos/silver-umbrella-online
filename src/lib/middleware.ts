import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'
import { createSupabaseClient } from './supabase'

const jwtSecret = process.env.SUPABASE_AUTH_JWT_SECRET || 'your-jwt-secret'

interface JwtPayload {
  sub: string
  email?: string
  phone?: string
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
  role?: string
  aud?: string
  exp?: number
  iat?: number
  iss?: string
}

export async function authMiddleware(c: Context, next: Next) {
  // Skip authentication if sandbox mode is active
  if (c.get('isSandbox') === true && c.get('user')) {
    // Create a Supabase client for sandbox mode (without token)
    const supabase = createSupabaseClient()
    c.set('supabase', supabase)
    await next()
    return
  }

  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization header' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createSupabaseClient(token)

  // First try Supabase's getUser for real Supabase users
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!error && user) {
    c.set('user', user)
    c.set('supabase', supabase)
    await next()
    return
  }

  // Fall back to JWT verification for tokens created by our session endpoint
  // This allows demo users and passkey-authenticated users to work
  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload

    if (!decoded.sub) {
      return c.json({ error: 'Invalid or expired token' }, 401)
    }

    // Construct a user object from JWT payload
    const jwtUser = {
      id: decoded.sub,
      email: decoded.email,
      phone: decoded.phone,
      app_metadata: decoded.app_metadata || {},
      user_metadata: decoded.user_metadata || {},
      role: decoded.role || 'authenticated',
      aud: decoded.aud || 'authenticated',
    }

    c.set('user', jwtUser)
    c.set('supabase', supabase)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}
