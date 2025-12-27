import { Outlet, useNavigate, Link } from 'react-router-dom'
import { Plus, LogIn } from 'lucide-react'
import { useDemoContext } from './demo-context'
import { useDeviceContext } from '@/hooks/useDeviceContext'
import { DemoNoteList } from './DemoNoteList'
import { Button } from '@/components/ui/button'

export function DemoAppShell() {
  const { hasTouchScreen, isPortrait } = useDeviceContext()
  const { createNote } = useDemoContext()
  const navigate = useNavigate()

  const handleNewNote = () => {
    const note = createNote()
    navigate(`/demo/note/${note.id}`)
  }

  const isMobileLayout = hasTouchScreen && isPortrait

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Demo Mode Banner */}
      <div className="bg-primary text-primary-foreground px-4 py-2 text-sm flex items-center justify-between">
        <span>Demo Mode - Notes saved locally in your browser</span>
        <Button asChild variant="secondary" size="sm">
          <Link to="/login">
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Link>
        </Button>
      </div>

      {isMobileLayout ? (
        // Mobile layout
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 flex items-center justify-between px-4 border-b shrink-0">
            <h1 className="text-lg font-semibold">Notes</h1>
            <Button size="icon" onClick={handleNewNote}>
              <Plus className="h-5 w-5" />
            </Button>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      ) : (
        // Desktop layout
        <div className="flex-1 flex overflow-hidden">
          <aside className="w-72 border-r flex flex-col shrink-0">
            <header className="h-14 flex items-center justify-between px-4 border-b">
              <h1 className="text-lg font-semibold">Notes</h1>
              <Button size="icon" variant="ghost" onClick={handleNewNote}>
                <Plus className="h-5 w-5" />
              </Button>
            </header>
            <div className="flex-1 overflow-auto">
              <DemoNoteList />
            </div>
          </aside>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      )}
    </div>
  )
}
