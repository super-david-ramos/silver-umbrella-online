# Phase 1: MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single-user note-taking app with smart todo formatting and mobile-optimized UI.

**Architecture:** Hono API on Bun serves REST endpoints, React frontend with Lexical editor consumes them. Supabase provides Postgres database with RLS and auth. TanStack Query handles client state with optimistic updates.

**Tech Stack:** Bun, Hono, Supabase, React, Vite, Lexical, TanStack Query, ShadCN UI, Tailwind CSS

---

## Task 1: Project Structure Setup

**Files:**
- Modify: `package.json`
- Create: `web/package.json`
- Create: `web/vite.config.ts`
- Create: `web/index.html`
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`
- Create: `web/tsconfig.json`
- Create: `web/tailwind.config.js`
- Create: `web/postcss.config.js`
- Create: `web/src/index.css`

**Step 1: Update root package.json for monorepo scripts**

```json
{
  "name": "productivity-app",
  "type": "module",
  "scripts": {
    "dev": "bun run --filter '*' dev",
    "dev:api": "bun run --hot src/index.ts",
    "dev:web": "cd web && bun run dev",
    "build": "bun run build:web",
    "build:web": "cd web && bun run build"
  },
  "dependencies": {
    "hono": "^4.8.9"
  },
  "devDependencies": {
    "@types/bun": "^1.3.1",
    "typescript": "^5.8.3"
  }
}
```

**Step 2: Initialize web frontend**

Run:
```bash
cd /home/user/silver-umbrella-online
mkdir -p web/src
```

**Step 3: Create web/package.json**

```json
{
  "name": "web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.0",
    "@tanstack/react-query": "^5.62.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3",
    "vite": "^6.0.0"
  }
}
```

**Step 4: Create web/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

**Step 5: Create web/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**Step 6: Create Tailwind config files**

Create `web/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}
```

Create `web/postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Step 7: Create web/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Prevent iOS zoom on input focus */
input, textarea, select {
  font-size: 16px;
}

/* Dynamic viewport height */
.h-screen-safe {
  height: 100dvh;
}

