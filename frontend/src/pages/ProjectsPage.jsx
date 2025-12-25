import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import useAuth from '../hooks/useAuth'
import { api, unwrap } from '../lib/api'
import ProjectsTable from '../components/tables/ProjectsTable'
import Loader from '../components/common/Loader'
import ErrorState from '../components/common/ErrorState'

const ProjectsPage = () => {
  const { user } = useAuth()
  const tenantId = user?.tenantId
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ search: '', status: '' })

  const projectsQuery = useQuery({
    queryKey: ['projects', tenantId, filters],
    queryFn: async () => {
      const response = await api.get('/projects', {
        params: {
          tenantId,
          search: filters.search || undefined,
          status: filters.status || undefined,
        },
      })
      return unwrap(response)
    },
    enabled: !!tenantId || user?.role === 'super_admin',
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { status: 'active' } })

  const createMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.post('/projects', values)
      return unwrap(response)
    },
    onSuccess: () => {
      reset({ status: 'active' })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const onSubmit = handleSubmit((values) => createMutation.mutate(values))

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Projects</h2>
          <p className="page-subtitle">Spin up initiatives, track throughput</p>
        </div>
        <div className="filter-bar">
          <input className="input search-input" placeholder="Search" value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} />
          <select className="select" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="">All statuses</option>
            {['active', 'archived', 'completed'].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: 24 }}>
        <div className="panel">
          {projectsQuery.isLoading ? (
            <Loader label="Loading projects" />
          ) : projectsQuery.isError ? (
            <ErrorState message="Unable to load projects" onRetry={() => projectsQuery.refetch()} />
          ) : (
            <ProjectsTable projects={projectsQuery.data?.projects || []} onSelect={(id) => navigate(`/app/projects/${id}`)} />
          )}
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Create project</h3>
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" className="input" {...register('name', { required: 'Name is required' })} />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea id="description" className="textarea" rows={4} {...register('description')} />
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" className="select" {...register('status')}>
                {['active', 'archived', 'completed'].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Creating…' : 'Add project'}
            </button>
            {createMutation.isError && <div className="field-error">Failed to create project</div>}
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProjectsPage
