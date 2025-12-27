import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface NoteCardProps {
  note: {
    id: string
    title: string
    updated_at: string
    pinned: boolean
  }
  onClick: () => void
  isActive?: boolean
}

export function NoteCard({ note, onClick, isActive }: NoteCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 border-b border-border',
        'hover:bg-accent/50 transition-colors',
        'touch-target',
        isActive && 'bg-accent'
      )}
    >
      <h3 className="font-medium truncate">{note.title || 'Untitled'}</h3>
      <p className="text-sm text-muted-foreground mt-1">
        {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
      </p>
    </button>
  )
}
