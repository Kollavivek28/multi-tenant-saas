import { Bell, LogOut } from 'lucide-react'
import useAuth from '../../hooks/useAuth'

const Topbar = () => {
  const { user, logout } = useAuth()

  return (
    <header className="topbar">
      <div>
        <div style={{ fontWeight: 600 }}>Hi, {user?.fullName?.split(' ')[0] || 'there'}</div>
        <small style={{ color: 'var(--muted)' }}>Let’s keep every tenant on track</small>
      </div>
      <div className="topbar__actions">
        <button className="btn btn-ghost" type="button" aria-label="Activity">
          <Bell size={18} />
        </button>
        <div className="user-pill">
          <strong>{user?.fullName}</strong>
          <small>{user?.role}</small>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => logout(true)}>
          <LogOut size={16} />
          &nbsp;Logout
        </button>
      </div>
    </header>
  )
}

export default Topbar