/* Safe area padding */
.safe-area-inset {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

**Step 8: Create web/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#000000" />
    <title>Notes</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 9: Create web/src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
```

**Step 10: Create web/src/App.tsx**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="p-4">Notes App - MVP</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

**Step 11: Install dependencies and verify**

Run:
```bash
cd /home/user/silver-umbrella-online/web && bun install
```
Expected: Dependencies installed successfully

Run:
```bash
cd /home/user/silver-umbrella-online/web && bun run dev &
sleep 3 && curl -s http://localhost:5173 | head -20
```
Expected: HTML response containing "Notes App"

**Step 12: Commit**

```bash
git add -A
git commit -m "feat: initialize React frontend with Vite and Tailwind"
```

---

## Task 2: Supabase Project Setup

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/00001_initial_schema.sql`
- Create: `src/lib/supabase.ts`
- Create: `web/src/lib/supabase.ts`
- Modify: `package.json` (add supabase deps)

**Step 1: Install Supabase CLI and dependencies**

Run:
```bash
cd /home/user/silver-umbrella-online
bun add @supabase/supabase-js
```

Run:
```bash
cd /home/user/silver-umbrella-online/web
bun add @supabase/supabase-js
```

**Step 2: Initialize Supabase project structure**

Run:
```bash
cd /home/user/silver-umbrella-online
mkdir -p supabase/migrations
```

**Step 3: Create initial migration**

Create `supabase/migrations/00001_initial_schema.sql`:
```sql
-- Workspaces
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Personal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace members
CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Notes
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  parent_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  pinned BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocks
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'paragraph',
  content JSONB NOT NULL DEFAULT '{}',
  position TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags (future use)
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  UNIQUE(workspace_id, name)
);

-- Note tags (future use)
CREATE TABLE note_tags (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- Block links (future use)
CREATE TABLE block_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
  target_note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  target_block_id UUID REFERENCES blocks(id) ON DELETE SET NULL,
  link_type TEXT DEFAULT 'reference',
  UNIQUE(source_block_id, target_note_id, COALESCE(target_block_id, '00000000-0000-0000-0000-000000000000'))
);

-- Indexes
CREATE INDEX idx_notes_workspace ON notes(workspace_id);
CREATE INDEX idx_notes_parent ON notes(parent_id);
CREATE INDEX idx_blocks_note ON blocks(note_id);
CREATE INDEX idx_blocks_parent ON blocks(parent_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

-- RLS Policies
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_links ENABLE ROW LEVEL SECURITY;

-- Workspace access policy
CREATE POLICY "Users can access their workspaces" ON workspaces
  FOR ALL USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can access workspace memberships" ON workspace_members
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can access notes in their workspaces" ON notes
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can access blocks in their notes" ON blocks
  FOR ALL USING (
    note_id IN (
      SELECT id FROM notes WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can access tags in their workspaces" ON tags
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can access note_tags for their notes" ON note_tags
  FOR ALL USING (
    note_id IN (
      SELECT id FROM notes WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can access block_links for their blocks" ON block_links
  FOR ALL USING (
    source_block_id IN (
      SELECT id FROM blocks WHERE note_id IN (
        SELECT id FROM notes WHERE workspace_id IN (
          SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Function to create workspace for new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  INSERT INTO workspaces (name) VALUES ('Personal') RETURNING id INTO new_workspace_id;
  INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (new_workspace_id, NEW.id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER blocks_updated_at
  BEFORE UPDATE ON blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Step 4: Create backend Supabase client**

Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Public client for RLS-respecting operations
export function createSupabaseClient(accessToken?: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  })
}
```

**Step 5: Create frontend Supabase client**

Create `web/src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Step 6: Create environment file templates**

Create `.env.example`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Create `web/.env.example`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Supabase schema and client configuration"
```

---

## Task 3: API Routes Setup

**Files:**
- Modify: `src/index.ts`
- Create: `src/lib/middleware.ts`
- Create: `src/routes/notes.ts`
- Create: `src/routes/blocks.ts`
- Create: `src/types/index.ts`

**Step 1: Create types**

Create `src/types/index.ts`:
```typescript
export interface Note {
  id: string
  workspace_id: string
  title: string
  parent_id: string | null
  pinned: boolean
  metadata: Record<string, unknown>
  created_by: string
  created_at: string
  updated_at: string
}

export interface Block {
  id: string
  note_id: string
  parent_id: string | null
  type: 'paragraph' | 'heading' | 'todo' | 'code' | 'quote' | 'list_item'
  content: Record<string, unknown>
  position: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
}

export interface Workspace {
  id: string
  name: string
  created_at: string
}
```

**Step 2: Create auth middleware**

Create `src/lib/middleware.ts`:
```typescript
import { Context, Next } from 'hono'
import { createSupabaseClient } from './supabase'

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization header' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createSupabaseClient(token)

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  c.set('user', user)
  c.set('supabase', supabase)

  await next()
}
```

**Step 3: Create notes routes**

Create `src/routes/notes.ts`:
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../lib/middleware'

const createNoteSchema = z.object({
  title: z.string().optional().default('Untitled'),
  parent_id: z.string().uuid().nullable().optional(),
})

const updateNoteSchema = z.object({
  title: z.string().optional(),
  pinned: z.boolean().optional(),
  parent_id: z.string().uuid().nullable().optional(),
})

const notes = new Hono()

notes.use('*', authMiddleware)

// List notes
notes.get('/', async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return c.json({ error: 'No workspace found' }, 404)
  }

  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('workspace_id', membership.workspace_id)
    .order('updated_at', { ascending: false })

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json(notes)
})

// Get single note with blocks
notes.get('/:id', async (c) => {
  const supabase = c.get('supabase')
  const id = c.req.param('id')

  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single()

  if (noteError || !note) {
    return c.json({ error: 'Note not found' }, 404)
  }

  const { data: blocks, error: blocksError } = await supabase
    .from('blocks')
    .select('*')
    .eq('note_id', id)
    .order('position')

  if (blocksError) {
    return c.json({ error: blocksError.message }, 500)
  }

  return c.json({ ...note, blocks })
})

// Create note
notes.post('/', zValidator('json', createNoteSchema), async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const body = c.req.valid('json')

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return c.json({ error: 'No workspace found' }, 404)
  }

  const { data: note, error } = await supabase
    .from('notes')
    .insert({
      workspace_id: membership.workspace_id,
      title: body.title,
      parent_id: body.parent_id,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  // Create initial empty paragraph block
  await supabase
    .from('blocks')
    .insert({
      note_id: note.id,
      type: 'paragraph',
      content: { text: '' },
      position: 'a0',
    })

  return c.json(note, 201)
})

// Update note
notes.patch('/:id', zValidator('json', updateNoteSchema), async (c) => {
  const supabase = c.get('supabase')
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const { data: note, error } = await supabase
    .from('notes')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json(note)
})

