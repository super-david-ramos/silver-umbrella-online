import { Hono } from 'hono'
import { cors } from 'hono/cors'
import notes from './routes/notes'
import blocks from './routes/blocks'
import passkeys from './routes/passkeys'
import { authMiddleware } from './lib/middleware'

const app = new Hono()

// CORS for frontend
app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}))

// Health check
app.get('/', (c) => c.json({ status: 'ok', version: '1.0.0' }))

// Auth routes (no auth required) - passkey authentication
app.route('/api/auth', passkeys)

// Protected routes (require authentication)
app.use('/api/notes/*', authMiddleware)
app.use('/api/blocks/*', authMiddleware)
app.use('/api/passkeys/*', authMiddleware)

app.route('/api/notes', notes)
app.route('/api/blocks', blocks)
app.route('/api/passkeys', passkeys)

export default app
