// User type for authenticated requests
export interface User {
  id: string
  email?: string
  phone?: string
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
  role?: string
  aud?: string
}

// Declare the variables we add to Hono context
export type Variables = {
  user: User
  isSandbox?: boolean
}
