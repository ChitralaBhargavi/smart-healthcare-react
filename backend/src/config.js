import 'dotenv/config'

const port = Number.parseInt(process.env.PORT || '5000', 10)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.')
}

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export const config = {
  port,
  allowedOrigins,
  clientOrigin: allowedOrigins[0] || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI?.trim() || '',
  dbName: process.env.DB_NAME?.trim() || 'smartcare',
  jwtSecret: process.env.JWT_SECRET?.trim() || '',
  authCookieName: process.env.AUTH_COOKIE_NAME?.trim() || 'smartcare_auth',
  setupTokenMinutes: Number.parseInt(process.env.DOCTOR_SETUP_TOKEN_MINUTES || '20', 10),
  mail: {
    host: process.env.SMTP_HOST?.trim() || '',
    port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER?.trim() || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.MAIL_FROM?.trim() || '',
  },
  isProduction: process.env.NODE_ENV === 'production',
}
