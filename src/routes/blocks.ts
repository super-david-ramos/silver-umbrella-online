import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../lib/middleware'
import type { Variables } from '../types/hono'

const blockTypes = ['paragraph', 'heading', 'todo', 'code', 'quote', 'list_item'] as const

const createBlockSchema = z.object({
  type: z.enum(blockTypes).optional().default('paragraph'),
  content: z.record(z.string(), z.unknown()).optional().default({}),
  parent_id: z.string().uuid().nullable().optional(),
  position: z.string(),
})

const updateBlockSchema = z.object({
  type: z.enum(blockTypes).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  parent_id: z.string().uuid().nullable().optional(),
  position: z.string().optional(),
})

const reorderSchema = z.object({
  updates: z.array(z.object({
    id: z.string().uuid(),
    position: z.string(),
  })),
})

const blocks = new Hono<{ Variables: Variables }>()

blocks.use('*', authMiddleware)

// Create block in note
blocks.post('/notes/:noteId/blocks', zValidator('json', createBlockSchema), async (c) => {
  const supabase = c.get('supabase')
  const noteId = c.req.param('noteId')
  const body = c.req.valid('json')

  const { data: block, error } = await supabase
    .from('blocks')
    .insert({
      note_id: noteId,
      type: body.type,
      content: body.content,
      parent_id: body.parent_id,
      position: body.position,
    })
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json(block, 201)
})

// Batch reorder blocks (must be before /:id to avoid route conflict)
blocks.patch('/reorder', zValidator('json', reorderSchema), async (c) => {
  const supabase = c.get('supabase')
  const { updates } = c.req.valid('json')

  // Update each block's position
  const results = await Promise.all(
    updates.map(({ id, position }) =>
      supabase
        .from('blocks')
        .update({ position })
        .eq('id', id)
    )
  )

  const errors = results.filter((r: { error: unknown }) => r.error)
  if (errors.length > 0) {
    return c.json({ error: 'Some updates failed' }, 500)
  }

  return c.json({ success: true })
})

// Update block
blocks.patch('/:id', zValidator('json', updateBlockSchema), async (c) => {
  const supabase = c.get('supabase')
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const { data: block, error } = await supabase
    .from('blocks')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json(block)
})

// Delete block
blocks.delete('/:id', async (c) => {
  const supabase = c.get('supabase')
  const id = c.req.param('id')

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('id', id)

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json({ success: true })
})

export default blocks
