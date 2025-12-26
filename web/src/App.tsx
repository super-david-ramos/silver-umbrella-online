import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext } from './lib/auth-context'
import { LoginPage } from './features/auth/LoginPage'
import { AppShell } from './components/layout/AppShell'
import { NoteList } from './features/notes/NoteList'

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
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<NoteList />} />
          <Route path="note/:id" element={<div className="p-4">Note Editor (coming next)</div>} />
          <Route path="search" element={<div className="p-4">Search (Phase 2)</div>} />
          <Route path="settings" element={<div className="p-4">Settings (Phase 2)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
