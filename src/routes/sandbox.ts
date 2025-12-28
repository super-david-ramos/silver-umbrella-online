import { Hono } from 'hono'
import { SANDBOX_WORKSPACE_ID, SANDBOX_USER_ID } from '../lib/sandbox'
import { query } from '../lib/db'

interface Note {
  id: string
  workspace_id: string
  title: string
  created_by: string
  created_at: string
  updated_at: string
}

interface Block {
  id: string
  note_id: string
  workspace_id: string
  type: string
  content: Record<string, unknown>
  position: string
  created_at: string
  updated_at: string
}

const sandbox = new Hono()

// Reset sandbox data
sandbox.post('/reset', async (c) => {
  try {
    // Step 1: Clear existing sandbox data
    await query('DELETE FROM notes WHERE workspace_id = $1', [SANDBOX_WORKSPACE_ID])
    await query('DELETE FROM blocks WHERE workspace_id = $1', [SANDBOX_WORKSPACE_ID])

    // Step 2: Seed sample notes
    const createdNotes = await query<Note>(
      `INSERT INTO notes (workspace_id, title, created_by)
       VALUES ($1, $2, $3), ($1, $4, $3)
       RETURNING *`,
      [SANDBOX_WORKSPACE_ID, 'Welcome to Sandbox', SANDBOX_USER_ID, 'Sample Todo List']
    )

    if (!createdNotes || createdNotes.length < 2) {
      return c.json({ error: 'Failed to create notes' }, 500)
    }

    const note1Id = createdNotes[0].id
    const note2Id = createdNotes[1].id

    // Step 3: Seed blocks for each note
    const note1Blocks = await query<Block>(
      `INSERT INTO blocks (note_id, workspace_id, type, content, position)
       VALUES
         ($1, $2, 'heading', $3, '1'),
         ($1, $2, 'paragraph', $4, '2'),
         ($1, $2, 'code', $5, '3')
       RETURNING *`,
      [
        note1Id,
        SANDBOX_WORKSPACE_ID,
        JSON.stringify({ text: 'Welcome to the Testing Sandbox' }),
        JSON.stringify({ text: 'This is a safe space to test all features without affecting real data.' }),
        JSON.stringify({ code: "console.log('Hello from sandbox!');", language: 'javascript' }),
      ]
    )

    const note2Blocks = await query<Block>(
      `INSERT INTO blocks (note_id, workspace_id, type, content, position)
       VALUES
         ($1, $2, 'heading', $3, '1'),
         ($1, $2, 'todo', $4, '2'),
         ($1, $2, 'todo', $5, '3'),
         ($1, $2, 'todo', $6, '4')
       RETURNING *`,
      [
        note2Id,
        SANDBOX_WORKSPACE_ID,
        JSON.stringify({ text: 'My Tasks' }),
        JSON.stringify({ text: 'Try creating a new note', checked: false }),
        JSON.stringify({ text: 'Edit this todo item', checked: false }),
        JSON.stringify({ text: 'Delete a block', checked: false }),
      ]
    )

    // Step 4: Return created notes with their blocks
    const notesWithBlocks = [
      {
        ...createdNotes[0],
        blocks: note1Blocks || []
      },
      {
        ...createdNotes[1],
        blocks: note2Blocks || []
      }
    ]

    return c.json(notesWithBlocks)
  } catch (error) {
    console.error('[SANDBOX] Unexpected error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default sandbox