// Delete note
notes.delete('/:id', async (c) => {
  const supabase = c.get('supabase')
  const id = c.req.param('id')

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json({ success: true })
})

export default notes
```

**Step 4: Create blocks routes**

Create `src/routes/blocks.ts`:
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../lib/middleware'

const blockTypes = ['paragraph', 'heading', 'todo', 'code', 'quote', 'list_item'] as const

const createBlockSchema = z.object({
  type: z.enum(blockTypes).optional().default('paragraph'),
  content: z.record(z.unknown()).optional().default({}),
  parent_id: z.string().uuid().nullable().optional(),
  position: z.string(),
})

const updateBlockSchema = z.object({
  type: z.enum(blockTypes).optional(),
  content: z.record(z.unknown()).optional(),
  parent_id: z.string().uuid().nullable().optional(),
  position: z.string().optional(),
})

const reorderSchema = z.object({
  updates: z.array(z.object({
    id: z.string().uuid(),
    position: z.string(),
  })),
})

const blocks = new Hono()

blocks.use('*', authMiddleware)

// Create block in note
blocks.post('/notes/:noteId/blocks', zValidator('json', createBlockSchema), async (c) => {
  const supabase = c.get('supabase')
  const noteId = c.req.param('noteId')
  const body = c.req.valid('json')

  const { data: block, error } = await supabase
    .from('blocks')
    .insert({
      note_id: noteId,
      type: body.type,
      content: body.content,
      parent_id: body.parent_id,
      position: body.position,
    })
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json(block, 201)
})

// Update block
blocks.patch('/:id', zValidator('json', updateBlockSchema), async (c) => {
  const supabase = c.get('supabase')
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const { data: block, error } = await supabase
    .from('blocks')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json(block)
})

// Delete block
blocks.delete('/:id', async (c) => {
  const supabase = c.get('supabase')
  const id = c.req.param('id')

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('id', id)

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  return c.json({ success: true })
})

// Batch reorder blocks
blocks.patch('/reorder', zValidator('json', reorderSchema), async (c) => {
  const supabase = c.get('supabase')
  const { updates } = c.req.valid('json')

  // Update each block's position
  const results = await Promise.all(
    updates.map(({ id, position }) =>
      supabase
        .from('blocks')
        .update({ position })
        .eq('id', id)
    )
  )

  const errors = results.filter(r => r.error)
  if (errors.length > 0) {
    return c.json({ error: 'Some updates failed' }, 500)
  }

  return c.json({ success: true })
})

export default blocks
```

**Step 5: Update main index.ts**

Modify `src/index.ts`:
```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import notes from './routes/notes'
import blocks from './routes/blocks'

const app = new Hono()

// CORS for frontend
app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}))

// Health check
app.get('/', (c) => c.json({ status: 'ok', version: '1.0.0' }))

// API routes
app.route('/api/notes', notes)
app.route('/api/blocks', blocks)

export default app
```

**Step 6: Install additional dependencies**

Run:
```bash
cd /home/user/silver-umbrella-online
bun add @hono/zod-validator zod hono
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add notes and blocks API routes with auth middleware"
```

---

## Task 4: Device Detection Hook

**Files:**
- Create: `web/src/lib/device.ts`
- Create: `web/src/hooks/useDeviceContext.ts`

**Step 1: Create device detection utilities**

Create `web/src/lib/device.ts`:
```typescript
export interface DeviceContext {
  isIOS: boolean
  isAndroid: boolean
  isMobile: boolean
  isHighDPI: boolean
  hasTouchScreen: boolean
  hasCoarsePointer: boolean
  hasFinePointer: boolean
  isPortrait: boolean
  isLandscape: boolean
}

export function getDeviceContext(): DeviceContext {
  if (typeof window === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      isHighDPI: false,
      hasTouchScreen: false,
      hasCoarsePointer: false,
      hasFinePointer: true,
      isPortrait: true,
      isLandscape: false,
    }
  }

  const ua = navigator.userAgent

  return {
    isIOS: /iPad|iPhone|iPod/.test(ua),
    isAndroid: /Android/.test(ua),
    isMobile: /Mobi|Android|iPhone|iPad|iPod/.test(ua),
    isHighDPI: window.devicePixelRatio >= 2,
    hasTouchScreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    hasCoarsePointer: window.matchMedia('(pointer: coarse)').matches,
    hasFinePointer: window.matchMedia('(pointer: fine)').matches,
    isPortrait: window.matchMedia('(orientation: portrait)').matches,
    isLandscape: window.matchMedia('(orientation: landscape)').matches,
  }
}
```

