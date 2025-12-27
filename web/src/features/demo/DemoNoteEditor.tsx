import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Trash2, Pin } from 'lucide-react'
import { useDemoContext } from './demo-context'
import { useDeviceContext } from '@/hooks/useDeviceContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function DemoNoteEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getNote, updateNote, deleteNote } = useDemoContext()
  const { hasTouchScreen, isPortrait } = useDeviceContext()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const note = id ? getNote(id) : undefined
  const isMobileLayout = hasTouchScreen && isPortrait

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
    }
  }, [note])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (id) {
      updateNote(id, { title: newTitle })
    }
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    if (id) {
      updateNote(id, { content: newContent })
    }
  }

  const handleDelete = () => {
    if (id && confirm('Delete this note?')) {
      deleteNote(id)
      navigate('/demo')
    }
  }

  const handleTogglePin = () => {
    if (id && note) {
      updateNote(id, { pinned: !note.pinned })
    }
  }

  if (!note) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Note not found
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 flex items-center gap-2 px-4 border-b shrink-0">
        {isMobileLayout && (
          <Button variant="ghost" size="icon" onClick={() => navigate('/demo')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="flex-1 border-0 text-lg font-medium focus-visible:ring-0"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleTogglePin}
          className={cn(note.pinned && 'text-primary')}
        >
          <Pin className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleDelete}>
          <Trash2 className="h-5 w-5 text-destructive" />
        </Button>
      </header>
      <main className="flex-1 overflow-auto p-4">
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Start typing..."
          className="w-full h-full min-h-[300px] resize-none bg-transparent outline-none text-base leading-relaxed"
        />
      </main>
    </div>
  )
}
