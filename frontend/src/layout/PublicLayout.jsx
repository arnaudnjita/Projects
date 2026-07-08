import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import BrandMark from '../components/BrandMark'

function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user } = useAuth()

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink className="site-header__brand" to="/" onClick={closeMenu}>
            <BrandMark />
          </NavLink>
          <button
            aria-controls="primary-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            className="site-header__menu"
            onClick={() => setMenuOpen((value) => !value)}
            type="button"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <nav className={`site-nav ${menuOpen ? 'site-nav--open' : ''}`} id="primary-navigation">
            <NavLink to="/marketplace" onClick={closeMenu}>
              Marketplace
            </NavLink>
            {user ? null : (
              <>
                <NavLink to="/login" onClick={closeMenu}>
                  Login
                </NavLink>
                <NavLink to="/register" onClick={closeMenu}>
                  Register
                </NavLink>
              </>
            )}
            {user?.role === 'farmer' ? (
              <NavLink to="/farmer/dashboard" onClick={closeMenu}>
                Farmer Dashboard
              </NavLink>
            ) : null}
            {import.meta.env.DEV ? (
              <NavLink to="/dev/components" onClick={closeMenu}>
                Components
              </NavLink>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="main-container">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <BrandMark />
          <p>Fresh produce connections for Buea Municipality.</p>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
