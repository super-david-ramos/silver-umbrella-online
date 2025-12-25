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
