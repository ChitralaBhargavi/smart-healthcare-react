import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import { config } from './config.js'
import { isDatabaseConnected } from './config/db.js'
import { requestLogger } from './middleware/requestLogger.js'
import exampleRoutes from './routes/exampleRoutes.js'
import doctorRoutes from './routes/doctorRoutes.js'
import authRoutes from './routes/authRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'

export const app = express()

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || config.allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Origin is not allowed by the CORS policy.'))
  },
}))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())
app.use(requestLogger)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SmartCare backend is running.',
  })
})

app.get('/api/health/db', (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({
      status: 'unavailable',
      message: 'MongoDB is not connected.',
    })
  }

  return res.json({
    status: 'ok',
    message: 'MongoDB is connected.',
  })
})

app.use('/api/example', exampleRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/notifications', notificationRoutes)

app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} was not found.`,
  })
})

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error)
  }

  const statusCode = error.statusCode
    || (error.message.includes('CORS') ? 403 : 0)
    || (error.name === 'ValidationError' ? 400 : 500)

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Doctor data failed validation.',
      details: Object.fromEntries(
        Object.entries(error.errors).map(([field, value]) => [field, value.message]),
      ),
    })
  }

  if (error.code === 11000) {
    return res.status(409).json({
      error: error.keyPattern?.email
        ? 'An account with this email already exists.'
        : 'A record with that unique value already exists.',
    })
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'A supplied database value has an invalid format.',
    })
  }

  console.error(error.message)
  return res.status(statusCode).json({
    error: statusCode === 403
      ? 'The request origin is not allowed.'
      : error.message || 'An unexpected server error occurred.',
  })
})
