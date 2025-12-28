import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Supabase automatically handles the hash fragment with tokens
    // We just need to wait for the session to be established
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          setError(error.message)
          return
        }

        if (data.session) {
          // Successfully authenticated, redirect to app
          navigate('/app', { replace: true })
        } else {
          // No session yet, wait for auth state change
          // This handles the case where the hash is being processed
          const timeout = setTimeout(() => {
            setError('Authentication timed out. Please try again.')
          }, 10000)

          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
              if (event === 'SIGNED_IN' && session) {
                clearTimeout(timeout)
                navigate('/app', { replace: true })
              }
            }
          )

          return () => {
            clearTimeout(timeout)
            subscription.unsubscribe()
          }
        }
      } catch (err) {
        setError('An unexpected error occurred')
      }
    }

    handleCallback()
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-primary underline"
          >
            Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  )
}
