import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuthContext } from './lib/auth-context'
import { supabase } from './lib/supabase'
import { LandingPage } from './features/landing/LandingPage'
import { LoginPage } from './features/auth/LoginPage'
import { AuthCallback } from './features/auth/AuthCallback'
import { AppShell } from './components/layout/AppShell'
import { NoteList } from './features/notes/NoteList'
import { NoteEditor } from './features/notes/NoteEditor'
import { DemoProvider } from './features/demo/demo-context'
import { DemoAppShell } from './features/demo/DemoAppShell'
import { DemoNoteList } from './features/demo/DemoNoteList'
import { DemoNoteEditor } from './features/demo/DemoNoteEditor'

// Handle auth tokens in URL hash (magic link redirect fallback)
function AuthHashHandler({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    // Check if URL hash contains auth tokens (from magic link)
    const hash = window.location.hash
    if (hash && (hash.includes('access_token=') || hash.includes('type=magiclink') || hash.includes('type=signup') || hash.includes('type=recovery'))) {
      // Don't process if we're already on the callback page
      if (location.pathname === '/auth/callback') {
        return
      }

      setProcessing(true)

      // Supabase client automatically processes the hash when we call getSession
      // We just need to wait for it and then redirect
      const handleHashAuth = async () => {
        // Give Supabase a moment to process the hash
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              // Clear the hash and redirect to app
              window.history.replaceState(null, '', window.location.pathname)
              navigate('/app', { replace: true })
              subscription.unsubscribe()
            }
          }
        )

        // Also check if session is already available
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          window.history.replaceState(null, '', window.location.pathname)
          navigate('/app', { replace: true })
          subscription.unsubscribe()
        }

        // Timeout fallback
        setTimeout(() => {
          setProcessing(false)
          subscription.unsubscribe()
        }, 10000)
      }

      handleHashAuth()
    }
  }, [navigate, location.pathname])

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Signing you in...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, workspaceReady } = useAuthContext()

  if (loading || (user && !workspaceReady)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <AuthHashHandler>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Demo mode - no auth required */}
        <Route
          path="/demo"
          element={
            <DemoProvider>
              <DemoAppShell />
            </DemoProvider>
          }
        >
          <Route index element={<DemoNoteList />} />
          <Route path="note/:id" element={<DemoNoteEditor />} />
        </Route>

        {/* Authenticated app */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<NoteList />} />
          <Route path="note/:id" element={<NoteEditor />} />
          <Route path="search" element={<div className="p-4">Search (Phase 2)</div>} />
          <Route path="settings" element={<div className="p-4">Settings (Phase 2)</div>} />
        </Route>

        {/* Redirect old routes */}
        <Route path="/note/:id" element={<Navigate to="/app/note/:id" replace />} />
      </Routes>
      </AuthHashHandler>
    </BrowserRouter>
  )
}

export default App