**Step 2: Create React hook**

Create `web/src/hooks/useDeviceContext.ts`:
```typescript
import { useState, useEffect } from 'react'
import { getDeviceContext, DeviceContext } from '@/lib/device'

export function useDeviceContext(): DeviceContext {
  const [context, setContext] = useState<DeviceContext>(getDeviceContext)

  useEffect(() => {
    const handleChange = () => setContext(getDeviceContext())

    window.addEventListener('resize', handleChange)
    window.addEventListener('orientationchange', handleChange)

    // Also listen for media query changes
    const portraitQuery = window.matchMedia('(orientation: portrait)')
    const pointerQuery = window.matchMedia('(pointer: coarse)')

    portraitQuery.addEventListener('change', handleChange)
    pointerQuery.addEventListener('change', handleChange)

    return () => {
      window.removeEventListener('resize', handleChange)
      window.removeEventListener('orientationchange', handleChange)
      portraitQuery.removeEventListener('change', handleChange)
      pointerQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return context
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add device detection hook for mobile-first UX"
```

---

## Task 5: ShadCN UI Setup

**Files:**
- Create: `web/components.json`
- Create: `web/src/lib/utils.ts`
- Create: `web/src/components/ui/button.tsx`
- Create: `web/src/components/ui/input.tsx`
- Create: `web/src/components/ui/sheet.tsx`
- Modify: `web/tailwind.config.js`
- Modify: `web/src/index.css`

**Step 1: Install ShadCN dependencies**

Run:
```bash
cd /home/user/silver-umbrella-online/web
bun add class-variance-authority clsx tailwind-merge lucide-react @radix-ui/react-slot @radix-ui/react-dialog
```

**Step 2: Create utils**

Create `web/src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 3: Update Tailwind config for ShadCN**

Modify `web/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
```

**Step 4: Update CSS with theme variables**

Modify `web/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Prevent iOS zoom on input focus */
input, textarea, select {
  font-size: 16px;
}

/* Dynamic viewport height */
.h-screen-safe {
  height: 100dvh;
}

/* Safe area padding */
.safe-area-inset {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}

/* Touch-friendly tap targets */
.touch-target {
  @apply min-h-[44px] min-w-[44px];
}
```

**Step 5: Create Button component**

Create `web/src/components/ui/button.tsx`:
```tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-target',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

**Step 6: Create Input component**

Create `web/src/components/ui/input.tsx`:
```tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
```

**Step 7: Create Sheet component (for mobile sidebar)**

Create `web/src/components/ui/sheet.tsx`:
```tsx
import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
const SheetPortal = DialogPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom: 'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right: 'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = DialogPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-2 text-center sm:text-left', className)}
    {...props}
  />
)
SheetHeader.displayName = 'SheetHeader'

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-foreground', className)}
    {...props}
  />
))
SheetTitle.displayName = DialogPrimitive.Title.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
}
```

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add ShadCN UI components and theming"
```

---

## Task 6: Auth UI (OTP Flow)

**Files:**
- Create: `web/src/features/auth/LoginPage.tsx`
- Create: `web/src/features/auth/OTPInput.tsx`
- Create: `web/src/hooks/useAuth.ts`
- Create: `web/src/lib/auth-context.tsx`
- Modify: `web/src/App.tsx`
- Modify: `web/src/main.tsx`

**Step 1: Create auth hook**

Create `web/src/hooks/useAuth.ts`:
```typescript
import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    return { error }
  }

  const verifyOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    user,
    session,
    loading,
    signInWithOtp,
    verifyOtp,
    signOut,
  }
}
```

**Step 2: Create auth context**

Create `web/src/lib/auth-context.tsx`:
```tsx
import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'

type AuthContextType = ReturnType<typeof useAuth>

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
```

**Step 3: Create OTP input component**

Create `web/src/features/auth/OTPInput.tsx`:
```tsx
import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface OTPInputProps {
  length?: number
  onComplete: (code: string) => void
  disabled?: boolean
}

