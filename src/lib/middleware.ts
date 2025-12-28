import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'
import type { User } from '../types/hono'

const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret'

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
    await next()
    return
  }

  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization header' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload

    if (!decoded.sub) {
      return c.json({ error: 'Invalid or expired token' }, 401)
    }

    // Construct a user object from JWT payload
    const user: User = {
      id: decoded.sub,
      email: decoded.email,
      phone: decoded.phone,
      app_metadata: decoded.app_metadata || {},
      user_metadata: decoded.user_metadata || {},
      role: decoded.role || 'authenticated',
      aud: decoded.aud || 'authenticated',
    }

    c.set('user', user)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}
