import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, Receipt, User } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const dashboardLink = user?.role === 'admin' ? '/admin' : user?.role === 'manager' ? '/manager' : '/employee'

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <Link to={dashboardLink} className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
        <Receipt size={22} />
        <span>ReimburseApp</span>
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 flex items-center gap-1">
          <User size={15} />
          <span>{user?.name}</span>
          <span className="ml-1 capitalize px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{user?.role}</span>
        </span>
        <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </nav>
  )
}
