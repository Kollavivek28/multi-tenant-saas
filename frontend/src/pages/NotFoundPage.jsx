import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

const NotFoundPage = () => (
  <div className="auth-layout">
    <div className="auth-card" style={{ textAlign: 'center' }}>
      <AlertTriangle size={40} className="icon warning" />
      <h1>Lost in Space</h1>
      <p>The page you are looking for does not exist or has moved.</p>
      <Link to="/login" className="button">Return to Login</Link>
    </div>
  </div>
)

export default NotFoundPage
