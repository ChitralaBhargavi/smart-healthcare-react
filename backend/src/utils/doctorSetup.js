import { createHash, randomBytes } from 'node:crypto'

export function createSetupToken() {
  const token = randomBytes(32).toString('base64url')
  return {
    token,
    tokenHash: createHash('sha256').update(token).digest('hex'),
  }
}

export function hashSetupToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function validateSetupPassword(password) {
  if (typeof password !== 'string' || password.length < 12) {
    return 'Password must be at least 12 characters long.'
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)
    || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include uppercase, lowercase, number, and special character.'
  }
  return ''
}
