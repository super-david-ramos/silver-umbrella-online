import { useNavigate, useParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useDemoContext } from './demo-context'
import { cn } from '@/lib/utils'

export function DemoNoteList() {
  const { notes } = useDemoContext()
  const navigate = useNavigate()
  const { id: activeId } = useParams()

  if (!notes.length) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No notes yet. Create your first note!
      </div>
    )
  }

  // Sort by pinned first, then by updated_at
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  return (
    <div className="divide-y divide-border">
      {sortedNotes.map((note) => (
        <button
          key={note.id}
          onClick={() => navigate(`/demo/note/${note.id}`)}
          className={cn(
            'w-full text-left p-4 border-b border-border',
            'hover:bg-accent/50 transition-colors',
            'min-h-[44px]',
            activeId === note.id && 'bg-accent'
          )}
        >
          <div className="flex items-center gap-2">
            {note.pinned && <span className="text-xs">📌</span>}
            <h3 className="font-medium truncate flex-1">
              {note.title || 'Untitled'}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {note.content.split('\n')[0] || 'Empty note'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
          </p>
        </button>
      ))}
    </div>
  )
}