export function OTPInput({ length = 6, onComplete, disabled }: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only digits

    const newValues = [...values]
    newValues[index] = value.slice(-1) // Only last digit

    setValues(newValues)

    // Move to next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Check if complete
    const code = newValues.join('')
    if (code.length === length) {
      onComplete(code)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, length)
    if (!/^\d+$/.test(pastedData)) return

    const newValues = [...values]
    pastedData.split('').forEach((char, i) => {
      newValues[i] = char
    })
    setValues(newValues)

    if (pastedData.length === length) {
      onComplete(pastedData)
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {values.map((value, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            'w-12 h-14 text-center text-2xl font-mono',
            'focus:ring-2 focus:ring-primary'
          )}
        />
      ))}
    </div>
  )
}
```

**Step 4: Create login page**

Create `web/src/features/auth/LoginPage.tsx`:
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OTPInput } from './OTPInput'
import { useAuthContext } from '@/lib/auth-context'

type Step = 'email' | 'otp'

export function LoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signInWithOtp, verifyOtp } = useAuthContext()
  const navigate = useNavigate()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await signInWithOtp(email)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setStep('otp')
    setLoading(false)
  }

  const handleOTPComplete = async (code: string) => {
    setLoading(true)
    setError(null)

    const { error } = await verifyOtp(email, code)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-muted-foreground mt-2">
            {step === 'email'
              ? 'Enter your email to sign in'
              : 'Enter the code sent to your email'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Continue'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <OTPInput onComplete={handleOTPComplete} disabled={loading} />
            <p className="text-sm text-center text-muted-foreground">
              Didn't receive a code?{' '}
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-primary underline"
              >
                Try again
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 5: Update main.tsx with AuthProvider**

Modify `web/src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './lib/auth-context'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
```

**Step 6: Update App.tsx with routes**

Modify `web/src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext } from './lib/auth-context'
import { LoginPage } from './features/auth/LoginPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="p-4">
                <h1 className="text-xl font-bold">Notes App</h1>
                <p className="text-muted-foreground">Logged in successfully!</p>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add OTP authentication flow"
```

---

## Task 7: Notes List UI

**Files:**
- Create: `web/src/hooks/useNotes.ts`
- Create: `web/src/features/notes/NoteList.tsx`
- Create: `web/src/features/notes/NoteCard.tsx`
- Create: `web/src/components/layout/AppShell.tsx`
- Create: `web/src/components/layout/MobileNav.tsx`
- Create: `web/src/components/layout/FloatingActionButton.tsx`
- Modify: `web/src/App.tsx`

**Step 1: Create API client helper**

Create `web/src/lib/api.ts`:
```typescript
import { supabase } from './supabase'

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  }
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Request failed')
  }

  return res.json()
}

