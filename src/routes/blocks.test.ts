import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// Mock the db module
vi.mock('../lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
  queryRow: vi.fn()
}))

// Mock the middleware to inject user
vi.mock('../lib/middleware', () => ({
  authMiddleware: vi.fn(async (c, next) => {
    c.set('user', { id: 'user-123', email: 'test@example.com' })
    await next()
  })
}))

import { query, queryRow } from '../lib/db'
import blocks from './blocks'

describe('Blocks Routes', () => {
  let app: Hono

  beforeEach(() => {
    vi.clearAllMocks()
    app = new Hono()
    app.route('/api/blocks', blocks)
  })

  describe('POST /api/blocks/notes/:noteId/blocks', () => {
    it('creates a new block in a note', async () => {
      const mockBlock = {
        id: 'block-new',
        note_id: 'note-1',
        type: 'paragraph',
        content: { text: 'Hello world' },
        position: 'a1'
      }

      vi.mocked(queryRow).mockResolvedValueOnce(mockBlock)

      const res = await app.request('/api/blocks/notes/note-1/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'paragraph',
          content: { text: 'Hello world' },
          position: 'a1'
        })
      })
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json).toEqual(mockBlock)
    })

    it('creates a todo block', async () => {
      const mockBlock = {
        id: 'block-todo',
        note_id: 'note-1',
        type: 'todo',
        content: { text: 'Task item', checked: false },
        position: 'a2'
      }

      vi.mocked(queryRow).mockResolvedValueOnce(mockBlock)

      const res = await app.request('/api/blocks/notes/note-1/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'todo',
          content: { text: 'Task item', checked: false },
          position: 'a2'
        })
      })
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.type).toBe('todo')
    })

    it('returns 500 on insert error', async () => {
      vi.mocked(queryRow).mockResolvedValueOnce(null)

      const res = await app.request('/api/blocks/notes/note-1/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'paragraph',
          content: {},
          position: 'a1'
        })
      })
      const json = await res.json()

      expect(res.status).toBe(500)
      expect(json).toEqual({ error: 'Failed to create block' })
    })
  })

  describe('PATCH /api/blocks/:id', () => {
    it('updates block content', async () => {
      const mockBlock = {
        id: 'block-1',
        content: { text: 'Updated content' }
      }

      vi.mocked(queryRow).mockResolvedValueOnce(mockBlock)

      const res = await app.request('/api/blocks/block-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { text: 'Updated content' } })
      })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.content.text).toBe('Updated content')
    })

    it('updates block type', async () => {
      const mockBlock = {
        id: 'block-1',
        type: 'heading'
      }

      vi.mocked(queryRow).mockResolvedValueOnce(mockBlock)

      const res = await app.request('/api/blocks/block-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'heading' })
      })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.type).toBe('heading')
    })

    it('updates block position', async () => {
      const mockBlock = {
        id: 'block-1',
        position: 'b0'
      }

      vi.mocked(queryRow).mockResolvedValueOnce(mockBlock)

      const res = await app.request('/api/blocks/block-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: 'b0' })
      })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.position).toBe('b0')
    })
  })

  describe('DELETE /api/blocks/:id', () => {
    it('deletes a block and returns success', async () => {
      vi.mocked(query).mockResolvedValueOnce([])

      const res = await app.request('/api/blocks/block-1', {
        method: 'DELETE'
      })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json).toEqual({ success: true })
    })
  })

  describe('PATCH /api/blocks/reorder', () => {
    it('batch updates block positions', async () => {
      vi.mocked(query).mockResolvedValue([])

      const res = await app.request('/api/blocks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: [
            { id: '550e8400-e29b-41d4-a716-446655440001', position: 'a0' },
            { id: '550e8400-e29b-41d4-a716-446655440002', position: 'a1' },
            { id: '550e8400-e29b-41d4-a716-446655440003', position: 'a2' }
          ]
        })
      })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json).toEqual({ success: true })
    })
  })
})
