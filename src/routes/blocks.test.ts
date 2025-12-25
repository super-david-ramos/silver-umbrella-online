import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// Mock the supabase module
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn()
  }
}

vi.mock('../lib/supabase', () => ({
  createSupabaseClient: vi.fn(() => mockSupabaseClient)
}))

// Mock the middleware to inject user and supabase
vi.mock('../lib/middleware', () => ({
  authMiddleware: vi.fn(async (c, next) => {
    c.set('user', { id: 'user-123', email: 'test@example.com' })
    c.set('supabase', mockSupabaseClient)
    await next()
  })
}))

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

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBlock,
          error: null
        })
      })

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

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBlock,
          error: null
        })
      })

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
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' }
        })
      })

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
      expect(json).toEqual({ error: 'Insert failed' })
    })
  })

  describe('PATCH /api/blocks/:id', () => {
    it('updates block content', async () => {
      const mockBlock = {
        id: 'block-1',
        content: { text: 'Updated content' }
      }

      mockSupabaseClient.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBlock,
          error: null
        })
      })

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

      mockSupabaseClient.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBlock,
          error: null
        })
      })

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

      mockSupabaseClient.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBlock,
          error: null
        })
      })

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
      mockSupabaseClient.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null
        })
      })

      const res = await app.request('/api/blocks/block-1', {
        method: 'DELETE'
      })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json).toEqual({ success: true })
    })

    it('returns 500 on delete error', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Delete failed' }
        })
      })

      const res = await app.request('/api/blocks/block-1', {
        method: 'DELETE'
      })
      const json = await res.json()

      expect(res.status).toBe(500)
      expect(json).toEqual({ error: 'Delete failed' })
    })
  })

  describe('PATCH /api/blocks/reorder', () => {
    it('batch updates block positions', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      })

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

    it('returns 500 when some updates fail', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      })
      mockSupabaseClient.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } })
      })

      const res = await app.request('/api/blocks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: [
            { id: '550e8400-e29b-41d4-a716-446655440001', position: 'a0' },
            { id: '550e8400-e29b-41d4-a716-446655440002', position: 'a1' }
          ]
        })
      })
      const json = await res.json()

      expect(res.status).toBe(500)
      expect(json).toEqual({ error: 'Some updates failed' })
    })
  })
})
