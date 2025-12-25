import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const RoleGuard = ({ allowed }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!allowed.includes(user.role)) return <Navigate to="/app" replace />
  return <Outlet />
}

export default RoleGuard
