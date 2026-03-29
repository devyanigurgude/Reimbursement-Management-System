import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as loginApi } from '../api'
import toast from 'react-hot-toast'
import { Receipt } from 'lucide-react'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await loginApi(form)
      login(res.data.access_token, res.data.user)
      toast.success(`Welcome back, ${res.data.user.name}!`)
      const role = res.data.user.role
      navigate(role === 'admin' ? '/admin' : role === 'manager' ? '/manager' : '/employee')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Receipt size={28} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">ReimburseApp</h1>
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-6 text-center">Sign in to your account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account? <Link to="/signup" className="text-indigo-600 hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