export const api = {
  notes: {
    list: () => fetchApi<any[]>('/notes'),
    get: (id: string) => fetchApi<any>(`/notes/${id}`),
    create: (data: { title?: string }) =>
      fetchApi<any>('/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { title?: string; pinned?: boolean }) =>
      fetchApi<any>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchApi<void>(`/notes/${id}`, { method: 'DELETE' }),
  },
  blocks: {
    update: (id: string, data: any) =>
      fetchApi<any>(`/blocks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    create: (noteId: string, data: any) =>
      fetchApi<any>(`/notes/${noteId}/blocks`, { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchApi<void>(`/blocks/${id}`, { method: 'DELETE' }),
  },
}
```

**Step 2: Create useNotes hook**

Create `web/src/hooks/useNotes.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useNotes() {
  return useQuery({
    queryKey: ['notes'],
    queryFn: api.notes.list,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.notes.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.notes.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] })
      const previous = queryClient.getQueryData(['notes'])

      queryClient.setQueryData(['notes'], (old: any[]) =>
        old?.filter((note) => note.id !== id)
      )

      return { previous }
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['notes'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
```

**Step 3: Create NoteCard component**

Create `web/src/features/notes/NoteCard.tsx`:
```tsx
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface NoteCardProps {
  note: {
    id: string
    title: string
    updated_at: string
    pinned: boolean
  }
  onClick: () => void
  onDelete?: () => void
  isActive?: boolean
}

export function NoteCard({ note, onClick, isActive }: NoteCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 border-b border-border',
        'hover:bg-accent/50 transition-colors',
        'touch-target',
        isActive && 'bg-accent'
      )}
    >
      <h3 className="font-medium truncate">{note.title || 'Untitled'}</h3>
      <p className="text-sm text-muted-foreground mt-1">
        {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
      </p>
    </button>
  )
}
```

**Step 4: Create NoteList component**

Create `web/src/features/notes/NoteList.tsx`:
```tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useNotes } from '@/hooks/useNotes'
import { NoteCard } from './NoteCard'

export function NoteList() {
  const { data: notes, isLoading, error } = useNotes()
  const navigate = useNavigate()
  const { id: activeId } = useParams()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Failed to load notes
      </div>
    )
  }

  if (!notes?.length) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No notes yet. Create your first note!
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onClick={() => navigate(`/note/${note.id}`)}
          isActive={note.id === activeId}
        />
      ))}
    </div>
  )
}
```

**Step 5: Create FloatingActionButton**

Create `web/src/components/layout/FloatingActionButton.tsx`:
```tsx
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FABProps {
  onClick: () => void
  className?: string
}

export function FloatingActionButton({ onClick, className }: FABProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg',
        'pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      <Plus className="h-6 w-6" />
    </Button>
  )
}
```

**Step 6: Create MobileNav**

Create `web/src/components/layout/MobileNav.tsx`:
```tsx
import { NavLink } from 'react-router-dom'
import { FileText, Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 h-16 border-t bg-background flex items-center justify-around pb-[env(safe-area-inset-bottom)]">
      <NavLink
        to="/"
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center gap-1 p-2 touch-target',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )
        }
      >
        <FileText className="h-5 w-5" />
        <span className="text-xs">Notes</span>
      </NavLink>
      <NavLink
        to="/search"
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center gap-1 p-2 touch-target',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )
        }
      >
        <Search className="h-5 w-5" />
        <span className="text-xs">Search</span>
      </NavLink>
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center gap-1 p-2 touch-target',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )
        }
      >
        <Settings className="h-5 w-5" />
        <span className="text-xs">Settings</span>
      </NavLink>
    </nav>
  )
}
```

**Step 7: Create AppShell**

Create `web/src/components/layout/AppShell.tsx`:
```tsx
import { Outlet, useNavigate } from 'react-router-dom'
import { useDeviceContext } from '@/hooks/useDeviceContext'
import { useCreateNote } from '@/hooks/useNotes'
import { NoteList } from '@/features/notes/NoteList'
import { MobileNav } from './MobileNav'
import { FloatingActionButton } from './FloatingActionButton'

export function AppShell() {
  const { hasTouchScreen, isPortrait } = useDeviceContext()
  const createNote = useCreateNote()
  const navigate = useNavigate()

  const handleNewNote = async () => {
    const note = await createNote.mutateAsync({ title: 'Untitled' })
    navigate(`/note/${note.id}`)
  }

  const isMobileLayout = hasTouchScreen && isPortrait

  if (isMobileLayout) {
    return (
      <div className="h-screen-safe flex flex-col bg-background">
        <header className="h-14 flex items-center justify-between px-4 border-b">
          <h1 className="text-lg font-semibold">Notes</h1>
        </header>
        <main className="flex-1 overflow-auto pb-20">
          <Outlet />
        </main>
        <MobileNav />
        <FloatingActionButton onClick={handleNewNote} className="bottom-20" />
      </div>
    )
  }

  // Desktop/tablet landscape layout
  return (
    <div className="h-screen-safe flex bg-background">
      <aside className="w-72 border-r flex flex-col">
        <header className="h-14 flex items-center justify-between px-4 border-b">
          <h1 className="text-lg font-semibold">Notes</h1>
        </header>
        <div className="flex-1 overflow-auto">
          <NoteList />
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <FloatingActionButton onClick={handleNewNote} />
    </div>
  )
}
```

**Step 8: Update App.tsx**

Modify `web/src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext } from './lib/auth-context'
import { LoginPage } from './features/auth/LoginPage'
import { AppShell } from './components/layout/AppShell'
import { NoteList } from './features/notes/NoteList'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<NoteList />} />
          <Route path="note/:id" element={<div>Note Editor (coming next)</div>} />
          <Route path="search" element={<div>Search (Phase 2)</div>} />
          <Route path="settings" element={<div>Settings (Phase 2)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

**Step 9: Install date-fns**

Run:
```bash
cd /home/user/silver-umbrella-online/web
bun add date-fns
```

**Step 10: Commit**

```bash
git add -A
git commit -m "feat: add notes list with mobile-first layout"
```

---

## Task 8: Lexical Editor Setup

**Files:**
- Create: `web/src/components/editor/Editor.tsx`
- Create: `web/src/components/editor/plugins/TodoPlugin.tsx`
- Create: `web/src/components/editor/nodes/TodoNode.tsx`
- Create: `web/src/features/notes/NoteEditor.tsx`
- Create: `web/src/hooks/useNote.ts`
- Modify: `web/src/App.tsx`

**Step 1: Install Lexical**

Run:
```bash
cd /home/user/silver-umbrella-online/web
bun add lexical @lexical/react @lexical/rich-text @lexical/list @lexical/markdown @lexical/selection @lexical/utils
```

**Step 2: Create TodoNode**

Create `web/src/components/editor/nodes/TodoNode.tsx`:
```tsx
import {
  DecoratorNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical'

export type SerializedTodoNode = Spread<
  {
    text: string
    checked: boolean
  },
  SerializedLexicalNode
>

export class TodoNode extends DecoratorNode<JSX.Element> {
  __text: string
  __checked: boolean

  static getType(): string {
    return 'todo'
  }

  static clone(node: TodoNode): TodoNode {
    return new TodoNode(node.__text, node.__checked, node.__key)
  }

  constructor(text: string, checked: boolean = false, key?: NodeKey) {
    super(key)
    this.__text = text
    this.__checked = checked
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement('div')
    div.className = 'flex items-start gap-2 py-1'
    return div
  }

  updateDOM(): false {
    return false
  }

  static importJSON(serializedNode: SerializedTodoNode): TodoNode {
    return new TodoNode(serializedNode.text, serializedNode.checked)
  }

  exportJSON(): SerializedTodoNode {
    return {
      type: 'todo',
      version: 1,
      text: this.__text,
      checked: this.__checked,
    }
  }

  setChecked(checked: boolean): void {
    const writable = this.getWritable()
    writable.__checked = checked
  }

  setText(text: string): void {
    const writable = this.getWritable()
    writable.__text = text
  }

  decorate(): JSX.Element {
    return (
      <TodoComponent
        text={this.__text}
        checked={this.__checked}
        nodeKey={this.__key}
      />
    )
  }
}

function TodoComponent({
  text,
  checked,
  nodeKey,
}: {
  text: string
  checked: boolean
  nodeKey: NodeKey
}) {
  return (
    <div className="flex items-start gap-2 py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => {}}
        className="mt-1 h-4 w-4 rounded border-gray-300"
      />
      <span className={checked ? 'line-through text-muted-foreground' : ''}>
        {text}
      </span>
    </div>
  )
}

export function $createTodoNode(text: string, checked: boolean = false): TodoNode {
  return new TodoNode(text, checked)
}

export function $isTodoNode(node: LexicalNode | null | undefined): node is TodoNode {
  return node instanceof TodoNode
}
```

**Step 3: Create Editor component**

Create `web/src/components/editor/Editor.tsx`:
```tsx
import { useEffect } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { ListNode, ListItemNode } from '@lexical/list'
import { HeadingNode } from '@lexical/rich-text'
import { EditorState } from 'lexical'
import { TodoNode } from './nodes/TodoNode'

const theme = {
  paragraph: 'mb-2',
  heading: {
    h1: 'text-2xl font-bold mb-4',
    h2: 'text-xl font-semibold mb-3',
    h3: 'text-lg font-medium mb-2',
  },
  list: {
    ul: 'list-disc ml-4 mb-2',
    ol: 'list-decimal ml-4 mb-2',
    listitem: 'mb-1',
    listitemChecked: 'line-through text-muted-foreground',
    listitemUnchecked: '',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'font-mono bg-muted px-1 rounded',
  },
}

interface EditorProps {
  initialContent?: string
  onChange?: (content: string) => void
  editable?: boolean
}

export function Editor({ initialContent, onChange, editable = true }: EditorProps) {
  const initialConfig = {
    namespace: 'NotesEditor',
    theme,
    nodes: [HeadingNode, ListNode, ListItemNode, TodoNode],
    editable,
    onError: (error: Error) => {
      console.error('Lexical error:', error)
    },
  }

  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const json = JSON.stringify(editorState.toJSON())
      onChange?.(json)
    })
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative min-h-[200px]">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="outline-none min-h-[200px] px-4 py-2" />
          }
          placeholder={
            <div className="absolute top-2 left-4 text-muted-foreground pointer-events-none">
              Start typing...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <OnChangePlugin onChange={handleChange} />
      </div>
    </LexicalComposer>
  )
}
```

**Step 4: Create useNote hook**

Create `web/src/hooks/useNote.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useNote(id: string) {
  return useQuery({
    queryKey: ['note', id],
    queryFn: () => api.notes.get(id),
    enabled: !!id,
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; pinned?: boolean }) =>
      api.notes.update(id, data),
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ['note', id] })
      const previous = queryClient.getQueryData(['note', id])

      queryClient.setQueryData(['note', id], (old: any) => ({
        ...old,
        ...data,
      }))

      return { previous }
    },
    onError: (_err, { id }, context) => {
      queryClient.setQueryData(['note', id], context?.previous)
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['note', id] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

export function useUpdateBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; content?: any; type?: string }) =>
      api.blocks.update(id, data),
    onMutate: async ({ id, ...data }) => {
      // Optimistic update handled at note level
    },
    onSettled: (_data, _err, { id }) => {
      // Invalidate the parent note
      queryClient.invalidateQueries({ queryKey: ['note'] })
    },
  })
}
```

**Step 5: Create NoteEditor component**

Create `web/src/features/notes/NoteEditor.tsx`:
```tsx
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useNote, useUpdateNote } from '@/hooks/useNote'
import { useDeleteNote } from '@/hooks/useNotes'
import { useDeviceContext } from '@/hooks/useDeviceContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Editor } from '@/components/editor/Editor'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'

