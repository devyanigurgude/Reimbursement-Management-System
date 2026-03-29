import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import { getExpense, getExpenseApprovals, submitExpense } from '../api'
import { ArrowLeft, CheckCircle, XCircle, Clock, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ExpenseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [expense, setExpense] = useState(null)
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [eRes, aRes] = await Promise.all([getExpense(id), getExpenseApprovals(id)])
      setExpense(eRes.data)
      setApprovals(aRes.data)
    } catch { toast.error('Failed to load expense') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const handleSubmit = async () => {
    try {
      await submitExpense(id)
      toast.success('Submitted for approval!')
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="card mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{expense?.title}</h1>
              <p className="text-sm text-gray-500 mt-1">{expense?.vendor_name && `${expense.vendor_name} • `}{expense?.category}</p>
            </div>
            <StatusBadge state={expense?.state} />
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-1 mb-6">
            {['draft', 'waiting', 'approved'].map((step, i) => {
              const stateIndex = ['draft', 'waiting', 'approved'].indexOf(expense?.state)
              const isActive = i <= stateIndex
              const isCurrent = step === expense?.state
              return (
                <div key={step} className="flex items-center flex-1 gap-1">
                  <div className={`h-2 flex-1 rounded-full transition-colors ${isActive ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                  <span className={`text-xs capitalize whitespace-nowrap ${isCurrent ? 'text-indigo-600 font-semibold' : isActive ? 'text-gray-600' : 'text-gray-400'}`}>{step}</span>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Amount:</span><span className="ml-2 font-semibold">{expense?.amount} {expense?.currency_code}</span></div>
            <div><span className="text-gray-500">Company amount:</span><span className="ml-2 font-semibold">{expense?.amount_in_company_currency?.toFixed(2)}</span></div>
            <div><span className="text-gray-500">Date:</span><span className="ml-2">{expense?.expense_date && new Date(expense.expense_date).toLocaleDateString()}</span></div>
            <div><span className="text-gray-500">Submitted:</span><span className="ml-2">{expense?.created_at && new Date(expense.created_at).toLocaleDateString()}</span></div>
            <div className="col-span-2">
              <span className="text-gray-500">Applied Rule:</span>
              <span className="ml-2 font-medium">{expense?.applied_rule_name || 'Auto-approve / No rule'}</span>
            </div>
          </div>

          {expense?.description && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">{expense.description}</div>
          )}

          {expense?.state === 'draft' && (
            <button onClick={handleSubmit} className="btn-primary flex items-center gap-2 text-sm mt-4">
              <Send size={16} /> Submit for Approval
            </button>
          )}
        </div>

        {/* Approval Timeline */}
        {approvals.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">Approval Timeline</h2>
            <div className="space-y-4">
              {approvals.map((req, idx) => (
                <div key={req.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      req.state === 'approved' ? 'bg-green-100 text-green-600' :
                      req.state === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {req.state === 'approved' ? <CheckCircle size={16} /> : req.state === 'rejected' ? <XCircle size={16} /> : <Clock size={16} />}
                    </div>
                    {idx < approvals.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">{req.approver_name}</span>
                      {req.is_manager_step && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Manager</span>}
                      <span className="text-xs text-gray-400">Step {req.sequence}</span>
                    </div>
                    <StatusBadge state={req.state} />
                    {req.comment && <p className="text-sm text-gray-500 mt-1 italic">"{req.comment}"</p>}
                    {req.acted_at && <p className="text-xs text-gray-400 mt-1">{new Date(req.acted_at).toLocaleString()}</p>}
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
