import { Hono } from 'hono'
import { supabaseAdmin } from '../lib/supabase'
import { SANDBOX_WORKSPACE_ID, SANDBOX_USER_ID } from '../lib/sandbox'

const sandbox = new Hono()

// Reset sandbox data
sandbox.post('/reset', async (c) => {
  try {
    // Step 1: Clear existing sandbox data
    const { error: deleteNotesError } = await supabaseAdmin
      .from('notes')
      .delete()
      .eq('workspace_id', SANDBOX_WORKSPACE_ID)

    if (deleteNotesError) {
      console.error('[SANDBOX] Error deleting notes:', deleteNotesError.message)
    }

    const { error: deleteBlocksError } = await supabaseAdmin
      .from('blocks')
      .delete()
      .eq('workspace_id', SANDBOX_WORKSPACE_ID)

    if (deleteBlocksError) {
      console.error('[SANDBOX] Error deleting blocks:', deleteBlocksError.message)
    }

    // Step 2: Seed sample notes
    const notesToCreate = [
      {
        workspace_id: SANDBOX_WORKSPACE_ID,
        title: 'Welcome to Sandbox',
        created_by: SANDBOX_USER_ID,
      },
      {
        workspace_id: SANDBOX_WORKSPACE_ID,
        title: 'Sample Todo List',
        created_by: SANDBOX_USER_ID,
      }
    ]

    const { data: createdNotes, error: insertNotesError } = await supabaseAdmin
      .from('notes')
      .insert(notesToCreate)
      .select()

    if (insertNotesError || !createdNotes) {
      return c.json({ error: insertNotesError?.message || 'Failed to create notes' }, 500)
    }

    // Step 3: Seed blocks for each note
    const note1Id = createdNotes[0].id
    const note2Id = createdNotes[1].id

    // Blocks for Note 1: Welcome to Sandbox
    const note1Blocks = [
      {
        note_id: note1Id,
        workspace_id: SANDBOX_WORKSPACE_ID,
        type: 'heading',
        content: { text: 'Welcome to the Testing Sandbox' },
        position: '1'
      },
      {
        note_id: note1Id,
        workspace_id: SANDBOX_WORKSPACE_ID,
        type: 'paragraph',
        content: { text: 'This is a safe space to test all features without affecting real data.' },
        position: '2'
      },
      {
        note_id: note1Id,
        workspace_id: SANDBOX_WORKSPACE_ID,
        type: 'code',
        content: { code: "console.log('Hello from sandbox!');", language: 'javascript' },
        position: '3'
      }
    ]

    // Blocks for Note 2: Sample Todo List
    const note2Blocks = [
      {
        note_id: note2Id,
        workspace_id: SANDBOX_WORKSPACE_ID,
        type: 'heading',
        content: { text: 'My Tasks' },
        position: '1'
      },
      {
        note_id: note2Id,
        workspace_id: SANDBOX_WORKSPACE_ID,
        type: 'todo',
        content: { text: 'Try creating a new note', checked: false },
        position: '2'
      },
      {
        note_id: note2Id,
        workspace_id: SANDBOX_WORKSPACE_ID,
        type: 'todo',
        content: { text: 'Edit this todo item', checked: false },
        position: '3'
      },
      {
        note_id: note2Id,
        workspace_id: SANDBOX_WORKSPACE_ID,
        type: 'todo',
        content: { text: 'Delete a block', checked: false },
        position: '4'
      }
    ]

    // Insert blocks for note 1
    const { data: note1BlocksData, error: note1BlocksError } = await supabaseAdmin
      .from('blocks')
      .insert(note1Blocks)
      .select()

    if (note1BlocksError) {
      console.error('[SANDBOX] Error creating blocks for note 1:', note1BlocksError.message)
    }

    // Insert blocks for note 2
    const { data: note2BlocksData, error: note2BlocksError } = await supabaseAdmin
      .from('blocks')
      .insert(note2Blocks)
      .select()

    if (note2BlocksError) {
      console.error('[SANDBOX] Error creating blocks for note 2:', note2BlocksError.message)
    }

    // Step 4: Return created notes with their blocks
    const notesWithBlocks = [
      {
        ...createdNotes[0],
        blocks: note1BlocksData || []
      },
      {
        ...createdNotes[1],
        blocks: note2BlocksData || []
      }
    ]

    return c.json(notesWithBlocks)
  } catch (error) {
    console.error('[SANDBOX] Unexpected error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default sandbox
