import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface DemoNote {
  id: string
  title: string
  content: string
  pinned: boolean
  created_at: string
  updated_at: string
}

interface DemoContextType {
  notes: DemoNote[]
  createNote: (title?: string) => DemoNote
  updateNote: (id: string, updates: Partial<DemoNote>) => void
  deleteNote: (id: string) => void
  getNote: (id: string) => DemoNote | undefined
}

const DemoContext = createContext<DemoContextType | null>(null)

const STORAGE_KEY = 'notes-demo-data'

function generateId() {
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function loadFromStorage(): DemoNote[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch {
    // Ignore parse errors
  }
  // Return sample notes for first-time demo users
  return [
    {
      id: generateId(),
      title: 'Welcome to Notes!',
      content: 'This is a demo mode. Your notes are saved locally in your browser.\n\nTry creating a new note with the + button!',
      pinned: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: generateId(),
      title: 'Shopping List',
      content: '- [ ] Milk\n- [ ] Bread\n- [x] Eggs\n- [ ] Coffee',
      pinned: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: generateId(),
      title: 'Meeting Notes',
      content: 'Discussed Q1 roadmap\n\nAction items:\n- [ ] Review designs\n- [ ] Schedule follow-up',
      pinned: false,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ]
}

function saveToStorage(notes: DemoNote[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch {
    // Ignore storage errors
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<DemoNote[]>(loadFromStorage)

  const createNote = useCallback((title?: string) => {
    const newNote: DemoNote = {
      id: generateId(),
      title: title || 'Untitled',
      content: '',
      pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setNotes((prev) => {
      const updated = [newNote, ...prev]
      saveToStorage(updated)
      return updated
    })
    return newNote
  }, [])

  const updateNote = useCallback((id: string, updates: Partial<DemoNote>) => {
    setNotes((prev) => {
      const updated = prev.map((note) =>
        note.id === id
          ? { ...note, ...updates, updated_at: new Date().toISOString() }
          : note
      )
      saveToStorage(updated)
      return updated
    })
  }, [])

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const updated = prev.filter((note) => note.id !== id)
      saveToStorage(updated)
      return updated
    })
  }, [])

  const getNote = useCallback(
    (id: string) => notes.find((note) => note.id === id),
    [notes]
  )

  return (
    <DemoContext.Provider
      value={{ notes, createNote, updateNote, deleteNote, getNote }}
    >
      {children}
    </DemoContext.Provider>
  )
}

export function useDemoContext() {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error('useDemoContext must be used within DemoProvider')
  }
  return context
}
