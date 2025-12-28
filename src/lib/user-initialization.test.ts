import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initializeNewUser, DEFAULT_TUTORIAL_NOTE } from './user-initialization'

describe('User Initialization', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = {
      from: vi.fn(),
    }
  })

  describe('initializeNewUser', () => {
    it('creates a workspace for a new user', async () => {
      const userId = 'new-user-123'
      const userEmail = 'new@example.com'
      const workspaceId = 'ws-new-123'

      // Mock workspace insert
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: workspaceId, name: 'My Workspace' },
          error: null,
        }),
      })

      // Mock workspace_members insert
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })

      // Mock notes insert (tutorial note)
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'note-1', title: DEFAULT_TUTORIAL_NOTE.title },
          error: null,
        }),
      })

      // Mock blocks insert (tutorial content)
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })

      const result = await initializeNewUser(mockSupabase, userId, userEmail)

      expect(result.workspaceId).toBe(workspaceId)
      expect(result.tutorialNoteId).toBe('note-1')
      expect(mockSupabase.from).toHaveBeenCalledWith('workspaces')
      expect(mockSupabase.from).toHaveBeenCalledWith('workspace_members')
      expect(mockSupabase.from).toHaveBeenCalledWith('notes')
      expect(mockSupabase.from).toHaveBeenCalledWith('blocks')
    })

    it('creates a tutorial note with welcome content', async () => {
      const userId = 'new-user-123'
      const userEmail = 'new@example.com'
      const workspaceId = 'ws-new-123'
      const noteId = 'tutorial-note-1'

      let capturedNoteInsert: any = null
      let capturedBlocksInsert: any = null

      // Mock workspace insert
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: workspaceId, name: 'My Workspace' },
          error: null,
        }),
      })

      // Mock workspace_members insert
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })

      // Mock notes insert - capture what was inserted
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn((data) => {
          capturedNoteInsert = data
          return {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: noteId, ...data },
              error: null,
            }),
          }
        }),
      })

      // Mock blocks insert - capture what was inserted
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn((data) => {
          capturedBlocksInsert = data
          return Promise.resolve({ error: null })
        }),
      })

      await initializeNewUser(mockSupabase, userId, userEmail)

      // Verify the note has tutorial title
      expect(capturedNoteInsert.title).toBe(DEFAULT_TUTORIAL_NOTE.title)
      expect(capturedNoteInsert.workspace_id).toBe(workspaceId)
      expect(capturedNoteInsert.created_by).toBe(userId)

      // Verify blocks were created with welcome content
      expect(capturedBlocksInsert).toBeInstanceOf(Array)
      expect(capturedBlocksInsert.length).toBeGreaterThan(0)
      expect(capturedBlocksInsert[0].type).toBe('heading')
    })

    it('throws error if workspace creation fails', async () => {
      const userId = 'new-user-123'
      const userEmail = 'new@example.com'

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      })

      await expect(initializeNewUser(mockSupabase, userId, userEmail)).rejects.toThrow(
        'Failed to create workspace'
      )
    })

    it('throws error if workspace member creation fails', async () => {
      const userId = 'new-user-123'
      const userEmail = 'new@example.com'

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'ws-123', name: 'My Workspace' },
          error: null,
        }),
      })

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          error: { message: 'Member creation failed' },
        }),
      })

      await expect(initializeNewUser(mockSupabase, userId, userEmail)).rejects.toThrow(
        'Failed to add user to workspace'
      )
    })
  })

  describe('DEFAULT_TUTORIAL_NOTE', () => {
    it('has a welcome title', () => {
      expect(DEFAULT_TUTORIAL_NOTE.title).toContain('Welcome')
    })

    it('has tutorial blocks with helpful content', () => {
      expect(DEFAULT_TUTORIAL_NOTE.blocks.length).toBeGreaterThan(0)

      // Should have a heading
      const headingBlock = DEFAULT_TUTORIAL_NOTE.blocks.find(b => b.type === 'heading')
      expect(headingBlock).toBeDefined()

      // Should have some paragraphs explaining features
      const paragraphBlocks = DEFAULT_TUTORIAL_NOTE.blocks.filter(b => b.type === 'paragraph')
      expect(paragraphBlocks.length).toBeGreaterThan(0)
    })
  })
})
