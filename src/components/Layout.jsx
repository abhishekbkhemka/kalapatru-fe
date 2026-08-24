import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Layout() {
  const { user, logout, canManageUsers } = useAuth()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-mark">K</span>
            <div>
              <strong>Kalapatru</strong>
              <span className="brand-sub">Logistics</span>
            </div>
          </div>
          <div className="header-user">
            <span>
              {user?.first_name || user?.username}
              <em className="role-pill">{user?.role}</em>
            </span>
            <button type="button" className="link-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <NavLink to="/forwarding-note">Forwarding Note</NavLink>
        <NavLink to="/dispatch">Dispatch</NavLink>
        <NavLink to="/dispatches">Dispatches</NavLink>
        {canManageUsers && <NavLink to="/users">Users</NavLink>}
      </nav>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
