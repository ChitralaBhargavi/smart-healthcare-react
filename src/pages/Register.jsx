import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  validateName,
  validateEmail,
  validatePhone,
  validateAge,
  validatePassword,
  validateConfirmPassword,
} from '../utils/validators.js'

const USERS_KEY = 'smartcare_users'

export default function Register() {
  const navigate = useNavigate()
  const { currentUser, login, logout } = useAuth()
  const [mode, setMode] = useState('register') // 'register' | 'login'

  const [regForm, setRegForm] = useState({
    fullName: '', age: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const [regErrors, setRegErrors] = useState({})

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || []
    } catch {
      return []
    }
  }

  function handleRegChange(e) {
    const { name, value } = e.target
    setRegForm((prev) => ({ ...prev, [name]: value }))
    setRegErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function handleRegisterSubmit(e) {
    e.preventDefault()
    const newErrors = {
      fullName: validateName(regForm.fullName),
      age: validateAge(regForm.age),
      email: validateEmail(regForm.email),
      phone: validatePhone(regForm.phone),
      password: validatePassword(regForm.password),
      confirmPassword: validateConfirmPassword(regForm.password, regForm.confirmPassword),
    }
    setRegErrors(newErrors)
    if (Object.values(newErrors).some((msg) => msg !== '')) return

    const users = getUsers()
    if (users.some((u) => u.email.toLowerCase() === regForm.email.toLowerCase())) {
      setRegErrors((prev) => ({ ...prev, email: 'An account with this email already exists.' }))
      return
    }

    const newUser = {
      fullName: regForm.fullName.trim(),
      age: regForm.age,
      email: regForm.email.trim(),
      phone: regForm.phone.trim(),
      password: regForm.password,
    }
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]))
    login(newUser) // shared context now knows we're logged in — Navbar updates instantly
  }

  function handleLoginChange(e) {
    const { name, value } = e.target
    setLoginForm((prev) => ({ ...prev, [name]: value }))
    setLoginError('')
  }

  function handleLoginSubmit(e) {
    e.preventDefault()
    const emailErr = validateEmail(loginForm.email)
    if (emailErr) return setLoginError(emailErr)
    if (!loginForm.password) return setLoginError('Password is required.')

    const users = getUsers()
    const match = users.find(
      (u) => u.email.toLowerCase() === loginForm.email.toLowerCase() && u.password === loginForm.password
    )
    if (!match) return setLoginError('Invalid email or password.')

    login(match)
  }

  if (currentUser) {
    return (
      <section className="py-5">
        <div className="container" style={{ maxWidth: '480px' }}>
          <div className="card p-4 shadow-sm text-center">
            <div className="mb-2" style={{ fontSize: '2.5rem' }}>👋</div>
            <h5 className="fw-bold mb-1">Welcome, {currentUser.fullName}</h5>
            <p className="text-secondary small mb-3">{currentUser.email}</p>
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-primary" onClick={() => navigate('/appointments')}>
                Book an Appointment
              </button>
              <button className="btn btn-outline-secondary" onClick={logout}>
                Log Out
              </button>
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
            <button
              className={`nav-link ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >
              Create Account
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              Log In
            </button>
          </li>
        </ul>

        {mode === 'register' ? (
          <form className="card p-4 shadow-sm" noValidate onSubmit={handleRegisterSubmit}>
            <h5 className="fw-bold mb-3">Create an Account</h5>

            <div className="mb-3">
              <label className="form-label small fw-bold">Full Name</label>
              <input
                type="text" name="fullName"
                className={`form-control ${regErrors.fullName ? 'is-invalid' : ''}`}
                value={regForm.fullName} onChange={handleRegChange}
              />
              {regErrors.fullName && <div className="invalid-feedback">{regErrors.fullName}</div>}
            </div>

            <div className="row">
              <div className="col-6 mb-3">
                <label className="form-label small fw-bold">Age</label>
                <input
                  type="number" name="age"
                  className={`form-control ${regErrors.age ? 'is-invalid' : ''}`}
                  value={regForm.age} onChange={handleRegChange}
                />
                {regErrors.age && <div className="invalid-feedback">{regErrors.age}</div>}
              </div>
              <div className="col-6 mb-3">
                <label className="form-label small fw-bold">Phone</label>
                <input
                  type="tel" name="phone"
                  className={`form-control ${regErrors.phone ? 'is-invalid' : ''}`}
                  value={regForm.phone} onChange={handleRegChange}
                  placeholder="9876543210"
                />
                {regErrors.phone && <div className="invalid-feedback">{regErrors.phone}</div>}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">Email</label>
              <input
                type="email" name="email"
                className={`form-control ${regErrors.email ? 'is-invalid' : ''}`}
                value={regForm.email} onChange={handleRegChange}
              />
              {regErrors.email && <div className="invalid-feedback">{regErrors.email}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">Password</label>
              <input
                type="password" name="password"
                className={`form-control ${regErrors.password ? 'is-invalid' : ''}`}
                value={regForm.password} onChange={handleRegChange}
              />
              {regErrors.password && <div className="invalid-feedback">{regErrors.password}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">Confirm Password</label>
              <input
                type="password" name="confirmPassword"
                className={`form-control ${regErrors.confirmPassword ? 'is-invalid' : ''}`}
                value={regForm.confirmPassword} onChange={handleRegChange}
              />
              {regErrors.confirmPassword && <div className="invalid-feedback">{regErrors.confirmPassword}</div>}
            </div>

            <button type="submit" className="btn btn-primary w-100">Register</button>
          </form>
        ) : (
          <form className="card p-4 shadow-sm" noValidate onSubmit={handleLoginSubmit}>
            <h5 className="fw-bold mb-3">Log In</h5>
            {loginError && <div className="alert alert-danger py-2 small">{loginError}</div>}
            <div className="mb-3">
              <label className="form-label small fw-bold">Email</label>
              <input
                type="email" name="email"
                className="form-control"
                value={loginForm.email} onChange={handleLoginChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold">Password</label>
              <input
                type="password" name="password"
                className="form-control"
                value={loginForm.password} onChange={handleLoginChange}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">Log In</button>
          </form>
        )}
      </div>
    </section>
  )
}