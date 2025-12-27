import { Outlet, useNavigate } from 'react-router-dom'
import { useDeviceContext } from '@/hooks/useDeviceContext'
import { useCreateNote } from '@/hooks/useNotes'
import { NoteList } from '@/features/notes/NoteList'
import { MobileNav } from './MobileNav'
import { FloatingActionButton } from './FloatingActionButton'

export function AppShell() {
  const { hasTouchScreen, isPortrait } = useDeviceContext()
  const createNote = useCreateNote()
  const navigate = useNavigate()

  const handleNewNote = async () => {
    const note = await createNote.mutateAsync({ title: 'Untitled' })
    navigate(`/note/${note.id}`)
  }

  const isMobileLayout = hasTouchScreen && isPortrait

  if (isMobileLayout) {
    return (
      <div className="h-screen-safe flex flex-col bg-background">
        <header className="h-14 flex items-center justify-between px-4 border-b">
          <h1 className="text-lg font-semibold">Notes</h1>
        </header>
        <main className="flex-1 overflow-auto pb-20">
          <Outlet />
        </main>
        <MobileNav />
        <FloatingActionButton onClick={handleNewNote} className="bottom-20" />
      </div>
    )
  }

  return (
    <div className="h-screen-safe flex bg-background">
      <aside className="w-72 border-r flex flex-col">
        <header className="h-14 flex items-center justify-between px-4 border-b">
          <h1 className="text-lg font-semibold">Notes</h1>
        </header>
        <div className="flex-1 overflow-auto">
          <NoteList />
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <FloatingActionButton onClick={handleNewNote} />
    </div>
  )
}
