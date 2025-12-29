import { useState, useEffect, useRef, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'

const MAX_INIT_RETRIES = 3
const RETRY_DELAY_MS = 1000

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [workspaceReady, setWorkspaceReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const initializingRef = useRef(false)
  const currentAccessTokenRef = useRef<string | null>(null)

  // Initialize user workspace when session is available
  // Pass accessToken directly to avoid race condition with getSession()
  const initializeUser = useCallback(async (accessToken: string, retryCount = 0) => {
    if (initializingRef.current && currentAccessTokenRef.current === accessToken) return
    initializingRef.current = true
    currentAccessTokenRef.current = accessToken
    setInitError(null)

    try {
      const result = await api.user.init(accessToken)
      console.log('User initialized:', result.created ? 'new workspace created' : 'existing workspace')
      setWorkspaceReady(true)
      setInitError(null)
    } catch (error) {
      console.error(`Failed to initialize user (attempt ${retryCount + 1}/${MAX_INIT_RETRIES}):`, error)

      // Retry with exponential backoff
      if (retryCount < MAX_INIT_RETRIES - 1) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount)
        console.log(`Retrying in ${delay}ms...`)
        initializingRef.current = false
        await new Promise(resolve => setTimeout(resolve, delay))
        return initializeUser(accessToken, retryCount + 1)
      }

      // All retries failed
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize workspace'
      setInitError(errorMessage)
      // Set workspaceReady to true so the app can show the error state
      setWorkspaceReady(true)
    } finally {
      initializingRef.current = false
    }
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Initialize user if we have a session
      if (session?.access_token) {
        initializeUser(session.access_token)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        // Initialize user on sign in
        if (session?.access_token) {
          setWorkspaceReady(false)
          setInitError(null)
          initializeUser(session.access_token)
        } else {
          setWorkspaceReady(false)
          setInitError(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [initializeUser])

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const verifyOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  // Retry initialization - useful when init fails
  const retryInit = useCallback(async () => {
    if (session?.access_token) {
      setWorkspaceReady(false)
      setInitError(null)
      await initializeUser(session.access_token)
    }
  }, [session, initializeUser])

  return {
    user,
    session,
    loading,
    workspaceReady,
    initError,
    signInWithOtp,
    verifyOtp,
    signOut,
    retryInit,
  }
}
