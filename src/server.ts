import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import app from './index'

// Create a new app that wraps the main app with static file serving
const server = new Hono()

// Serve demo page
server.use('/demo', serveStatic({ path: './public/demo.html' }))

// Mount all routes from main app
server.route('/', app)

const port = process.env.PORT || 3000
console.log(`Server running at http://localhost:${port}`)
console.log(`Demo page: http://localhost:${port}/demo`)

export default {
  port,
  fetch: server.fetch,
}
