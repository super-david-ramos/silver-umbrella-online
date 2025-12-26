# Testing Sandbox Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a non-authenticated sandbox for testing all deployed features without requiring passkey authentication.

**Architecture:** Sandbox mode triggered by header/query param, using dedicated sandbox user and workspace. Includes interactive UI page for manual testing.

**Tech Stack:** Hono middleware, vanilla HTML/JS UI

---

## Overview

The testing sandbox provides two components:

1. **Sandbox Mode** - API-level bypass that uses a dedicated sandbox user/workspace
2. **Sandbox UI** - Interactive HTML page for manual feature testing

## Sandbox Mode

### Activation

Sandbox mode is triggered by either:
- `X-Sandbox-Mode: true` request header
- `?sandbox=true` query parameter

### Security

- **Disabled in production**: Only works when `NODE_ENV !== 'production'`
- **Isolated data**: Sandbox uses dedicated workspace, cannot access real user data
- **Clear identification**: Logs indicate when sandbox mode is active

### Sandbox Identifiers

```typescript
const SANDBOX_USER_ID = 'sandbox-user-00000000-0000-0000-0000-000000000000'
const SANDBOX_WORKSPACE_ID = 'sandbox-ws-00000000-0000-0000-0000-000000000000'

const SANDBOX_USER = {
  id: SANDBOX_USER_ID,
  email: 'sandbox@example.com',
  app_metadata: { workspace_id: SANDBOX_WORKSPACE_ID },
  user_metadata: { name: 'Sandbox User' },
  role: 'authenticated',
  aud: 'authenticated'
}
```

### Affected Routes

| Route | Sandbox Behavior |
|-------|------------------|
| `GET /api/notes` | Returns notes from sandbox workspace |
| `POST /api/notes` | Creates note in sandbox workspace |
| `PATCH /api/notes/:id` | Updates note (must belong to sandbox) |
| `DELETE /api/notes/:id` | Deletes note (must belong to sandbox) |
| `POST /api/notes/:noteId/blocks` | Creates block in sandbox note |
| `PATCH /api/blocks/:id` | Updates block in sandbox note |
| `DELETE /api/blocks/:id` | Deletes block in sandbox note |
| `PATCH /api/blocks/reorder` | Reorders blocks in sandbox note |

Passkey routes (`/api/passkeys/*`, `/api/auth/*`) remain unchanged - they have their own demo flow.

## Middleware Implementation

### New File: `src/lib/sandbox.ts`

```typescript
import { Context, Next } from 'hono'

export const SANDBOX_USER_ID = 'sandbox-user-00000000-0000-0000-0000-000000000000'
export const SANDBOX_WORKSPACE_ID = 'sandbox-ws-00000000-0000-0000-0000-000000000000'

export const SANDBOX_USER = {
  id: SANDBOX_USER_ID,
  email: 'sandbox@example.com',
  phone: null,
  app_metadata: { workspace_id: SANDBOX_WORKSPACE_ID },
  user_metadata: { name: 'Sandbox User' },
  role: 'authenticated',
  aud: 'authenticated'
}

function isSandboxRequest(c: Context): boolean {
  // Check header
  if (c.req.header('X-Sandbox-Mode') === 'true') return true
  // Check query param
  if (c.req.query('sandbox') === 'true') return true
  return false
}

export async function sandboxMiddleware(c: Context, next: Next) {
  // Disabled in production
  if (process.env.NODE_ENV === 'production') {
    return next()
  }

  if (isSandboxRequest(c)) {
    console.log('[SANDBOX] Request using sandbox mode')
    c.set('user', SANDBOX_USER)
    c.set('isSandbox', true)
    return next()
  }

  return next()
}
```

### Modified: `src/lib/middleware.ts`

Update `authMiddleware` to skip if sandbox user already set:

```typescript
export async function authMiddleware(c: Context, next: Next) {
  // Skip if sandbox mode already set user
  if (c.get('isSandbox') === true && c.get('user')) {
    return next()
  }

  // ... existing auth logic
}
```

### Modified: `src/index.ts`

```typescript
import { sandboxMiddleware } from './lib/sandbox'

// Apply sandbox middleware before auth
app.use('/api/notes/*', sandboxMiddleware, authMiddleware)
app.use('/api/blocks/*', sandboxMiddleware, authMiddleware)
```

## Database Seeding

### Endpoint: `POST /api/sandbox/reset`

Resets sandbox to initial state with sample data:

```typescript
// Creates:
// 1. Sandbox workspace (if not exists)
// 2. Sample "Welcome" note with intro blocks
// 3. Sample "Todo List" note with todo blocks
```

### Sample Data

**Note 1: Welcome to Sandbox**
- Heading block: "Welcome to the Testing Sandbox"
- Paragraph block: "This is a safe space to test all features."
- Code block: Example code snippet

**Note 2: Sample Todo List**
- Heading block: "My Tasks"
- Todo block: "Try creating a new note" (unchecked)
- Todo block: "Edit this todo item" (unchecked)
- Todo block: "Delete a block" (unchecked)

## Sandbox UI Page

### File: `public/sandbox.html`

Interactive page with:

1. **Header**
   - Title: "Testing Sandbox"
   - Reset button: Clears and reseeds sandbox data

2. **Notes Sidebar**
   - List of notes with titles
   - Click to select/edit
   - "New Note" button
   - Delete button per note

3. **Editor Panel**
   - Editable note title
   - List of blocks with type indicators
   - Inline block editing
   - Block type selector (paragraph, heading, todo, code, quote, list_item)
   - Add/delete block buttons
   - Drag-to-reorder (stretch goal)

4. **Debug Log**
   - Shows all API requests/responses
   - Timestamps
   - Status codes
   - Collapsible request/response bodies

### API Integration

All API calls include `?sandbox=true` query parameter:

```javascript
async function fetchNotes() {
  const response = await fetch('/api/notes?sandbox=true')
  return response.json()
}
```

## Testing

### Unit Tests

- `src/lib/sandbox.test.ts` - Sandbox middleware tests
  - Activates on header
  - Activates on query param
  - Disabled in production
  - Sets correct user context

### Integration Tests

- Verify sandbox routes work without auth token
- Verify sandbox data is isolated
- Verify reset endpoint works

## Implementation Tasks

### Task 1: Create Sandbox Middleware
- Create `src/lib/sandbox.ts` with constants and middleware
- Add tests in `src/lib/sandbox.test.ts`

### Task 2: Integrate Sandbox Middleware
- Update `src/lib/middleware.ts` to skip auth for sandbox
- Update `src/index.ts` to apply sandbox middleware
- Update existing route tests if needed

### Task 3: Create Sandbox Reset Endpoint
- Add `POST /api/sandbox/reset` route
- Implement workspace/note/block seeding
- Add tests

### Task 4: Create Sandbox UI Page
- Create `public/sandbox.html`
- Implement notes sidebar
- Implement block editor
- Implement debug log
- Style consistently with demo.html

### Task 5: Verify End-to-End
- Manual testing of all features
- Verify isolation from real data
- Test reset functionality