export function NoteEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: note, isLoading, error } = useNote(id!)
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const { hasTouchScreen, isPortrait } = useDeviceContext()
  const [title, setTitle] = useState('')

  const isMobileLayout = hasTouchScreen && isPortrait

  useEffect(() => {
    if (note?.title) {
      setTitle(note.title)
    }
  }, [note?.title])

  const debouncedUpdateTitle = useDebouncedCallback((newTitle: string) => {
    if (id && newTitle !== note?.title) {
      updateNote.mutate({ id, title: newTitle })
    }
  }, 500)

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    debouncedUpdateTitle(newTitle)
  }

  const handleDelete = async () => {
    if (id && confirm('Delete this note?')) {
      await deleteNote.mutateAsync(id)
      navigate('/')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="p-4 text-center text-destructive">
        Note not found
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 flex items-center gap-2 px-4 border-b shrink-0">
        {isMobileLayout && (
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="flex-1 border-0 text-lg font-medium focus-visible:ring-0"
        />
        <Button variant="ghost" size="icon" onClick={handleDelete}>
          <Trash2 className="h-5 w-5 text-destructive" />
        </Button>
      </header>
      <main className="flex-1 overflow-auto">
        <Editor />
      </main>
    </div>
  )
}
```

**Step 6: Create useDebouncedCallback hook**

Create `web/src/hooks/useDebouncedCallback.ts`:
```typescript
import { useRef, useCallback } from 'react'

export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  return useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    }) as T,
    [callback, delay]
  )
}
```

**Step 7: Update App.tsx with NoteEditor route**

Modify the route in `web/src/App.tsx`:
```tsx
import { NoteEditor } from './features/notes/NoteEditor'
// ... existing imports

