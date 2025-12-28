# Personal Productivity App

A block-based note-taking application with instant capture, smart formatting, and passkey authentication.

## Quick Reference

```bash
# Development
bun install              # Install dependencies
bun run dev:api          # Start API server (port 3000)
bun run dev:web          # Start frontend (port 5173)
bun run test             # Run tests in watch mode
bun run test:run         # Run tests once

# Build & Deploy
bun run build            # Build frontend to web/dist
vc dev                   # Run both API + frontend via Vercel CLI
vc deploy                # Deploy to Vercel
```

## Architecture Overview

```
/
├── src/                     # Hono API (Bun runtime)
│   ├── index.ts             # Entry point, route composition
│   ├── server.ts            # Dev server entry
│   ├── routes/
│   │   ├── notes.ts         # Notes CRUD
│   │   ├── blocks.ts        # Block operations
│   │   ├── passkeys.ts      # Passkey auth endpoints
│   │   └── sandbox.ts       # Sandbox reset endpoint
│   ├── lib/
│   │   ├── supabase.ts      # Supabase clients (admin + user)
│   │   ├── middleware.ts    # JWT auth middleware
│   │   ├── sandbox.ts       # Sandbox mode middleware
│   │   └── user-initialization.ts  # New user setup
│   └── types/
│       ├── index.ts         # Note, Block, User, Workspace types
│       └── hono.ts          # Hono context variable types
├── web/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # UI components
│   │   │   ├── ui/          # ShadCN components (button, input, sheet)
│   │   │   ├── editor/      # Lexical editor + nodes
│   │   │   └── layout/      # AppShell, MobileNav, FAB
│   │   ├── features/        # Feature modules
│   │   │   ├── notes/       # NoteList, NoteCard, NoteEditor
│   │   │   ├── auth/        # LoginPage, OTPInput, AuthCallback
│   │   │   ├── demo/        # Demo mode components
│   │   │   └── landing/     # LandingPage
│   │   ├── hooks/           # React hooks
│   │   │   ├── useNotes.ts  # Notes CRUD with TanStack Query
│   │   │   ├── useNote.ts   # Single note + blocks
│   │   │   ├── useAuth.ts   # Auth state management
│   │   │   └── useDebouncedCallback.ts
│   │   └── lib/
│   │       ├── api.ts       # API client wrapper
│   │       ├── supabase.ts  # Supabase client
│   │       ├── auth-context.tsx  # Auth context provider
│   │       └── device.ts    # Device detection utilities
│   └── public/
│       ├── sandbox.html     # Testing sandbox (no auth)
│       └── demo.html        # Demo page
├── docs/plans/              # Design documents and implementation plans
└── superpowers/             # Git submodule with development workflow skills
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | Bun | Fast TypeScript execution |
| API | Hono | Lightweight (14KB) type-safe router |
| Database | Supabase (Postgres) | Auth + DB + RLS |
| Frontend | React 18 + Vite | Fast dev, HMR |
| State | TanStack Query | Server state, optimistic updates |
| Editor | Lexical | Block-based rich text |
| UI | ShadCN + Tailwind | Customizable components |
| Auth | Supabase Auth + SimpleWebAuthn | OTP, magic links, passkeys |
| Deploy | Vercel | Serverless hosting |

## Data Model

### Core Types (src/types/index.ts)

```typescript
interface Note {
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

interface Block {
  id: string
  note_id: string
  parent_id: string | null
  type: 'paragraph' | 'heading' | 'todo' | 'code' | 'quote' | 'list_item'
  content: Record<string, unknown>
  position: string  // Fractional indexing for ordering
  created_at: string
  updated_at: string
}
```

### Block Content Schemas

| Type | Content |
|------|---------|
| paragraph | `{ text: "..." }` |
| heading | `{ text: "...", level: 1-3 }` |
| todo | `{ text: "...", checked: boolean }` |
| code | `{ text: "...", language: "typescript" }` |
| quote | `{ text: "..." }` |
| list_item | `{ text: "..." }` |

## API Endpoints

```
# Notes
GET    /api/notes           # List user's notes
POST   /api/notes           # Create note
GET    /api/notes/:id       # Get note with blocks
PATCH  /api/notes/:id       # Update note (title, pinned)
DELETE /api/notes/:id       # Delete note

# Blocks
PATCH  /api/blocks/:id      # Update block content/type
POST   /api/notes/:id/blocks # Add block to note
DELETE /api/blocks/:id      # Delete block

# Auth (passkeys)
GET    /api/auth/register/options   # Get registration challenge
POST   /api/auth/register           # Complete registration
GET    /api/auth/login/options      # Get authentication challenge
POST   /api/auth/login              # Complete authentication

# Sandbox (testing)
POST   /api/sandbox/reset           # Reset sandbox data
```

## Authentication Flow

1. **Supabase Auth** (primary): OTP codes and magic links via email
2. **Passkeys** (secondary): WebAuthn for biometric/security key auth
3. **JWT validation**: Middleware validates Supabase tokens or custom JWTs

### Auth Middleware (src/lib/middleware.ts)

- Checks `Authorization: Bearer <token>` header
- First tries Supabase `getUser()` for Supabase-issued tokens
- Falls back to JWT verification for passkey-issued tokens
- Sets `user` and `supabase` on Hono context

### Sandbox Mode (src/lib/sandbox.ts)

- Activated by `?sandbox=true` query param
- Bypasses auth, uses fixed sandbox user/workspace
- Only for `/sandbox.html` testing

## Testing

### Unit Tests (Vitest)

```bash
bun run test        # Watch mode
bun run test:run    # Single run (CI)
```

Test files: `src/**/*.test.ts`
Setup: `src/test-setup.ts`

### Manual Testing Sandbox

Access `/sandbox.html` for non-authenticated API testing:
- Creates notes and blocks via sandbox mode
- Shows debug log of all API calls
- Reset button clears sandbox data

**Important**: When implementing new features, update `public/sandbox.html` to expose the new functionality for manual testing.

## Environment Variables

### Backend (Vercel/Production)

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_AUTH_JWT_SECRET=xxx
```

### Frontend (web/.env)

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

Supports multiple naming conventions (see `web/.env.example`).

## Development Workflow

### Adding a New Feature

1. **Backend first**: Add route in `src/routes/`, types in `src/types/`
2. **Write tests**: Create `*.test.ts` alongside the route
3. **Update sandbox**: Add UI to `public/sandbox.html` for manual testing
4. **Frontend**: Add hook in `web/src/hooks/`, component in `web/src/features/`
5. **Run tests**: `bun run test:run` before committing

### Key Patterns

- **Workspace isolation**: All notes belong to a workspace, users access via `workspace_members`
- **Auto-initialization**: New users get a workspace and tutorial note on first API call
- **Optimistic updates**: TanStack Query mutations update UI immediately
- **Block-based content**: Lexical nodes map to block types in database
- **Fractional indexing**: Block `position` uses fractional strings for ordering without renumbering

## CI/CD

GitHub Actions (`.github/workflows/test.yml`):
- Runs on PRs and pushes to main
- `npm ci && npm test -- --run`
- Type check with `tsc --noEmit`

Vercel:
- Auto-deploys on push to main
- Rewrites `/api/*` to serverless function
- Static files from `web/dist/`

---

## Superpowers Skills Integration

This project uses [Superpowers](https://github.com/obra/superpowers) for structured development workflows.

### Setup (do this automatically if skills are missing)

```bash
git submodule update --init --recursive
```

### Available Skills

| Skill | When to Use |
|-------|-------------|
| **brainstorming** | Before writing code - explore alternatives |
| **writing-plans** | Create implementation plans for new features |
| **executing-plans** | Execute plans with human checkpoints |
| **test-driven-development** | RED-GREEN-REFACTOR cycle |
| **systematic-debugging** | Root cause analysis for bugs |
| **verification-before-completion** | Verify fixes actually work |
| **subagent-driven-development** | Fast iteration with review |

### Philosophy

- **Test-Driven Development**: Write tests first, always
- **Systematic over ad-hoc**: Follow processes, don't guess
- **Complexity reduction**: Simplest solution that works
- **Evidence over claims**: Verify before declaring success

### Usage

When starting any task:
1. Check if any skill applies (even 1% chance means use it)
2. Read the skill file at `superpowers/skills/<skill>/SKILL.md`
3. Follow the skill's process exactly

Skills are mandatory workflows, not suggestions.
