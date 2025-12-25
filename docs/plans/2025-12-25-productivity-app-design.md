# Personal Productivity App - Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

## Product Vision

A **personal productivity app** combining Antinote's instant-capture philosophy with architectural flexibility to grow into a powerful tool over time.

### Core Principles

1. **Speed over organization** - Capture in 3 seconds, organize never (unless you want to)
2. **One content type** - Notes with smart formatting, not separate "notes" and "todos"
3. **Invisible complexity** - Block-based power under a simple document-like surface
4. **Permanent by default** - Nothing auto-deletes; user controls retention

### User Experience

- **Instant new note** - Cmd+N (desktop) / FAB (mobile) starts typing immediately
- **Smart formatting** - Type `- [ ]` and it becomes an interactive checkbox
- **List view** - All notes in a single chronological/search list (no folders to start)
- **Full-text search** - Find anything by content
- **Progressive block controls** - Hover/long-press to see handles, or enable "always show"

### MVP Scope (What We're NOT Building Initially)

- No folders or tags (hooks ready for later)
- No [[wikilinks]] or backlinks (future enhancement)
- No real-time collaboration (single-user first)
- No native mobile app (mobile-optimized web, Capacitor later)
- No full offline mode (optimistic updates only)

### Future Organization Hooks

Architecture supports without implementing:
- User-driven: Tags, folders, pinned notes
- Automatic: AI-generated tags/summaries, smart groupings

---

## Technical Architecture

### Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Runtime** | Bun | Fast, TypeScript-native, Vercel-supported |
| **API** | Hono | Lightweight (14KB), type-safe, edge-ready |
| **Database** | Supabase (Postgres) | Auth + DB + realtime in one |
| **Frontend** | React + Vite | Fast dev, large ecosystem, Capacitor-ready |
| **UI Components** | ShadCN | Copy-paste components, fully customizable |
| **Editor** | Lexical | Lightweight, extensible, Meta-backed |
| **State/Cache** | TanStack Query | Optimistic updates, caching, background sync |
| **Deployment** | Vercel | Zero-config for Hono+Bun |

### Project Structure

```
/
├── src/                    # Hono API (backend)
│   ├── index.ts           # Entry point, route composition
│   ├── routes/
│   │   ├── notes.ts       # CRUD for notes
│   │   ├── blocks.ts      # Block operations
│   │   └── auth.ts        # Passkey endpoints (Phase 3)
│   ├── lib/
│   │   ├── supabase.ts    # Supabase client
│   │   └── middleware.ts  # Auth validation
│   └── types/
├── web/                    # React frontend
│   ├── src/
│   │   ├── components/    # ShadCN + custom
│   │   ├── features/      # Note editor, note list, auth
│   │   ├── hooks/         # TanStack Query hooks
│   │   └── lib/           # Device detection, API client
│   └── index.html
├── supabase/
│   └── migrations/        # Database schema
└── package.json
```

### API Design

```
# Auth handled by Supabase client SDK (OTP flow)
# Our API validates session tokens via middleware

GET    /api/notes               # List notes (paginated)
POST   /api/notes               # Create note
GET    /api/notes/:id           # Get note with blocks
PATCH  /api/notes/:id           # Update note metadata
DELETE /api/notes/:id           # Delete note

PATCH  /api/blocks/:id          # Update block content
POST   /api/notes/:id/blocks    # Add block to note
DELETE /api/blocks/:id          # Delete block
PATCH  /api/blocks/reorder      # Reorder blocks (batch)

# Passkey endpoints (Phase 3)
GET    /api/auth/passkey/register-options
POST   /api/auth/passkey/register
GET    /api/auth/passkey/login-options
POST   /api/auth/passkey/login
DELETE /api/auth/passkey/:id
GET    /api/auth/passkey
```

---

## Authentication

### Auth Progression

1. **Phase 1 (MVP): OTP Code**
   - `signInWithOtp({ email })` → 6-digit code sent
   - `verifyOtp({ email, token })` → Session established
   - Avoids email prefetch problem with magic links

