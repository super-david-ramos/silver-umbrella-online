import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../lib/middleware'
import type { Variables } from '../types/hono'
import { SANDBOX_WORKSPACE_ID } from '../lib/sandbox'
import { query, queryOne, queryRow } from '../lib/db'

const createNoteSchema = z.object({
  title: z.string().optional().default('Untitled'),
  parent_id: z.string().uuid().nullable().optional(),
})

const updateNoteSchema = z.object({
  title: z.string().optional(),
  pinned: z.boolean().optional(),
  parent_id: z.string().uuid().nullable().optional(),
})

interface Note {
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

interface Block {
  id: string
  note_id: string
  type: string
  content: Record<string, unknown>
  position: string
  parent_id: string | null
  workspace_id: string | null
  created_at: string
  updated_at: string
}

interface WorkspaceMember {
  workspace_id: string
}

const notes = new Hono<{ Variables: Variables }>()

notes.use('*', authMiddleware)

// List notes
notes.get('/', async (c) => {
  const user = c.get('user')
  const isSandbox = c.get('isSandbox')

  // In sandbox mode, use the sandbox workspace directly
  let workspaceId: string
  if (isSandbox) {
    workspaceId = SANDBOX_WORKSPACE_ID
  } else {
    const membership = await queryOne<WorkspaceMember>(
      'SELECT workspace_id FROM workspace_members WHERE user_id = $1 LIMIT 1',
      [user.id]
    )

    if (!membership) {
      return c.json({ error: 'No workspace found' }, 404)
    }
    workspaceId = membership.workspace_id
  }

  const notesList = await query<Note>(
    'SELECT * FROM notes WHERE workspace_id = $1 ORDER BY updated_at DESC',
    [workspaceId]
  )

  return c.json(notesList)
})

// Get single note with blocks
notes.get('/:id', async (c) => {
  const id = c.req.param('id')

  const note = await queryOne<Note>(
    'SELECT * FROM notes WHERE id = $1',
    [id]
  )

  if (!note) {
    return c.json({ error: 'Note not found' }, 404)
  }

  const blocks = await query<Block>(
    'SELECT * FROM blocks WHERE note_id = $1 ORDER BY position',
    [id]
  )

  return c.json({ ...note, blocks })
})

// Create note
notes.post('/', zValidator('json', createNoteSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')
  const isSandbox = c.get('isSandbox')

  // In sandbox mode, use the sandbox workspace directly
  let workspaceId: string
  if (isSandbox) {
    workspaceId = SANDBOX_WORKSPACE_ID
  } else {
    const membership = await queryOne<WorkspaceMember>(
      'SELECT workspace_id FROM workspace_members WHERE user_id = $1 LIMIT 1',
      [user.id]
    )

    if (!membership) {
      return c.json({ error: 'No workspace found' }, 404)
    }
    workspaceId = membership.workspace_id
  }

  const note = await queryRow<Note>(
    `INSERT INTO notes (workspace_id, title, parent_id, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [workspaceId, body.title, body.parent_id ?? null, user.id]
  )

  if (!note) {
    return c.json({ error: 'Failed to create note' }, 500)
  }

  // Create initial empty paragraph block
  await queryRow(
    `INSERT INTO blocks (note_id, type, content, position)
     VALUES ($1, $2, $3, $4)`,
    [note.id, 'paragraph', JSON.stringify({ text: '' }), 'a0']
  )

  return c.json(note, 201)
})

// Update note
notes.patch('/:id', zValidator('json', updateNoteSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')

  // Build dynamic update query
  const updates: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  if (body.title !== undefined) {
    updates.push(`title = $${paramIndex++}`)
    values.push(body.title)
  }
  if (body.pinned !== undefined) {
    updates.push(`pinned = $${paramIndex++}`)
    values.push(body.pinned)
  }
  if (body.parent_id !== undefined) {
    updates.push(`parent_id = $${paramIndex++}`)
    values.push(body.parent_id)
  }

  if (updates.length === 0) {
    const note = await queryOne<Note>('SELECT * FROM notes WHERE id = $1', [id])
    return c.json(note)
  }

  values.push(id)
  const note = await queryRow<Note>(
    `UPDATE notes SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  )

  if (!note) {
    return c.json({ error: 'Note not found' }, 404)
  }

  return c.json(note)
})

// Delete note
notes.delete('/:id', async (c) => {
  const id = c.req.param('id')

  await query('DELETE FROM notes WHERE id = $1', [id])

  return c.json({ success: true })
})

export default notes
