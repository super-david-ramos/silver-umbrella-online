export interface Note {
  id: string
  workspace_id: string
  title: string
  parent_id: string | null
  pinned: boolean
  metadata: Record<string, unknown>
  created_by: string
  created_at: string
  updated_at: string
}

export interface Block {
  id: string
  note_id: string
  parent_id: string | null
  type: 'paragraph' | 'heading' | 'todo' | 'code' | 'quote' | 'list_item'
  content: Record<string, unknown>
  position: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
}

export interface Workspace {
  id: string
  name: string
  created_at: string
}
