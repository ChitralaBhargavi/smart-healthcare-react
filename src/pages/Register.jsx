import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import {
  validateAge,
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from '../utils/validators.js'

export default function Register() {
  const navigate = useNavigate()
  const { currentUser, loading, register, login, logout } = useAuth()
  const [mode, setMode] = useState('register')
  const [regForm, setRegForm] = useState({
    fullName: '', age: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const [regErrors, setRegErrors] = useState({})
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleRegChange(e) {
    const { name, value } = e.target
    setRegForm((previous) => ({ ...previous, [name]: value }))
    setRegErrors((previous) => ({ ...previous, [name]: '' }))
    setFormError('')
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault()
    const errors = {
      fullName: validateName(regForm.fullName),
      age: validateAge(regForm.age),
      email: validateEmail(regForm.email),
      phone: validatePhone(regForm.phone),
      password: validatePassword(regForm.password),
      confirmPassword: validateConfirmPassword(regForm.password, regForm.confirmPassword),
    }
    setRegErrors(errors)
    if (Object.values(errors).some(Boolean)) return

    setSubmitting(true)
    setFormError('')
    try {
      await register({
        fullName: regForm.fullName.trim(),
        age: Number(regForm.age),
        email: regForm.email.trim(),
        phone: regForm.phone.trim(),
        password: regForm.password,
      })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault()
    const emailError = validateEmail(loginForm.email)
    if (emailError) return setFormError(emailError)
    if (!loginForm.password) return setFormError('Password is required.')

    setSubmitting(true)
    setFormError('')
    try {
      const user = await login(loginForm.email.trim(), loginForm.password)
      navigate(user.role === 'doctor' ? '/doctor/dashboard' : '/appointments')
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="container py-5 text-secondary">Checking your session...</p>

  if (currentUser) {
    return (
      <section className="py-5">
        <div className="container" style={{ maxWidth: '480px' }}>
          <div className="card p-4 shadow-sm text-center">
            <div className="mb-2" style={{ fontSize: '2.5rem' }}>👋</div>
            <h5 className="fw-bold mb-1">Welcome, {currentUser.fullName}</h5>
            <p className="text-secondary small mb-1">{currentUser.email}</p>
            <p className="badge text-bg-light mb-3">{currentUser.role}</p>
            <div className="d-flex gap-2 justify-content-center">
              <button
                className="btn btn-primary"
                onClick={() => navigate(currentUser.role === 'doctor' ? '/doctor/dashboard' : '/appointments')}
              >
                Continue
              </button>
              <button className="btn btn-outline-secondary" onClick={logout}>Log Out</button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-5">
      <div className="container" style={{ maxWidth: '480px' }}>
        <ul className="nav nav-pills mb-4 justify-content-center">
          <li className="nav-item">
            <button className={`nav-link ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
              Create Patient Account
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
              Patient Log In
            </button>
          </li>
        </ul>

        {formError && <div className="alert alert-danger py-2 small">{formError}</div>}

        {mode === 'register' ? (
          <form className="card p-4 shadow-sm" noValidate onSubmit={handleRegisterSubmit}>
            <h5 className="fw-bold mb-3">Create a Patient Account</h5>
            {[
              ['fullName', 'Full Name', 'text'],
              ['age', 'Age', 'number'],
              ['phone', 'Phone', 'tel'],
              ['email', 'Email', 'email'],
              ['password', 'Password', 'password'],
              ['confirmPassword', 'Confirm Password', 'password'],
            ].map(([name, label, type]) => (
              <div className="mb-3" key={name}>
                <label className="form-label small fw-bold">{label}</label>
                <input
                  type={type}
                  name={name}
                  className={`form-control ${regErrors[name] ? 'is-invalid' : ''}`}
                  value={regForm[name]}
                  onChange={handleRegChange}
                />
                {regErrors[name] && <div className="invalid-feedback">{regErrors[name]}</div>}
              </div>
            ))}
            <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Register'}
            </button>
          </form>
        ) : (
          <form className="card p-4 shadow-sm" noValidate onSubmit={handleLoginSubmit}>
            <h5 className="fw-bold mb-3">Patient Log In</h5>
            <div className="mb-3">
              <label className="form-label small fw-bold">Email</label>
              <input
                type="email"
                className="form-control"
                value={loginForm.email}
                onChange={(e) => setLoginForm((previous) => ({ ...previous, email: e.target.value }))}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold">Password</label>
              <input
                type="password"
                className="form-control"
                value={loginForm.password}
                onChange={(e) => setLoginForm((previous) => ({ ...previous, password: e.target.value }))}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Log In'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
