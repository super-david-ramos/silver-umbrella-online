import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useNote, useUpdateNote } from '@/hooks/useNote'
import { useDeleteNote } from '@/hooks/useNotes'
import { useDeviceContext } from '@/hooks/useDeviceContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Editor } from '@/components/editor/Editor'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'

export function NoteEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: note, isLoading, error } = useNote(id!)
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const { hasTouchScreen, isPortrait } = useDeviceContext()
  const [title, setTitle] = useState('')

  const isMobileLayout = hasTouchScreen && isPortrait

  useEffect(() => {
    if (note?.title) {
      setTitle(note.title)
    }
  }, [note?.title])

  const debouncedUpdateTitle = useDebouncedCallback((newTitle: string) => {
    if (id && newTitle !== note?.title) {
      updateNote.mutate({ id, title: newTitle })
    }
  }, 500)

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    debouncedUpdateTitle(newTitle)
  }

  const handleDelete = async () => {
    if (id && confirm('Delete this note?')) {
      await deleteNote.mutateAsync(id)
      navigate('/app')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="p-4 text-center text-destructive">
        Note not found
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 flex items-center gap-2 px-4 border-b shrink-0">
        {isMobileLayout && (
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="flex-1 border-0 text-lg font-medium focus-visible:ring-0"
        />
        <Button variant="ghost" size="icon" onClick={handleDelete}>
          <Trash2 className="h-5 w-5 text-destructive" />
        </Button>
      </header>
      <main className="flex-1 overflow-auto">
        <Editor />
      </main>
    </div>
  )
}