// In routes, replace placeholder:
<Route path="note/:id" element={<NoteEditor />} />
```

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Lexical rich text editor with todo support"
```

---

## Task 9: Deploy to Vercel

**Files:**
- Modify: `vercel.json`
- Create: `web/vercel.json`

**Step 1: Update root vercel.json for API**

Modify `vercel.json`:
```json
{
  "buildCommand": "bun run build",
  "outputDirectory": "web/dist",
  "framework": null,
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

**Step 2: Create web build script**

Update `package.json`:
```json
{
  "scripts": {
    "dev:api": "bun run --hot src/index.ts",
    "dev:web": "cd web && bun run dev",
    "build": "cd web && bun run build",
    "start": "bun run src/index.ts"
  }
}
```

**Step 3: Set up environment variables**

Document required Vercel environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: configure Vercel deployment"
```

**Step 5: Deploy**

Run:
```bash
vercel --prod
```

---

## Summary

This plan covers the complete Phase 1 MVP:

1. **Project structure** - Monorepo with Hono API and React frontend
2. **Supabase schema** - Workspaces, notes, blocks with RLS
3. **API routes** - Notes and blocks CRUD with auth middleware
4. **Device detection** - Mobile-first with user agent + touch detection
5. **ShadCN UI** - Button, Input, Sheet components with theming
6. **Auth UI** - OTP email verification flow
7. **Notes list** - Mobile-first layout with FAB and bottom nav
8. **Lexical editor** - Rich text with todo support
9. **Deployment** - Vercel configuration

Each task follows TDD principles with explicit steps and verification commands.
