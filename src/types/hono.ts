import { SupabaseClient, User } from '@supabase/supabase-js'

// Declare the variables we add to Hono context
export type Variables = {
  user: User
  supabase: SupabaseClient
  isSandbox?: boolean
}
