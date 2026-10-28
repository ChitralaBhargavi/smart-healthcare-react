import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { config } from '../config.js'

export async function authenticateUser(req, res, next) {
  const token = req.cookies?.[config.authCookieName]
  if (!token) {
    return res.status(401).json({ error: 'Authentication is required.' })
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret)
    const user = await User.findById(payload.sub)
    if (!user || user.role !== payload.role) {
      return res.status(401).json({ error: 'Authentication is no longer valid.' })
    }

    req.user = user
    return next()
  } catch {
    return res.status(401).json({ error: 'Authentication is invalid or expired.' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission for this resource.' })
    }

    return next()
  }
}
