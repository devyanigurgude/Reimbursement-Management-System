import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import { getPendingApprovals, getApprovalSummary, approveRequest, rejectRequest, getExpenses } from '../api'
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ManagerDashboard() {
  const [pending, setPending] = useState([])
  const [allExpenses, setAllExpenses] = useState([])
  const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState({})
  const [activeTab, setActiveTab] = useState('pending')

  const load = async () => {
    try {
      const [pRes, sRes, eRes] = await Promise.all([getPendingApprovals(), getApprovalSummary(), getExpenses()])
      setPending(pRes.data)
      setSummary(sRes.data)
      setAllExpenses(eRes.data)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (id) => {
    try {
      await approveRequest(id, comment[id] || '')
      toast.success('Expense approved!')
      load()
    } catch { toast.error('Failed to approve') }
  }

  const handleReject = async (id) => {
    if (!comment[id]) { toast.error('Please add a comment when rejecting'); return }
    try {
      await rejectRequest(id, comment[id])
      toast.success('Expense rejected')
      load()
    } catch { toast.error('Failed to reject') }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Review and approve expense requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending Review', value: pending.length, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Team Expenses', value: allExpenses.length, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Approved By You', value: summary.approved, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
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

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {['pending', 'all'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {tab === 'pending' ? `Pending (${pending.length})` : `All Team Expenses (${allExpenses.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : activeTab === 'pending' ? (
          <div className="space-y-4">
            {pending.length === 0 ? (
              <div className="card text-center py-12 text-gray-400">
                <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
                <p>No pending approvals. You're all caught up!</p>
              </div>
            ) : pending.map(req => (
              <div key={req.request_id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{req.expense_title}</h3>
                    <p className="text-sm text-gray-500">By {req.employee_name} • {req.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">{req.amount} {req.currency}</p>
                    <StatusBadge state={req.state} />
                  </div>
                </div>
                <div className="mt-3">
                  <input
                    className="input text-sm"
                    placeholder="Add a comment (required for rejection)..."
                    value={comment[req.request_id] || ''}
                    onChange={e => setComment({ ...comment, [req.request_id]: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 mt-3">
                  <button onClick={() => handleApprove(req.request_id)} className="btn-success flex items-center gap-2 text-sm">
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button onClick={() => handleReject(req.request_id)} className="btn-danger flex items-center gap-2 text-sm">
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {allExpenses.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No team expenses found</div>
              ) : allExpenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{exp.title}</p>
                    <p className="text-sm text-gray-500">{exp.category} • {new Date(exp.expense_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold text-gray-900">{exp.amount_in_company_currency?.toFixed(2)}</p>
                    <StatusBadge state={exp.state} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
