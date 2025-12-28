/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Vite convention
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  // Next.js convention (also supported)
  readonly NEXT_PUBLIC_SUPABASE_URL?: string
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  // Standard convention
  readonly SUPABASE_URL?: string
  readonly SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
