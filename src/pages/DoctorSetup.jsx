import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiRequest } from '../utils/api.js'
import { validateEmail } from '../utils/validators.js'

export default function DoctorSetup() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [previewLink, setPreviewLink] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function requestSetup(event) {
    event.preventDefault()
    const emailError = validateEmail(email)
    if (emailError) return setError(emailError)
    setSubmitting(true)
    setError('')
    setMessage('')
    setPreviewLink('')
    try {
      const response = await apiRequest('/auth/doctor/setup/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setMessage(response.message)
      setPreviewLink(response.developmentPreview || '')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function completeSetup(event) {
    event.preventDefault()
    if (password !== confirmation) return setError('Passwords do not match.')
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const response = await apiRequest('/auth/doctor/setup/complete', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })
      setMessage(response.message)
      setPassword('')
      setConfirmation('')
    } catch (setupError) {
      setError(setupError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="py-5">
      <div className="container" style={{ maxWidth: '480px' }}>
        <form className="card p-4 shadow-sm" onSubmit={token ? completeSetup : requestSetup}>
          <h5 className="fw-bold mb-1">Doctor Password Setup</h5>
          <p className="text-secondary small mb-3">
            {token
              ? 'Choose a password to activate your SmartCare doctor account.'
              : 'Request a secure setup link for your doctor account.'}
          </p>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          {message && <div className="alert alert-success py-2 small">{message}</div>}
          {!token ? (
            <>
              <label className="form-label small fw-bold">Doctor email</label>
              <input
                className="form-control mb-3"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </>
          ) : (
            <>
              <label className="form-label small fw-bold">New password</label>
              <input
                className="form-control mb-2"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength="12"
                required
              />
              <div className="form-text mb-3">
                Use at least 12 characters with uppercase, lowercase, a number, and a special character.
              </div>
              <label className="form-label small fw-bold">Confirm password</label>
              <input
                className="form-control mb-3"
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                minLength="12"
                required
              />
            </>
          )}
          <button className="btn btn-primary w-100" disabled={submitting}>
            {submitting ? 'Please wait...' : token ? 'Complete Password Setup' : 'Request Setup Link'}
          </button>
          {previewLink && (
            <div className="alert alert-warning small mt-3 mb-0">
              Development-only preview:{' '}
              <a href={previewLink}>Open setup link</a>
            </div>
          )}
        </form>
      </div>
    </section>
  )
}
