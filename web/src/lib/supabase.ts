import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Support multiple env var naming conventions (Vite, Next.js, standard)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
  || import.meta.env.SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || import.meta.env.SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Create client only if configured, otherwise create a placeholder that will throw on use
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (new Proxy({} as SupabaseClient, {
      get(_, prop) {
        if (prop === 'auth') {
          return {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithOtp: () => Promise.resolve({ error: new Error('Supabase not configured') }),
            verifyOtp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            signOut: () => Promise.resolve({ error: null }),
          }
        }
        return () => {
          throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
        }
      },
    }))
