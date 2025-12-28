import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../lib/middleware'
import type { Variables } from '../types/hono'
import { query, queryRow } from '../lib/db'

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

const blocks = new Hono<{ Variables: Variables }>()

blocks.use('*', authMiddleware)

// Create block in note
blocks.post('/notes/:noteId/blocks', zValidator('json', createBlockSchema), async (c) => {
  const noteId = c.req.param('noteId')
  const body = c.req.valid('json')

  const block = await queryRow<Block>(
    `INSERT INTO blocks (note_id, type, content, parent_id, position)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [noteId, body.type, JSON.stringify(body.content), body.parent_id ?? null, body.position]
  )

  if (!block) {
    return c.json({ error: 'Failed to create block' }, 500)
  }

  return c.json(block, 201)
})

// Batch reorder blocks (must be before /:id to avoid route conflict)
blocks.patch('/reorder', zValidator('json', reorderSchema), async (c) => {
  const { updates } = c.req.valid('json')

  // Update each block's position
  const results = await Promise.all(
    updates.map(({ id, position }) =>
      query(
        'UPDATE blocks SET position = $1, updated_at = NOW() WHERE id = $2',
        [position, id]
      )
    )
  )

  // Check if all updates succeeded (no errors thrown = success)
  if (results.some((r) => r === null)) {
    return c.json({ error: 'Some updates failed' }, 500)
  }

  return c.json({ success: true })
})

// Update block
blocks.patch('/:id', zValidator('json', updateBlockSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')

  // Build dynamic update query
  const updates: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  if (body.type !== undefined) {
    updates.push(`type = $${paramIndex++}`)
    values.push(body.type)
  }
  if (body.content !== undefined) {
    updates.push(`content = $${paramIndex++}`)
    values.push(JSON.stringify(body.content))
  }
  if (body.parent_id !== undefined) {
    updates.push(`parent_id = $${paramIndex++}`)
    values.push(body.parent_id)
  }
  if (body.position !== undefined) {
    updates.push(`position = $${paramIndex++}`)
    values.push(body.position)
  }

  if (updates.length === 0) {
    const block = await queryRow<Block>('SELECT * FROM blocks WHERE id = $1', [id])
    return c.json(block)
  }

  values.push(id)
  const block = await queryRow<Block>(
    `UPDATE blocks SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  )

  if (!block) {
    return c.json({ error: 'Block not found' }, 404)
  }

  return c.json(block)
})

// Delete block
blocks.delete('/:id', async (c) => {
  const id = c.req.param('id')

  await query('DELETE FROM blocks WHERE id = $1', [id])

  return c.json({ success: true })
})

export default blocks
