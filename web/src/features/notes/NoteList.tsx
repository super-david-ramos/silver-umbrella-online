import { useNavigate, useParams } from 'react-router-dom'
import { useNotes } from '@/hooks/useNotes'
import { NoteCard } from './NoteCard'

export function NoteList() {
  const { data: notes, isLoading, error } = useNotes()
  const navigate = useNavigate()
  const { id: activeId } = useParams()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Failed to load notes
      </div>
    )
  }

  if (!notes?.length) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No notes yet. Create your first note!
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onClick={() => navigate(`/app/note/${note.id}`)}
          isActive={note.id === activeId}
        />
      ))}
    </div>
  )
}