2. **Phase 3: Passkeys**
   - SimpleWebAuthn integration
   - Custom `passkey_credentials` table
   - Face ID, Touch ID, security keys

3. **Phase 7: OAuth**
   - Google/Apple sign-in for convenience

### Passkey Schema (Phase 3)

```sql
CREATE TABLE passkey_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key BYTEA NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type TEXT,
  backed_up BOOLEAN DEFAULT false,
  transports TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  friendly_name TEXT
);
```

---

## Data Model

### Core Tables

```sql
-- Workspace (ready for multi-user later)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Personal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace membership (3-tier: owner/editor/viewer)
CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'editor', 'viewer')),
  PRIMARY KEY (workspace_id, user_id)
);

-- Notes (container for blocks)
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

-- Blocks (atomic content units)
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'paragraph',
  content JSONB NOT NULL DEFAULT '{}',
  position NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags (ready but unused in MVP)
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  UNIQUE(workspace_id, name)
);

-- Note-Tag relationship (ready but unused in MVP)
CREATE TABLE note_tags (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- Block links (ready for [[wikilinks]] later)
CREATE TABLE block_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
  target_note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  target_block_id UUID REFERENCES blocks(id) ON DELETE SET NULL,
  link_type TEXT DEFAULT 'reference',
  UNIQUE(source_block_id, target_note_id, target_block_id)
);
```

### Block Types

| Type | Content Schema |
|------|----------------|
| `paragraph` | `{ "text": "..." }` |
| `heading` | `{ "text": "...", "level": 1-3 }` |
| `todo` | `{ "text": "...", "checked": false }` |
| `code` | `{ "text": "...", "language": "typescript" }` |
| `quote` | `{ "text": "..." }` |
| `list_item` | `{ "text": "..." }` (uses parent_id for nesting) |

### Fractional Indexing

