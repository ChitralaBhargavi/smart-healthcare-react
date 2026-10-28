import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export function assertAuthConfiguration() {
  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.')
  }
}

export function createAuthToken(user) {
  assertAuthConfiguration()
  return jwt.sign(
    { role: user.role },
    config.jwtSecret,
    { subject: user._id.toString(), expiresIn: '1d' },
  )
}

export function publicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    age: user.age,
    role: user.role,
  }
}

export function setAuthCookie(res, token) {
  res.cookie(config.authCookieName, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  })
}
