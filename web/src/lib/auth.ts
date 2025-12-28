// Simple JWT-based auth manager

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export interface User {
  id: string
  email: string
  display_name?: string
}

export interface AuthSession {
  access_token: string
  user: User
  expires_in: number
}

// Get stored token
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

// Get stored user
export function getUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY)
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

// Store session
export function setSession(session: AuthSession): void {
  localStorage.setItem(TOKEN_KEY, session.access_token)
  localStorage.setItem(USER_KEY, JSON.stringify(session.user))
}

// Clear session
export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken()
}

// Create demo user via API
export async function createDemoUser(email: string): Promise<AuthSession> {
  const res = await fetch('/api/auth/demo-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to create demo user')
  }

  const data = await res.json()
  const session: AuthSession = {
    access_token: data.access_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      display_name: data.user.display_name,
    },
    expires_in: data.expires_in,
  }

  setSession(session)
  return session
}
