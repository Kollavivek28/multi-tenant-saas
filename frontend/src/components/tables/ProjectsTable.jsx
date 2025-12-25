import { format } from 'date-fns'
import StatusBadge from '../common/StatusBadge'

const ProjectsTable = ({ projects = [], onSelect }) => {
  if (!projects.length) {
    return <div className="empty-state">No projects yet</div>
  }

  return (
    <table className="table-shell">
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Tasks</th>
          <th>Owner</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => (
          <tr key={project.id} style={{ cursor: onSelect ? 'pointer' : 'default' }} onClick={() => onSelect?.(project.id)}>
            <td>
              <div style={{ fontWeight: 600 }}>{project.name}</div>
              <small style={{ color: 'var(--muted)' }}>{project.description}</small>
            </td>
            <td>
              <StatusBadge value={project.status} />
            </td>
            <td>
              {project.completedTaskCount ?? 0}/{project.taskCount ?? 0}
            </td>
            <td>{project.createdBy?.fullName || '—'}</td>
            <td>{project.createdAt ? format(new Date(project.createdAt), 'dd MMM') : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default ProjectsTable
