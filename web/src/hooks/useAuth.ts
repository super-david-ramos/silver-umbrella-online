import { useState, useEffect, useCallback } from 'react'
import {
  User,
  getUser,
  getToken,
  clearSession,
  createDemoUser,
  isAuthenticated,
} from '@/lib/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session from localStorage
    const storedUser = getUser()
    const token = getToken()

    if (storedUser && token) {
      setUser(storedUser)
    }
    setLoading(false)
  }, [])

  const signIn = useCallback(async (email: string) => {
    try {
      const session = await createDemoUser(email)
      setUser(session.user)
      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Sign in failed') }
    }
  }, [])

  const signOut = useCallback(async () => {
    clearSession()
    setUser(null)
    return { error: null }
  }, [])

  return {
    user,
    session: user ? { access_token: getToken() } : null,
    loading,
    isAuthenticated: isAuthenticated(),
    signIn,
    signOut,
  }
}
