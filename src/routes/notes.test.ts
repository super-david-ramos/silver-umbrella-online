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

import notes from './notes'

describe('Notes Routes', () => {
  let app: Hono

  beforeEach(() => {
    vi.clearAllMocks()
    app = new Hono()
    app.route('/api/notes', notes)
  })

  describe('GET /api/notes', () => {
    it('returns list of notes for user workspace', async () => {
      const mockNotes = [
        { id: 'note-1', title: 'First Note', updated_at: '2024-01-01' },
        { id: 'note-2', title: 'Second Note', updated_at: '2024-01-02' }
      ]

      // Mock workspace lookup
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { workspace_id: 'ws-123' },
          error: null
        })
      })

      // Mock notes fetch
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockNotes,
          error: null
        })
      })

      const res = await app.request('/api/notes')
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json).toEqual(mockNotes)
    })

    it('returns 404 when no workspace found', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      const res = await app.request('/api/notes')
      const json = await res.json()

      expect(res.status).toBe(404)
      expect(json).toEqual({ error: 'No workspace found' })
    })

    it('returns 500 on database error', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { workspace_id: 'ws-123' },
          error: null
        })
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      })

      const res = await app.request('/api/notes')
      const json = await res.json()

      expect(res.status).toBe(500)
      expect(json).toEqual({ error: 'Database error' })
    })
  })

  describe('GET /api/notes/:id', () => {
    it('returns note with blocks', async () => {
      const mockNote = { id: 'note-1', title: 'Test Note' }
      const mockBlocks = [
        { id: 'block-1', type: 'paragraph', content: { text: 'Hello' } }
      ]

      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockNote,
          error: null
        })
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockBlocks,
          error: null
        })
      })

      const res = await app.request('/api/notes/note-1')
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json).toEqual({ ...mockNote, blocks: mockBlocks })
    })

    it('returns 404 when note not found', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      })

      const res = await app.request('/api/notes/nonexistent')
      const json = await res.json()

      expect(res.status).toBe(404)
      expect(json).toEqual({ error: 'Note not found' })
    })
  })

  describe('POST /api/notes', () => {
    it('creates a new note with default title', async () => {
      const mockNote = { id: 'note-new', title: 'Untitled', workspace_id: 'ws-123' }

      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { workspace_id: 'ws-123' },
          error: null
        })
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockNote,
          error: null
        })
      })

      // Mock initial block creation
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null })
      })

      const res = await app.request('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json).toEqual(mockNote)
    })

    it('creates a note with custom title', async () => {
      const mockNote = { id: 'note-new', title: 'My Custom Note', workspace_id: 'ws-123' }

      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { workspace_id: 'ws-123' },
          error: null
        })
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockNote,
          error: null
        })
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null })
      })

      const res = await app.request('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'My Custom Note' })
      })
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.title).toBe('My Custom Note')
    })
  })

  describe('PATCH /api/notes/:id', () => {
    it('updates note title', async () => {
      const mockNote = { id: 'note-1', title: 'Updated Title' }

      mockSupabaseClient.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockNote,
          error: null
        })
      })

      const res = await app.request('/api/notes/note-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' })
      })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.title).toBe('Updated Title')
    })

    it('updates note pinned status', async () => {
      const mockNote = { id: 'note-1', pinned: true }

      mockSupabaseClient.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockNote,
          error: null
        })
      })

      const res = await app.request('/api/notes/note-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: true })
      })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.pinned).toBe(true)
    })
  })

  describe('DELETE /api/notes/:id', () => {
    it('deletes a note and returns success', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null
        })
      })

      const res = await app.request('/api/notes/note-1', {
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

      const res = await app.request('/api/notes/note-1', {
        method: 'DELETE'
      })
      const json = await res.json()

      expect(res.status).toBe(500)
      expect(json).toEqual({ error: 'Delete failed' })
    })
  })
})
