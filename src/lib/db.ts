import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

export { pool }

// Helper for single queries
export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(text, params)
    return rows as T[]
  } finally {
    client.release()
  }
}

// Helper for single row queries
export async function queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] || null
}

// Helper for insert/update that returns the affected row
export async function queryRow<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
  return queryOne<T>(text, params)
}
