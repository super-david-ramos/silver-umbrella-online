import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// Mock the db module
vi.mock('../lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
  queryRow: vi.fn()
}))

import { query } from '../lib/db'
import sandbox from './sandbox'

describe('Sandbox Routes', () => {
  let app: Hono

  beforeEach(() => {
    vi.clearAllMocks()
    app = new Hono()
    app.route('/api/sandbox', sandbox)
  })

  describe('POST /api/sandbox/reset', () => {
    it('clears existing sandbox data and seeds sample notes', async () => {
      const mockNotes = [
        { id: 'note-1', workspace_id: 'sandbox-workspace-000', title: 'Welcome to Sandbox' },
        { id: 'note-2', workspace_id: 'sandbox-workspace-000', title: 'Sample Todo List' }
      ]
      const mockBlocks1 = [
        { id: 'block-1', type: 'heading', content: { text: 'Welcome' } }
      ]
      const mockBlocks2 = [
        { id: 'block-2', type: 'todo', content: { text: 'Task 1' } }
      ]

      // Mock delete operations
      vi.mocked(query)
        .mockResolvedValueOnce([]) // delete notes
        .mockResolvedValueOnce([]) // delete blocks
        .mockResolvedValueOnce(mockNotes) // insert notes
        .mockResolvedValueOnce(mockBlocks1) // insert blocks note 1
        .mockResolvedValueOnce(mockBlocks2) // insert blocks note 2

      const res = await app.request('/api/sandbox/reset', { method: 'POST' })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toHaveLength(2)
      expect(json[0].title).toBe('Welcome to Sandbox')
    })

    it('returns 500 if note creation fails', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce([]) // delete notes
        .mockResolvedValueOnce([]) // delete blocks
        .mockResolvedValueOnce([]) // insert notes returns empty (less than 2)

      const res = await app.request('/api/sandbox/reset', { method: 'POST' })

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json).toEqual({ error: 'Failed to create notes' })
    })
  })
})
