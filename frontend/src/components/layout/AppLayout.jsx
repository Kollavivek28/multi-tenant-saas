import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const AppLayout = () => (
  <div className="app-shell">
    <Sidebar />
    <div className="main-area">
      <Topbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  </div>
)

export default AppLayout
