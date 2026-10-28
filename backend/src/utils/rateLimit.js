const buckets = new Map()

function keyFor(request, scope) {
  return `${scope}:${request.ip || request.socket.remoteAddress || 'unknown'}`
}

export function enforceRateLimit(request, scope, limit, windowMs) {
  const key = keyFor(request, scope)
  const now = Date.now()
  const current = buckets.get(key)
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }

  if (current.count >= limit) {
    const error = new Error('Too many requests. Please try again later.')
    error.statusCode = 429
    throw error
  }

  current.count += 1
}
