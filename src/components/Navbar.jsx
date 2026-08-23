import { NavLink, Link } from 'react-router-dom'

export default function Navbar() {
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
          <Link to="/register" className="btn btn-primary ms-lg-3">
            Register / Login
          </Link>
        </div>
      </div>
    </nav>
  )
}