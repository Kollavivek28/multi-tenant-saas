const roleOptions = ['super_admin', 'tenant_admin', 'user']

const UsersTable = ({ users = [], canEdit, onToggleStatus, onRoleChange }) => {
  if (!users.length) {
    return <div className="empty-state">Invite your first teammate</div>
  }

  return (
    <table className="table-shell">
      <thead>
        <tr>
          <th>User</th>
          <th>Role</th>
          <th>Status</th>
          {canEdit && <th style={{ width: 160 }}>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>
              <div style={{ fontWeight: 600 }}>{user.fullName}</div>
              <small style={{ color: 'var(--muted)' }}>{user.email}</small>
            </td>
            <td>
              {canEdit ? (
                <select className="select" value={user.role} onChange={(e) => onRoleChange?.(user.id, e.target.value)}>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="pill">{user.role}</span>
              )}
            </td>
            <td>
              <span className={user.isActive ? 'badge badge--success' : 'badge badge--warning'}>{user.isActive ? 'Active' : 'Suspended'}</span>
            </td>
            {canEdit && (
              <td>
                <button className="btn btn-ghost" type="button" onClick={() => onToggleStatus?.(user.id, !user.isActive)}>
                  {user.isActive ? 'Disable' : 'Activate'}
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default UsersTable
