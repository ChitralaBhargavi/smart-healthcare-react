import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

export default function Navbar() {
  const { currentUser, logout } = useAuth()
  const links = [
    { to: '/', label: 'Home' },
    { to: '/doctors', label: 'Doctors' },
    { to: '/appointments', label: 'Appointments' },
    { to: '/health-tips', label: 'Health Tips' },
  ]

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold text-primary" to="/">
          <span className="brand-dot"></span> SmartCare
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navMenu"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 gap-lg-3">
            {links.map((link) => (
              <li className="nav-item" key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    'nav-link' + (isActive ? ' active-link' : '')
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {currentUser?.role === 'doctor' ? (
            <div className="d-flex align-items-center gap-2 ms-lg-3">
              <Link to="/doctor/dashboard" className="btn btn-primary">Doctor Dashboard</Link>
              <button className="btn btn-outline-secondary" onClick={logout}>Log Out</button>
            </div>
          ) : (
            <div className="d-flex flex-wrap gap-2 ms-lg-3">
              <Link to="/register" className="btn btn-primary">
                Register / Login
              </Link>
              <Link to="/doctor/login" className="btn btn-outline-primary">
                Doctor Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}