const statusOptions = ['todo', 'in_progress', 'completed']

const TasksTable = ({ tasks = [], onStatusChange }) => {
  if (!tasks.length) {
    return <div className="empty-state">No tasks for this selection</div>
  }

  return (
    <table className="table-shell">
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Assignee</th>
          <th>Due</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr key={task.id}>
            <td>
              <div style={{ fontWeight: 600 }}>{task.title}</div>
              <small style={{ color: 'var(--muted)' }}>{task.description}</small>
            </td>
            <td>
              <select className="select" value={task.status} onChange={(e) => onStatusChange?.(task.id, e.target.value)}>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </td>
            <td>{task.priority}</td>
            <td>{task.assignedTo?.fullName || 'Unassigned'}</td>
            <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default TasksTable
