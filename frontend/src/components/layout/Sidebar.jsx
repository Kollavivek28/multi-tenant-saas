import { NavLink } from 'react-router-dom'
import { FolderKanban, LayoutDashboard, Shield, Users, CheckSquare } from 'lucide-react'
import useAuth from '../../hooks/useAuth'

const navItems = [
  { label: 'Overview', path: '/app', icon: LayoutDashboard, roles: ['super_admin', 'tenant_admin', 'user'] },
  { label: 'Projects', path: '/app/projects', icon: FolderKanban, roles: ['super_admin', 'tenant_admin', 'user'] },
  { label: 'Tasks', path: '/app/tasks', icon: CheckSquare, roles: ['super_admin', 'tenant_admin', 'user'] },
  { label: 'Users', path: '/app/users', icon: Users, roles: ['super_admin', 'tenant_admin'] },
]

const Sidebar = () => {
  const { user } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark">MT</div>
        <div>
          <div className="sidebar__title">MultiTenant</div>
          <small style={{ color: 'var(--muted)' }}>Control center</small>
        </div>
      </div>

      <nav className="sidebar__nav">
        {navItems
          .filter((item) => user && item.roles.includes(user.role))
          .map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => (isActive ? 'sidebar__link active' : 'sidebar__link')}>
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
      </nav>

      <div className="sidebar__footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} />
          <span>{user?.role?.replace('_', ' ')}</span>
        </div>
        {user?.tenant?.name && <div style={{ marginTop: 4, color: 'var(--muted)' }}>{user.tenant.name}</div>}
      </div>
    </aside>
  )
}

export default Sidebar
