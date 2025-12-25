import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api, unwrap } from '../lib/api'
import UsersTable from '../components/tables/UsersTable'
import Loader from '../components/common/Loader'
import ErrorState from '../components/common/ErrorState'
import useAuth from '../hooks/useAuth'

const UsersPage = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const tenantId = user?.tenantId
  const canManage = user && ['tenant_admin', 'super_admin'].includes(user.role)

  const usersQuery = useQuery({
    queryKey: ['users', tenantId, user?.role],
    queryFn: async () => {
      const response = await api.get('/users', {
        params: {
          tenantId: user?.role === 'super_admin' ? tenantId : undefined,
        },
      })
      return unwrap(response)
    },
    enabled: Boolean(user),
  })

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      const response = await api.patch(`/users/${userId}/role`, { role })
      return unwrap(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({ userId, isActive }) => {
      const response = await api.patch(`/users/${userId}/status`, { isActive })
      return unwrap(response)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'user',
    },
  })

  const createUser = useMutation({
    mutationFn: async (values) => {
      if (!tenantId) {
        throw new Error('Tenant context missing')
      }
      const response = await api.post(`/tenants/${tenantId}/users`, values)
      return unwrap(response)
    },
    onSuccess: () => {
      reset({ fullName: '', email: '', password: '', role: 'user' })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const onSubmit = handleSubmit((values) => createUser.mutate(values))

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Users</h2>
          <p className="page-subtitle">Manage tenant roles and access</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: canManage && tenantId ? 'minmax(0, 2fr) minmax(320px, 1fr)' : '1fr', gap: 24 }}>
        <div className="panel">
          {usersQuery.isLoading ? (
            <Loader label="Loading users" />
          ) : usersQuery.isError ? (
            <ErrorState message="Unable to load users" onRetry={() => usersQuery.refetch()} />
          ) : (
            <UsersTable
              users={usersQuery.data?.users || []}
              canEdit={canManage}
              onRoleChange={(userId, role) => roleMutation.mutate({ userId, role })}
              onToggleStatus={(userId, isActive) => statusMutation.mutate({ userId, isActive })}
            />
          )}
        </div>

        {canManage && tenantId && (
          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Invite user</h3>
            <form className="auth-form" onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="fullName">Full name</label>
                <input id="fullName" className="input" {...register('fullName', { required: 'Name is required' })} />
                {errors.fullName && <span className="field-error">{errors.fullName.message}</span>}
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" className="input" {...register('email', { required: 'Email is required' })} />
                {errors.email && <span className="field-error">{errors.email.message}</span>}
              </div>
              <div className="field">
                <label htmlFor="password">Temporary password</label>
                <input id="password" type="password" className="input" {...register('password', { required: 'Password is required', minLength: { value: 8, message: '8+ characters' } })} />
                {errors.password && <span className="field-error">{errors.password.message}</span>}
              </div>
              <div className="field">
                <label htmlFor="role">Role</label>
                <select id="role" className="select" {...register('role')}>
                  <option value="user">Member</option>
                  <option value="tenant_admin">Tenant admin</option>
                </select>
              </div>
              {createUser.isError && <div className="field-error">Unable to invite user</div>}
              <button className="btn btn-primary" type="submit" disabled={createUser.isLoading}>
                {createUser.isLoading ? 'Inviting…' : 'Invite user'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default UsersPage
