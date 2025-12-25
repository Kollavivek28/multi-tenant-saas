import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../lib/api'
import TasksTable from '../components/tables/TasksTable'
import Loader from '../components/common/Loader'
import ErrorState from '../components/common/ErrorState'

const TasksPage = () => {
  const [selectedProject, setSelectedProject] = useState('')
  const queryClient = useQueryClient()

  const projectsQuery = useQuery({
    queryKey: ['projects', 'task-view'],
    queryFn: async () => {
      const response = await api.get('/projects', { params: { limit: 20 } })
      return unwrap(response)
    },
  })

  useEffect(() => {
    if (!selectedProject && projectsQuery.data?.projects?.length) {
      setSelectedProject(projectsQuery.data.projects[0].id)
    }
  }, [projectsQuery.data, selectedProject])

  const tasksQuery = useQuery({
    queryKey: ['project', selectedProject, 'tasks'],
    queryFn: async () => {
      const response = await api.get(`/projects/${selectedProject}/tasks`)
      return unwrap(response)
    },
    enabled: Boolean(selectedProject),
  })

  const updateStatus = useMutation({
    mutationFn: async ({ taskId, status }) => {
      const response = await api.patch(`/tasks/${taskId}/status`, { status })
      return unwrap(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', selectedProject, 'tasks'] })
    },
  })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Tasks</h2>
          <p className="page-subtitle">Cross-project execution view</p>
        </div>
        <select className="select" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
          {projectsQuery.data?.projects?.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div className="panel">
        {tasksQuery.isLoading ? (
          <Loader label="Loading tasks" />
        ) : tasksQuery.isError ? (
          <ErrorState message="Unable to load tasks" />
        ) : (
          <TasksTable tasks={tasksQuery.data?.tasks || []} onStatusChange={(taskId, status) => updateStatus.mutate({ taskId, status })} />
        )}
      </div>
    </div>
  )
}

export default TasksPage
