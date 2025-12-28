import { supabaseAdmin } from './supabase'

export const DEFAULT_TUTORIAL_NOTE = {
  title: 'Welcome to Notes',
  blocks: [
    {
      type: 'heading',
      content: { text: 'Welcome to Your Notes! 📝', level: 1 },
      position: 'a0',
    },
    {
      type: 'paragraph',
      content: { text: "This is your personal workspace for capturing ideas, tasks, and thoughts. Here's a quick guide to get you started:" },
      position: 'a1',
    },
    {
      type: 'heading',
      content: { text: 'Getting Started', level: 2 },
      position: 'a2',
    },
    {
      type: 'paragraph',
      content: { text: '• Create new notes using the + button in the sidebar' },
      position: 'a3',
    },
    {
      type: 'paragraph',
      content: { text: '• Click on any note to start editing' },
      position: 'a4',
    },
    {
      type: 'paragraph',
      content: { text: '• Your changes are saved automatically' },
      position: 'a5',
    },
    {
      type: 'heading',
      content: { text: 'Features', level: 2 },
      position: 'a6',
    },
    {
      type: 'paragraph',
      content: { text: '• Rich text editing with headings, lists, and code blocks' },
      position: 'a7',
    },
    {
      type: 'paragraph',
      content: { text: '• Pin important notes to keep them at the top' },
      position: 'a8',
    },
    {
      type: 'paragraph',
      content: { text: '• Organize notes with nested pages' },
      position: 'a9',
    },
    {
      type: 'paragraph',
      content: { text: '' },
      position: 'b0',
    },
    {
      type: 'paragraph',
      content: { text: 'Feel free to edit or delete this note. Happy writing!' },
      position: 'b1',
    },
  ] as Array<{ type: string; content: Record<string, unknown>; position: string }>,
}

export async function initializeNewUser(
  userId: string,
  userEmail: string
): Promise<{ workspaceId: string; tutorialNoteId: string }> {
  // Create a new workspace for the user (using admin client to bypass RLS)
  const { data: workspace, error: workspaceError } = await supabaseAdmin
    .from('workspaces')
    .insert({
      name: `${userEmail.split('@')[0]}'s Workspace`,
    })
    .select()
    .single()

  if (workspaceError || !workspace) {
    throw new Error(`Failed to create workspace: ${workspaceError?.message || 'Unknown error'}`)
  }

  // Add user as a workspace member
  const { error: memberError } = await supabaseAdmin
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: 'owner',
    })

  if (memberError) {
    throw new Error(`Failed to add user to workspace: ${memberError.message}`)
  }

  // Create the tutorial note
  const { data: note, error: noteError } = await supabaseAdmin
    .from('notes')
    .insert({
      workspace_id: workspace.id,
      title: DEFAULT_TUTORIAL_NOTE.title,
      created_by: userId,
      pinned: true,
    })
    .select()
    .single()

  if (noteError || !note) {
    throw new Error(`Failed to create tutorial note: ${noteError?.message || 'Unknown error'}`)
  }

  // Create the tutorial blocks
  const blocksToInsert = DEFAULT_TUTORIAL_NOTE.blocks.map((block) => ({
    note_id: note.id,
    type: block.type,
    content: block.content,
    position: block.position,
    workspace_id: workspace.id,
  }))

  const { error: blocksError } = await supabaseAdmin
    .from('blocks')
    .insert(blocksToInsert)

  if (blocksError) {
    console.error('Failed to create tutorial blocks:', blocksError)
    // Don't throw here - the note was created, blocks are not critical
  }

  return {
    workspaceId: workspace.id,
    tutorialNoteId: note.id,
  }
}
