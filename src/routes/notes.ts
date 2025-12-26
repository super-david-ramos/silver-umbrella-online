import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../lib/middleware'
import type { Variables } from '../types/hono'
import { SANDBOX_WORKSPACE_ID } from '../lib/sandbox'

const createNoteSchema = z.object({
  title: z.string().optional().default('Untitled'),
  parent_id: z.string().uuid().nullable().optional(),
})

const updateNoteSchema = z.object({
  title: z.string().optional(),
  pinned: z.boolean().optional(),
  parent_id: z.string().uuid().nullable().optional(),
})

const notes = new Hono<{ Variables: Variables }>()

notes.use('*', authMiddleware)

// List notes
notes.get('/', async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const isSandbox = c.get('isSandbox')

  // In sandbox mode, use the sandbox workspace directly
  let workspaceId: string
  if (isSandbox) {
    workspaceId = SANDBOX_WORKSPACE_ID
  } else {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return c.json({ error: 'No workspace found' }, 404)
    }
    workspaceId = membership.workspace_id
  }

  const { data: notesList, error } = await supabase
    .from('notes')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json(notesList)
})

// Get single note with blocks
notes.get('/:id', async (c) => {
  const supabase = c.get('supabase')
  const id = c.req.param('id')

  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single()

  if (noteError || !note) {
    return c.json({ error: 'Note not found' }, 404)
  }

  const { data: blocks, error: blocksError } = await supabase
    .from('blocks')
    .select('*')
    .eq('note_id', id)
    .order('position')

  if (blocksError) {
    return c.json({ error: blocksError.message }, 500)
  }

  return c.json({ ...note, blocks })
})

// Create note
notes.post('/', zValidator('json', createNoteSchema), async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const body = c.req.valid('json')
  const isSandbox = c.get('isSandbox')

  // In sandbox mode, use the sandbox workspace directly
  let workspaceId: string
  if (isSandbox) {
    workspaceId = SANDBOX_WORKSPACE_ID
  } else {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return c.json({ error: 'No workspace found' }, 404)
    }
    workspaceId = membership.workspace_id
  }

  const { data: note, error } = await supabase
    .from('notes')
    .insert({
      workspace_id: workspaceId,
      title: body.title,
      parent_id: body.parent_id,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  // Create initial empty paragraph block
  await supabase
    .from('blocks')
    .insert({
      note_id: note.id,
      type: 'paragraph',
      content: { text: '' },
      position: 'a0',
    })

  return c.json(note, 201)
})

// Update note
notes.patch('/:id', zValidator('json', updateNoteSchema), async (c) => {
  const supabase = c.get('supabase')
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const { data: note, error } = await supabase
    .from('notes')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json(note)
})

// Delete note
notes.delete('/:id', async (c) => {
  const supabase = c.get('supabase')
  const id = c.req.param('id')

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json({ success: true })
})

export default notes
