const variantMap = {
  active: 'badge badge--success',
  completed: 'badge badge--success',
  archived: 'badge badge--warning',
  suspended: 'badge badge--warning',
  todo: 'badge badge--info',
  in_progress: 'badge badge--info',
  trial: 'badge badge--info',
}

const StatusBadge = ({ value }) => {
  const key = value?.toLowerCase?.() || 'default'
  const className = variantMap[key] || 'badge badge--info'
  return <span className={className}>{value?.replace?.('_', ' ') || '-'}</span>
}

export default StatusBadge
