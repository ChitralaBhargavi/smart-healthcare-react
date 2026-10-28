import { app } from './app.js'
import { config } from './config.js'
import { closeDatabase, connectDatabase } from './config/db.js'
import { assertAuthConfiguration } from './utils/auth.js'

let server

async function startServer() {
  try {
    assertAuthConfiguration()
    await connectDatabase()
    server = app.listen(config.port, () => {
      console.log(`SmartCare backend listening on http://localhost:${config.port}`)
    })
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}

async function stopServer(signal) {
  console.log(`${signal} received. Shutting down gracefully.`)

  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }

  await closeDatabase()
  process.exit(0)
}

process.once('SIGINT', () => stopServer('SIGINT'))
process.once('SIGTERM', () => stopServer('SIGTERM'))

startServer()
