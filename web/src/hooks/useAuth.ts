import { useState, useEffect, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [workspaceReady, setWorkspaceReady] = useState(false)
  const initializingRef = useRef(false)

  // Initialize user workspace when session is available
  const initializeUser = async () => {
    if (initializingRef.current) return
    initializingRef.current = true

    try {
      const result = await api.user.init()
      console.log('User initialized:', result.created ? 'new workspace created' : 'existing workspace')
      setWorkspaceReady(true)
    } catch (error) {
      console.error('Failed to initialize user:', error)
      // Still set ready so the app can show error state
      setWorkspaceReady(true)
    } finally {
      initializingRef.current = false
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Initialize user if we have a session
      if (session?.user) {
        initializeUser()
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        // Initialize user on sign in
        if (session?.user) {
          setWorkspaceReady(false)
          initializeUser()
        } else {
          setWorkspaceReady(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

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

  return {
    user,
    session,
    loading,
    workspaceReady,
    signInWithOtp,
    verifyOtp,
    signOut,
  }
}
