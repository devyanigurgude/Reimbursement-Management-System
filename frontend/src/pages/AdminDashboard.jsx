import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { getUsers, createUser, updateUser, deleteUser, getManagers, getApprovalRules, createApprovalRule, deleteApprovalRule, getExpenses, getPendingApprovals, getApprovalSummary, approveRequest, rejectRequest } from '../api'
import { Plus, Trash2, Edit2, Shield, Users, Receipt, Settings, Clock, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import StatusBadge from '../components/StatusBadge'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [managers, setManagers] = useState([])
  const [rules, setRules] = useState([])
  const [expenses, setExpenses] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [approvalSummary, setApprovalSummary] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [approvalComment, setApprovalComment] = useState({})
  const [showUserForm, setShowUserForm] = useState(false)
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'employee', manager_id: '', is_manager_approver: false })
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    is_manager_approver: false,
    use_sequence: true,
    min_approval_percentage: 100,
    min_amount: '',
    max_amount: '',
    category: '',
    employee_role: '',
    priority: 100,
    is_auto_approve: false,
    approver_lines: [],
  })

  const load = async () => {
    try {
      const [uRes, mRes, rRes, eRes, pRes, sRes] = await Promise.all([getUsers(), getManagers(), getApprovalRules(), getExpenses(), getPendingApprovals(), getApprovalSummary()])
      setUsers(uRes.data)
      setManagers(mRes.data)
      setRules(rRes.data)
      setExpenses(eRes.data)
      setPendingApprovals(pRes.data)
      setApprovalSummary(sRes.data)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      const data = { ...userForm, manager_id: userForm.manager_id ? parseInt(userForm.manager_id) : null }
      await createUser(data)
      toast.success('User created!')
      setShowUserForm(false)
      setUserForm({ name: '', email: '', password: '', role: 'employee', manager_id: '', is_manager_approver: false })
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return
    try { await deleteUser(id); toast.success('User deleted'); load() }
    catch { toast.error('Failed') }
  }

  const addApproverLine = () => {
    setRuleForm({ ...ruleForm, approver_lines: [...ruleForm.approver_lines, { approver_id: '', sequence: ruleForm.approver_lines.length + 1, is_key_approver: false }] })
  }

  const updateApproverLine = (idx, field, value) => {
    const lines = [...ruleForm.approver_lines]
    lines[idx] = { ...lines[idx], [field]: value }
    setRuleForm({ ...ruleForm, approver_lines: lines })
  }

  const handleCreateRule = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...ruleForm,
        min_amount: ruleForm.min_amount === '' ? null : parseFloat(ruleForm.min_amount),
        max_amount: ruleForm.max_amount === '' ? null : parseFloat(ruleForm.max_amount),
        category: ruleForm.category === '' ? null : ruleForm.category,
        employee_role: ruleForm.employee_role === '' ? null : ruleForm.employee_role,
        approver_lines: ruleForm.approver_lines.map(l => ({ ...l, approver_id: parseInt(l.approver_id) }))
      }
      await createApprovalRule(data)
      toast.success('Approval rule created!')
      setShowRuleForm(false)
      setRuleForm({
        name: '',
        description: '',
        is_manager_approver: false,
        use_sequence: true,
        min_approval_percentage: 100,
        min_amount: '',
        max_amount: '',
        category: '',
        employee_role: '',
        priority: 100,
        is_auto_approve: false,
        approver_lines: [],
      })
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const handleApprove = async (id) => {
    try {
      await approveRequest(id, approvalComment[id] || '')
      toast.success('Expense approved!')
      load()
    } catch { toast.error('Failed to approve') }
  }

  const handleReject = async (id) => {
    if (!approvalComment[id]) { toast.error('Please add a comment when rejecting'); return }
    try {
      await rejectRequest(id, approvalComment[id])
      toast.success('Expense rejected')
      load()
    } catch { toast.error('Failed to reject') }
  }

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'approvals', label: 'Approvals', icon: Clock },
    { id: 'rules', label: 'Approval Rules', icon: Shield },
    { id: 'expenses', label: 'All Expenses', icon: Receipt },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage users, approval rules and all expenses</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Users', value: users.length, color: 'text-indigo-600 bg-indigo-50', icon: Users },
            { label: 'Approval Rules', value: rules.length, color: 'text-purple-600 bg-purple-50', icon: Shield },
            { label: 'Total Expenses', value: expenses.length, color: 'text-green-600 bg-green-50', icon: Receipt },
          ].map(s => (
            <div key={s.label} className="card flex items-center gap-3 p-4">
              <div className={`p-2 rounded-lg ${s.color}`}><s.icon size={20} /></div>
              <div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : activeTab === 'users' ? (
          <div>
            <div className="flex justify-end mb-3">
              <button onClick={() => setShowUserForm(!showUserForm)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={16} /> Add User
              </button>
            </div>
            {showUserForm && (
              <div className="card mb-4">
                <h3 className="font-semibold text-gray-800 mb-4">Create New User</h3>
                <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
                  <div><label className="label">Name</label><input className="input" required value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} /></div>
                  <div><label className="label">Email</label><input className="input" type="email" required value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} /></div>
                  <div><label className="label">Password</label><input className="input" type="password" required value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} /></div>
                  <div>
                    <label className="label">Role</label>
                    <select className="input" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Manager</label>
                    <select className="input" value={userForm.manager_id} onChange={e => setUserForm({ ...userForm, manager_id: e.target.value })}>
                      <option value="">No manager</option>
                      {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input type="checkbox" id="isManagerApprover" checked={userForm.is_manager_approver} onChange={e => setUserForm({ ...userForm, is_manager_approver: e.target.checked })} className="rounded" />
                    <label htmlFor="isManagerApprover" className="text-sm text-gray-700">Is Manager Approver</label>
                  </div>
                  <div className="col-span-2 flex gap-3">
                    <button type="submit" className="btn-primary text-sm">Create User</button>
                    <button type="button" onClick={() => setShowUserForm(false)} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </form>
              </div>
            )}
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Name','Email','Role','Manager Approver','Actions'].map(h => <th key={h} className="text-left px-6 py-3 font-medium text-gray-600">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium">{u.name}</td>
                      <td className="px-6 py-3 text-gray-500">{u.email}</td>
                      <td className="px-6 py-3"><span className="capitalize px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{u.role}</span></td>
                      <td className="px-6 py-3">{u.is_manager_approver ? '✅' : '—'}</td>
                      <td className="px-6 py-3">
                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'approvals' ? (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Pending', value: pendingApprovals.length, color: 'text-yellow-600 bg-yellow-50', icon: Clock },
                { label: 'Approved By You', value: approvalSummary.approved, color: 'text-green-600 bg-green-50', icon: CheckCircle },
                { label: 'Rejected By You', value: approvalSummary.rejected, color: 'text-red-600 bg-red-50', icon: XCircle },
              ].map(s => (
                <div key={s.label} className="card flex items-center gap-3 p-4">
                  <div className={`p-2 rounded-lg ${s.color}`}><s.icon size={20} /></div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="card text-center py-12 text-gray-400">
                <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
                <p>No pending approvals.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map(req => (
                  <div key={req.request_id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{req.expense_title}</h3>
                        <p className="text-sm text-gray-500">By {req.employee_name} â€¢ {req.category}</p>
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
                        value={approvalComment[req.request_id] || ''}
                        onChange={e => setApprovalComment({ ...approvalComment, [req.request_id]: e.target.value })}
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
            )}
          </div>
        ) : activeTab === 'rules' ? (
          <div>
            <div className="flex justify-end mb-3">
              <button onClick={() => setShowRuleForm(!showRuleForm)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={16} /> Add Rule
              </button>
            </div>
            {showRuleForm && (
              <div className="card mb-4">
                <h3 className="font-semibold text-gray-800 mb-4">Create Approval Rule</h3>
                <form onSubmit={handleCreateRule} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="label">Rule Name</label><input className="input" required value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })} placeholder="e.g. Standard Approval" /></div>
                    <div><label className="label">Min Approval %</label><input className="input" type="number" min="1" max="100" value={ruleForm.min_approval_percentage} onChange={e => setRuleForm({ ...ruleForm, min_approval_percentage: parseFloat(e.target.value) })} /></div>
                  </div>
                  <div><label className="label">Description</label><input className="input" value={ruleForm.description} onChange={e => setRuleForm({ ...ruleForm, description: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="label">Min Amount (company currency)</label><input className="input" type="number" step="0.01" value={ruleForm.min_amount} onChange={e => setRuleForm({ ...ruleForm, min_amount: e.target.value })} placeholder="Optional" /></div>
                    <div><label className="label">Max Amount (company currency)</label><input className="input" type="number" step="0.01" value={ruleForm.max_amount} onChange={e => setRuleForm({ ...ruleForm, max_amount: e.target.value })} placeholder="Optional" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1"><label className="label">Category</label><input className="input" value={ruleForm.category} onChange={e => setRuleForm({ ...ruleForm, category: e.target.value })} placeholder="Optional (e.g. Travel)" /></div>
                    <div className="col-span-1">
                      <label className="label">Employee Role</label>
                      <select className="input" value={ruleForm.employee_role} onChange={e => setRuleForm({ ...ruleForm, employee_role: e.target.value })}>
                        <option value="">Any</option>
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="col-span-1"><label className="label">Priority</label><input className="input" type="number" value={ruleForm.priority} onChange={e => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value || '0') })} /></div>
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={ruleForm.is_auto_approve} onChange={e => setRuleForm({ ...ruleForm, is_auto_approve: e.target.checked })} className="rounded" />
                      Auto-approve (no approvers)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={ruleForm.is_manager_approver} onChange={e => setRuleForm({ ...ruleForm, is_manager_approver: e.target.checked })} className="rounded" />
                      Manager approves first
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={ruleForm.use_sequence} onChange={e => setRuleForm({ ...ruleForm, use_sequence: e.target.checked })} className="rounded" />
                      Use sequential approval
                    </label>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label mb-0">Approvers</label>
                      <button type="button" disabled={ruleForm.is_auto_approve} onClick={addApproverLine} className="text-indigo-600 text-sm hover:underline disabled:opacity-50">+ Add approver</button>
                    </div>
                    {ruleForm.approver_lines.map((line, idx) => (
                      <div key={idx} className="flex gap-3 mb-2 items-center">
                        <span className="text-sm text-gray-500 w-6">{idx + 1}.</span>
                        <select className="input flex-1" required={!ruleForm.is_auto_approve} disabled={ruleForm.is_auto_approve} value={line.approver_id} onChange={e => updateApproverLine(idx, 'approver_id', e.target.value)}>
                          <option value="">Select approver...</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                        </select>
                        <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                          <input type="checkbox" disabled={ruleForm.is_auto_approve} checked={line.is_key_approver} onChange={e => updateApproverLine(idx, 'is_key_approver', e.target.checked)} />
                          Key approver
                        </label>
                        <button type="button" onClick={() => setRuleForm({ ...ruleForm, approver_lines: ruleForm.approver_lines.filter((_, i) => i !== idx) })} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary text-sm">Create Rule</button>
                    <button type="button" onClick={() => setShowRuleForm(false)} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </form>
              </div>
            )}
            <div className="space-y-3">
              {rules.length === 0 ? (
                <div className="card text-center py-12 text-gray-400">No approval rules yet. Create one!</div>
              ) : rules.map(rule => (
                <div key={rule.id} className="card flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                    <p className="text-sm text-gray-500">{rule.description}</p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                      <span>Min approval: {rule.min_approval_percentage}%</span>
                      {rule.is_auto_approve && <span className="text-indigo-600">• Auto-approve</span>}
                      {(rule.min_amount != null || rule.max_amount != null) && (
                        <span>• Amount: {rule.min_amount ?? '-'} to {rule.max_amount ?? '-'}</span>
                      )}
                      {rule.category && <span>• Category: {rule.category}</span>}
                      {rule.employee_role && <span>• Role: {rule.employee_role}</span>}
                      {rule.priority != null && <span>• Priority: {rule.priority}</span>}
                      {rule.is_manager_approver && <span className="text-indigo-600">• Manager first</span>}
                      {rule.use_sequence && <span className="text-green-600">• Sequential</span>}
                    </div>
                  </div>
                  <button onClick={() => { if(confirm('Delete rule?')) deleteApprovalRule(rule.id).then(load) }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Title','Employee','Category','Amount','Status'].map(h => <th key={h} className="text-left px-6 py-3 font-medium text-gray-600">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{e.title}</td>
                    <td className="px-6 py-3 text-gray-500">ID: {e.employee_id}</td>
                    <td className="px-6 py-3 text-gray-500">{e.category}</td>
                    <td className="px-6 py-3 font-medium">{e.amount_in_company_currency?.toFixed(2)}</td>
                    <td className="px-6 py-3"><StatusBadge state={e.state} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
