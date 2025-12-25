import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '../lib/api'
import useAuth from '../hooks/useAuth'
import MetricCard from '../components/common/MetricCard'
import ProjectsTable from '../components/tables/ProjectsTable'
import TaskCompletionChart from '../components/dashboard/TaskCompletionChart'
import Loader from '../components/common/Loader'
import ErrorState from '../components/common/ErrorState'

const DashboardPage = () => {
  const { user } = useAuth()
  const tenantId = user?.tenantId

  const tenantQuery = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const response = await api.get(`/tenants/${tenantId}`)
      return unwrap(response)
    },
    enabled: Boolean(tenantId),
  })

  const projectsQuery = useQuery({
    queryKey: ['projects', tenantId],
    queryFn: async () => {
      const response = await api.get('/projects', { params: { limit: 5 } })
      return unwrap(response)
    },
    enabled: !!tenantId || user?.role === 'super_admin',
  })

  const chartData = useMemo(() => {
    const list = projectsQuery.data?.projects || []
    return list.map((project) => ({
      label: project.name.slice(0, 10),
      completed: project.completedTaskCount || 0,
    }))
  }, [projectsQuery.data])

  if (tenantQuery.isLoading || projectsQuery.isLoading) {
    return <Loader label="Loading dashboard" />
  }

  if (tenantQuery.isError) {
    return <ErrorState message="Unable to load tenant stats" onRetry={() => tenantQuery.refetch()} />
  }

  const stats = tenantQuery.data?.stats
  const metrics = [
    { label: 'Projects', value: stats?.totalProjects ?? 0, helper: 'org-wide' },
    { label: 'Tasks', value: stats?.totalTasks ?? 0, helper: 'all statuses' },
    { label: 'Users', value: stats?.totalUsers ?? 0, helper: tenantQuery.data?.subscriptionPlan ?? 'free' },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Command Center</h2>
          <p className="page-subtitle">Usage across {tenantQuery.data?.name || 'tenant'}</p>
        </div>
      </div>

      <div className="grid grid-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24 }}>
        <div className="panel">
          <div className="page-header">
            <div>
              <h3 style={{ margin: 0 }}>Active projects</h3>
              <p className="page-subtitle">Most recent initiatives</p>
            </div>
          </div>
          {projectsQuery.isError ? <ErrorState message="Failed to load projects" onRetry={() => projectsQuery.refetch()} /> : <ProjectsTable projects={projectsQuery.data?.projects || []} />}
        </div>
        <TaskCompletionChart data={chartData} />
      </div>
    </div>
  )
}

export default DashboardPage
