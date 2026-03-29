import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signup as signupApi, getCountries } from '../api'
import toast from 'react-hot-toast'
import { Receipt } from 'lucide-react'

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', company_name: '', country: '', currency_code: '', currency_symbol: '' })
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    getCountries().then(res => setCountries(res.data)).catch(() => {})
  }, [])

  const handleCountryChange = (e) => {
    const selected = countries.find(c => c.country === e.target.value)
    if (selected) {
      setForm({ ...form, country: selected.country, currency_code: selected.currency_code, currency_symbol: selected.currency_symbol })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signupApi(form)
      login(res.data.access_token, res.data.user)
      toast.success('Company and account created!')
      navigate('/admin')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const uniqueCountries = [...new Map(countries.map(c => [c.country, c])).values()]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="card w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Receipt size={28} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">ReimburseApp</h1>
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-6 text-center">Create your company account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Your Name</label>
              <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div>
              <label className="label">Company Name</label>
              <input className="input" required value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="Acme Corp" />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@company.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="label">Country (sets default currency)</label>
            <select className="input" required value={form.country} onChange={handleCountryChange}>
              <option value="">Select a country...</option>
              {uniqueCountries.map(c => (
                <option key={c.country} value={c.country}>{c.country} ({c.currency_code})</option>
              ))}
            </select>
          </div>
          {form.currency_code && (
            <div className="bg-indigo-50 rounded-lg p-3 text-sm text-indigo-700">
              Company currency set to: <strong>{form.currency_code} {form.currency_symbol}</strong>
            </div>
          )}
          <button type="submit" disabled={loading || !form.currency_code} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
