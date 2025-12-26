import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// Mock the supabase module
vi.mock('../lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  }
}))

import { supabaseAdmin } from '../lib/supabase'
const mockSupabaseAdmin = supabaseAdmin as any

import sandbox from './sandbox'

describe('Sandbox Routes', () => {
  let app: Hono

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the mock implementation
    mockSupabaseAdmin.from.mockReset()
    app = new Hono()
    app.route('/api/sandbox', sandbox)
  })

  describe('POST /api/sandbox/reset', () => {
    it('clears existing sandbox data and seeds sample notes', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          workspace_id: 'sandbox-workspace-000',
          title: 'Welcome to Sandbox',
          created_by: 'sandbox-user-000',
          blocks: [
            { id: 'block-1', type: 'heading', content: { text: 'Welcome to the Testing Sandbox' }, position: '1' },
            { id: 'block-2', type: 'paragraph', content: { text: 'This is a safe space to test all features without affecting real data.' }, position: '2' },
            { id: 'block-3', type: 'code', content: { code: "console.log('Hello from sandbox!');", language: 'javascript' }, position: '3' }
          ]
        },
        {
          id: 'note-2',
          workspace_id: 'sandbox-workspace-000',
          title: 'Sample Todo List',
          created_by: 'sandbox-user-000',
          blocks: [
            { id: 'block-4', type: 'heading', content: { text: 'My Tasks' }, position: '1' },
            { id: 'block-5', type: 'todo', content: { text: 'Try creating a new note', checked: false }, position: '2' },
            { id: 'block-6', type: 'todo', content: { text: 'Edit this todo item', checked: false }, position: '3' },
            { id: 'block-7', type: 'todo', content: { text: 'Delete a block', checked: false }, position: '4' }
          ]
        }
      ]

      // Mock delete notes (blocks cascade delete automatically)
      mockSupabaseAdmin.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      })

      // Mock insert notes (returns both notes)
      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: mockNotes.map(n => ({ id: n.id, workspace_id: n.workspace_id, title: n.title, created_by: n.created_by })),
          error: null
        })
      })

      // Mock insert blocks for note 1
      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: mockNotes[0].blocks,
          error: null
        })
      })

      // Mock insert blocks for note 2
      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: mockNotes[1].blocks,
          error: null
        })
      })

      const res = await app.request('/api/sandbox/reset', {
        method: 'POST'
      })

      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json).toHaveLength(2)
      expect(json[0].title).toBe('Welcome to Sandbox')
      expect(json[0].blocks).toHaveLength(3)
      expect(json[1].title).toBe('Sample Todo List')
      expect(json[1].blocks).toHaveLength(4)
    })

    it('handles delete errors gracefully', async () => {
      // Mock delete notes with error (blocks cascade delete)
      mockSupabaseAdmin.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } })
      })

      // Mock insert notes - return 2 notes
      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [
            { id: 'note-1', title: 'Welcome to Sandbox', workspace_id: 'sandbox-workspace-000', created_by: 'sandbox-user-000' },
            { id: 'note-2', title: 'Sample Todo List', workspace_id: 'sandbox-workspace-000', created_by: 'sandbox-user-000' }
          ],
          error: null
        })
      })

      // Mock insert blocks for note 1
      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      // Mock insert blocks for note 2
      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      const res = await app.request('/api/sandbox/reset', {
        method: 'POST'
      })

      // Should still succeed with partial data
      expect(res.status).toBe(200)
    })

    it('returns 500 if note creation fails', async () => {
      // Mock successful delete (blocks cascade delete)
      mockSupabaseAdmin.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      })

      // Mock insert notes with error
      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' }
        })
      })

      const res = await app.request('/api/sandbox/reset', {
        method: 'POST'
      })

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json).toEqual({ error: 'Insert failed' })
    })
  })
})
