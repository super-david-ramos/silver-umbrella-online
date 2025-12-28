import { Hono } from 'hono'
import { authMiddleware } from '../lib/middleware'
import type { Variables } from '../types/hono'
import { supabaseAdmin } from '../lib/supabase'
import { initializeNewUser } from '../lib/user-initialization'

const user = new Hono<{ Variables: Variables }>()

user.use('*', authMiddleware)

// Initialize user - ensures workspace exists, creates if needed
// This endpoint is idempotent and should be called after login
user.post('/init', async (c) => {
  const currentUser = c.get('user')

  // Check if user already has a workspace
  const { data: membership } = await supabaseAdmin
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name)')
    .eq('user_id', currentUser.id)
    .single()

  if (membership) {
    // User already has a workspace
    return c.json({
      initialized: true,
      user: {
        id: currentUser.id,
        email: currentUser.email,
      },
      workspace: {
        id: membership.workspace_id,
        name: (membership.workspaces as any)?.name,
        role: membership.role,
      },
    })
  }

  // Initialize new user with workspace and tutorial note
  try {
    const { workspaceId, tutorialNoteId } = await initializeNewUser(
      currentUser.id,
      currentUser.email || 'user'
    )

    // Fetch workspace details
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('id, name')
      .eq('id', workspaceId)
      .single()

    return c.json({
      initialized: true,
      created: true,
      user: {
        id: currentUser.id,
        email: currentUser.email,
      },
      workspace: {
        id: workspaceId,
        name: workspace?.name,
        role: 'owner',
      },
      tutorialNoteId,
    })
  } catch (error) {
    console.error('Failed to initialize user:', error)
    return c.json(
      { error: `Failed to initialize user: ${error instanceof Error ? error.message : 'Unknown error'}` },
      500
    )
  }
})

// Get current user info
user.get('/me', async (c) => {
  const currentUser = c.get('user')

  const { data: membership } = await supabaseAdmin
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name)')
    .eq('user_id', currentUser.id)
    .single()

  return c.json({
    user: {
      id: currentUser.id,
      email: currentUser.email,
    },
    workspace: membership
      ? {
          id: membership.workspace_id,
          name: (membership.workspaces as any)?.name,
          role: membership.role,
        }
      : null,
  })
})

export default user
