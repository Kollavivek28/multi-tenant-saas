import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api, unwrap } from '../lib/api'
import Loader from '../components/common/Loader'
import ErrorState from '../components/common/ErrorState'
import TasksTable from '../components/tables/TasksTable'

const ProjectDetailPage = () => {
  const { projectId } = useParams()
  const queryClient = useQueryClient()

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}`)
      return unwrap(response)
    },
    enabled: Boolean(projectId),
  })

  const tasksQuery = useQuery({
    queryKey: ['project', projectId, 'tasks'],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}/tasks`)
      return unwrap(response)
    },
    enabled: Boolean(projectId),
  })

  const {
    register,
    handleSubmit,
    reset,
  } = useForm({ defaultValues: { priority: 'medium' } })

  const createTask = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post(`/projects/${projectId}/tasks`, payload)
      return unwrap(response)
    },
    onSuccess: () => {
      reset({ priority: 'medium' })
      queryClient.invalidateQueries({ queryKey: ['project', projectId, 'tasks'] })
    },
  })

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }) => {
      const response = await api.patch(`/tasks/${taskId}/status`, { status })
      return unwrap(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId, 'tasks'] })
    },
  })

  const onSubmit = handleSubmit((values) => createTask.mutate(values))

  const project = projectQuery.data
  const tasks = tasksQuery.data?.tasks || []
  const progress = useMemo(() => {
    if (!project?.taskCount) return 0
    return Math.round(((project.completedTaskCount || 0) / project.taskCount) * 100)
  }, [project])

  if (projectQuery.isLoading) return <Loader label="Loading project" />
  if (projectQuery.isError || !project) return <ErrorState message="Project not found" />

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">{project.name}</h2>
          <p className="page-subtitle">{project.description}</p>
        </div>
        <div className="pill">{progress}% done</div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: 24 }}>
        <div className="panel">
          {tasksQuery.isLoading ? (
            <Loader label="Loading tasks" />
          ) : tasksQuery.isError ? (
            <ErrorState message="Unable to fetch tasks" />
          ) : (
            <TasksTable tasks={tasks} onStatusChange={(taskId, status) => updateTaskStatus.mutate({ taskId, status })} />
          )}
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Add task</h3>
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="title">Title</label>
              <input id="title" className="input" {...register('title', { required: 'Title required' })} />
            </div>
            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea id="description" className="textarea" rows={3} {...register('description')} />
            </div>
            <div className="field">
              <label htmlFor="priority">Priority</label>
              <select id="priority" className="select" {...register('priority')}>
                {['low', 'medium', 'high'].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="dueDate">Due date</label>
              <input id="dueDate" type="date" className="input" {...register('dueDate')} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={createTask.isLoading}>
              {createTask.isLoading ? 'Creating…' : 'Create task'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetailPage
