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

import { query, queryOne, queryRow } from '../lib/db'
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

      vi.mocked(queryOne).mockResolvedValueOnce({ workspace_id: 'ws-123' })
      vi.mocked(query).mockResolvedValueOnce(mockNotes)

      const res = await app.request('/api/notes')
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json).toEqual(mockNotes)
    })

    it('returns 404 when no workspace found', async () => {
      vi.mocked(queryOne).mockResolvedValueOnce(null)

      const res = await app.request('/api/notes')
      const json = await res.json()

      expect(res.status).toBe(404)
      expect(json).toEqual({ error: 'No workspace found' })
    })
  })

  describe('GET /api/notes/:id', () => {
    it('returns note with blocks', async () => {
      const mockNote = { id: 'note-1', title: 'Test Note' }
      const mockBlocks = [
        { id: 'block-1', type: 'paragraph', content: { text: 'Hello' } }
      ]

      vi.mocked(queryOne).mockResolvedValueOnce(mockNote)
      vi.mocked(query).mockResolvedValueOnce(mockBlocks)

      const res = await app.request('/api/notes/note-1')
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json).toEqual({ ...mockNote, blocks: mockBlocks })
    })

    it('returns 404 when note not found', async () => {
      vi.mocked(queryOne).mockResolvedValueOnce(null)

      const res = await app.request('/api/notes/nonexistent')
      const json = await res.json()

      expect(res.status).toBe(404)
      expect(json).toEqual({ error: 'Note not found' })
    })
  })

  describe('POST /api/notes', () => {
    it('creates a new note with default title', async () => {
      const mockNote = { id: 'note-new', title: 'Untitled', workspace_id: 'ws-123' }

      vi.mocked(queryOne).mockResolvedValueOnce({ workspace_id: 'ws-123' })
      vi.mocked(queryRow).mockResolvedValueOnce(mockNote)
      vi.mocked(queryRow).mockResolvedValueOnce({}) // initial block

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

      vi.mocked(queryOne).mockResolvedValueOnce({ workspace_id: 'ws-123' })
      vi.mocked(queryRow).mockResolvedValueOnce(mockNote)
      vi.mocked(queryRow).mockResolvedValueOnce({}) // initial block

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

      vi.mocked(queryRow).mockResolvedValueOnce(mockNote)

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

      vi.mocked(queryRow).mockResolvedValueOnce(mockNote)

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
      vi.mocked(query).mockResolvedValueOnce([])

      const res = await app.request('/api/notes/note-1', {
        method: 'DELETE'
      })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json).toEqual({ success: true })
    })
  })
})
