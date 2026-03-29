import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import { getExpenses } from '../api'
import { Plus, Receipt, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmployeeDashboard() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getExpenses()
      .then(res => setExpenses(res.data))
      .catch(() => toast.error('Failed to load expenses'))
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: expenses.length,
    approved: expenses.filter(e => e.state === 'approved').length,
    pending: expenses.filter(e => e.state === 'waiting').length,
    totalAmount: expenses.filter(e => e.state === 'approved').reduce((s, e) => s + (e.amount_in_company_currency || 0), 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Expenses</h1>
            <p className="text-gray-500 text-sm mt-1">Track and manage your expense claims</p>
          </div>
          <Link to="/expenses/new" className="btn-primary flex items-center gap-2">
            <Plus size={18} /> New Expense
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: Receipt, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Reimbursed', value: `${stats.totalAmount.toFixed(0)}`, icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
          ].map(stat => (
            <div key={stat.label} className="card flex items-center gap-3 p-4">
              <div className={`p-2 rounded-lg ${stat.color}`}><stat.icon size={20} /></div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Expense List */}
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">All Expenses</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Receipt size={40} className="mx-auto mb-3 opacity-30" />
              <p>No expenses yet. Create your first one!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {expenses.map(exp => (
                <Link key={exp.id} to={`/expenses/${exp.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{exp.title}</p>
                    <p className="text-sm text-gray-500">{exp.category} • {new Date(exp.expense_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{exp.amount} {exp.currency_code}</p>
                      {exp.amount_in_company_currency && exp.currency_code !== 'INR' && (
                        <p className="text-xs text-gray-400">≈ {exp.amount_in_company_currency} (company)</p>
                      )}
                    </div>
                    <StatusBadge state={exp.state} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