Uses [fractional-indexing](https://www.npmjs.com/package/fractional-indexing) for `position` to avoid renumbering on insert.

### Row-Level Security

```sql
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_access" ON notes FOR ALL USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- Same pattern for blocks, tags, etc.
```

### Workspace Roles

| Role | Permissions |
|------|-------------|
| **owner** | Full control: manage members, delete workspace, all editor permissions |
| **editor** | Create/edit/delete notes and blocks |
| **viewer** | Read-only access |

---

## Frontend Architecture

### Component Structure

```
web/src/
├── components/
│   ├── ui/                    # ShadCN components
│   ├── editor/
│   │   ├── Editor.tsx         # Lexical wrapper
│   │   ├── plugins/
│   │   │   ├── TodoPlugin.tsx
│   │   │   ├── BlockHandlePlugin.tsx
│   │   │   └── MarkdownPlugin.tsx
│   │   └── nodes/
│   │       ├── TodoNode.tsx
│   │       └── CodeNode.tsx
│   ├── notes/
│   │   ├── NoteList.tsx
│   │   ├── NoteCard.tsx
│   │   └── NoteSearch.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── CommandPalette.tsx
│       └── AppShell.tsx
├── features/
│   ├── auth/
│   └── settings/
├── hooks/
│   ├── useNotes.ts
│   ├── useNote.ts
│   ├── useBlocks.ts
│   ├── useAuth.ts
│   └── useDeviceContext.ts
├── lib/
│   ├── api.ts
│   ├── supabase.ts
│   ├── device.ts
│   └── utils.ts
└── App.tsx
```

### Block Controls UX

- **Default:** Clean document, no handles
- **Hover (desktop) / Long-press (mobile):** Block handle appears
- **Setting enabled:** Handles always visible

---

## Mobile-First Design

### Device Detection

Detect based on **user agent + input capabilities**, not just screen width:

```typescript
{
  isIOS: /iPad|iPhone|iPod/.test(ua),
  isMobile: /Mobi|Android|iPhone|iPad|iPod/.test(ua),
  isHighDPI: window.devicePixelRatio >= 2,
  hasTouchScreen: 'ontouchstart' in window,
  hasCoarsePointer: matchMedia('(pointer: coarse)').matches,
  isPortrait: matchMedia('(orientation: portrait)').matches,
}
```

### Touch-First Interactions

| Action | Desktop | Mobile |
|--------|---------|--------|
| New note | Cmd+N | FAB button |
| Search | Cmd+K | Header icon |
| Delete | Cmd+Backspace | Swipe left |
| Pin | — | Swipe right |
| Block controls | Hover | Long-press |
| Reorder | Drag handle | Long-press + drag |

### Layout by Context

| Context | Layout |
|---------|--------|
| Mobile + Portrait | Full-screen stacks, bottom tabs |
| Mobile + Landscape | Optional collapsible sidebar |
| Desktop | Side-by-side panels, resizable |

### Key Principles

1. Detect by user agent + touch capability, not just screen width
2. Touch-first interactions (long-press, swipe, FAB)
3. Support portrait and landscape orientations
4. Prefer stacks/tabs with minimal panes
5. Panels are collapsible and resizable when present

### PWA Ready

- `manifest.json` for installability
- `viewport-fit=cover` for notch support
- `100dvh` for dynamic viewport height
- Safe area insets for iOS

---

## State Management

### Server State (TanStack Query)

```typescript
// List notes
const { data: notes } = useQuery({
  queryKey: ['notes'],
  queryFn: () => api.notes.list(),
})

// Optimistic block update
const updateBlock = useMutation({
  mutationFn: (block) => api.blocks.update(block),
  onMutate: async (newBlock) => {
    queryClient.setQueryData(['note', noteId], (old) => ({
      ...old,
      blocks: old.blocks.map(b => b.id === newBlock.id ? newBlock : b)
    }))
  },
  onError: (err, newBlock, context) => {
    queryClient.setQueryData(['note', noteId], context.previous)
    toast.error('Failed to save')
  },
})
```

### Local UI State

Simple `useState` or Zustand for:
- Sidebar open/closed
- Block handles visibility preference
- Dark mode

---

## Implementation Phases

### Phase 1: Foundation (MVP)

- Project setup (Hono + Bun, React + Vite, Supabase)
- Database schema with RLS
- Auth (OTP code flow)
- Notes CRUD API
- Blocks CRUD with fractional positioning
- Lexical editor with paragraph/heading
- Smart todo detection (`- [ ]` → TodoNode)
- Mobile-first UI with stack navigation
- Optimistic updates
- Deploy to Vercel

### Phase 2: Polish & UX

- Block controls (drag handles, contextual menu)
- Command palette (Cmd+K / FAB)
- Full-text search
- Keyboard shortcuts (desktop)
- Touch gestures (swipe, long-press)
- Orientation support
- PWA manifest
- Dark mode

### Phase 3: Passkey Auth

- `passkey_credentials` table
- SimpleWebAuthn integration
- Registration/login flows
- Passkey management UI

### Phase 4: Organization Hooks

- Pinned notes
- Manual tags
- Folders/notebooks
- Smart filters

### Phase 5: AI Features

- AI tagging
- AI summaries
- Smart grouping
- Semantic search

### Phase 6: Multi-User & Sharing

- Invite flow
- Role enforcement (owner/editor/viewer)
- Real-time sync (Supabase Broadcast)
- Presence indicators
- Conflict resolution

### Phase 7: Offline & Native

- IndexedDB persistence
- Offline mutation queue
- Conflict UI
- Capacitor wrapper (iOS/Android)
- OAuth (Google/Apple)

---

## Key Decisions Summary

| Decision | Choice |
|----------|--------|
| Philosophy | Antinote simplicity + permanent storage |
| Content model | Notes with smart todo formatting |
| User scope | Single-user MVP, multi-user later |
| Frontend | React + Vite + ShadCN |
| Editor | Lexical |
| Auth | OTP → Passkeys → OAuth |
| Offline | Optimistic updates (full offline later) |
| Data model | Block-based backend, toggleable UX |
| Block controls | Contextual with "always show" option |
| Roles | 3-tier: owner/editor/viewer |
| Mobile | Device detection, touch-first, stack navigation |
| Cross-platform | Web-first, Capacitor later |
