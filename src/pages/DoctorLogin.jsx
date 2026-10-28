import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { validateEmail } from '../utils/validators.js'

export default function DoctorLogin() {
  const navigate = useNavigate()
  const { currentUser, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (currentUser?.role === 'doctor') navigate('/doctor/dashboard', { replace: true })
  }, [currentUser, navigate])

  if (currentUser?.role === 'doctor') return null

  async function handleSubmit(e) {
    e.preventDefault()
    const emailError = validateEmail(email)
    if (emailError) return setError(emailError)
    if (!password) return setError('Password is required.')

    setSubmitting(true)
    setError('')
    try {
      await login(email.trim(), password, 'doctor')
      navigate('/doctor/dashboard')
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="py-5">
      <div className="container" style={{ maxWidth: '480px' }}>
        <form className="card p-4 shadow-sm" onSubmit={handleSubmit}>
          <h5 className="fw-bold mb-1">Doctor Log In</h5>
          <p className="text-secondary small mb-3">Use a doctor account provisioned in the backend.</p>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <label className="form-label small fw-bold">Email</label>
          <input className="form-control mb-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="form-label small fw-bold">Password</label>
          <input className="form-control mb-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn btn-primary w-100" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Log In as Doctor'}
          </button>
          <a className="small text-center mt-3" href="/doctor/setup">
            Set up or verify your doctor password
          </a>
        </form>
      </div>
    </section>
  )
}
