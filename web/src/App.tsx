import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext } from './lib/auth-context'
import { LandingPage } from './features/landing/LandingPage'
import { LoginPage } from './features/auth/LoginPage'
import { AppShell } from './components/layout/AppShell'
import { NoteList } from './features/notes/NoteList'
import { NoteEditor } from './features/notes/NoteEditor'
import { DemoProvider } from './features/demo/demo-context'
import { DemoAppShell } from './features/demo/DemoAppShell'
import { DemoNoteList } from './features/demo/DemoNoteList'
import { DemoNoteEditor } from './features/demo/DemoNoteEditor'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext()

  if (loading) {
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
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

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
    </BrowserRouter>
  )
}

export default App
