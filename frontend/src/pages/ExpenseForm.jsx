import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { createExpense, submitExpense, getCategories, scanReceipt } from '../api'
import { getCountries } from '../api'
import toast from 'react-hot-toast'
import { Upload, ScanLine, ArrowLeft, Send } from 'lucide-react'

export default function ExpenseForm() {
  const navigate = useNavigate()
  const fileRef = useRef()
  const [form, setForm] = useState({ title: '', description: '', amount: '', currency_code: 'USD', category: '', expense_date: new Date().toISOString().split('T')[0], vendor_name: '' })
  const [categories, setCategories] = useState([])
  const [currencies, setCurrencies] = useState([])
  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getCategories(), getCountries()]).then(([cRes, curRes]) => {
      setCategories(cRes.data)
      const uniqueCurrencies = [...new Map(curRes.data.map(c => [c.currency_code, c])).values()]
      setCurrencies(uniqueCurrencies)
    })
  }, [])

  const handleScan = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setScanning(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await scanReceipt(formData)
      const data = res?.data || {}
      setForm(prev => ({
        ...prev,
        title: (typeof data.title === 'string' && data.title.trim()) ? data.title : prev.title,
        amount: (typeof data.amount === 'number' && data.amount > 0) ? String(data.amount) : prev.amount,
        currency_code: (typeof data.currency_code === 'string' && data.currency_code.trim()) ? data.currency_code : prev.currency_code,
        category: (typeof data.category === 'string' && data.category.trim()) ? data.category : prev.category,
        expense_date: (typeof data.expense_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.expense_date)) ? data.expense_date : prev.expense_date,
        vendor_name: (typeof data.vendor_name === 'string' && data.vendor_name.trim()) ? data.vendor_name : prev.vendor_name,
        description: (typeof data.description === 'string' && data.description.trim()) ? data.description : prev.description,
      }))
      toast.success('Receipt scanned! Fields auto-filled.')
    } catch { toast.error('OCR scan failed') }
    finally { setScanning(false) }
  }

  const handleSubmit = async (e, andSubmit = false) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        ...form,
        amount: parseFloat(form.amount),
        expense_date: new Date(form.expense_date).toISOString()
      }
      const res = await createExpense(data)
      const expenseId = res.data.id
      if (andSubmit) {
        await submitExpense(expenseId)
        toast.success('Expense submitted for approval!')
      } else {
        toast.success('Expense saved as draft!')
      }
      navigate('/employee')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">New Expense</h1>
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleScan} className="hidden" />
              <button type="button" onClick={() => fileRef.current.click()} disabled={scanning}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50">
                {scanning ? <><div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" /> Scanning...</>
                  : <><ScanLine size={16} /> Scan Receipt (OCR)</>}
              </button>
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center gap-2 mb-6">
            {['Draft', 'Waiting Approval', 'Approved'].map((step, i) => (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div className={`flex-1 h-1.5 rounded-full ${i === 0 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                <span className={`text-xs whitespace-nowrap ${i === 0 ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>{step}</span>
              </div>
            ))}
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input className="input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Team lunch at Taj Hotel" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Amount *</label>
                <input className="input" type="number" step="0.01" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <label className="label">Currency</label>
                <select className="input" value={form.currency_code} onChange={e => setForm({ ...form, currency_code: e.target.value })}>
                  {currencies.map(c => <option key={c.currency_code} value={c.currency_code}>{c.currency_code} - {c.currency_name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category *</label>
                <select className="input" required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date *</label>
                <input className="input" type="date" required value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Vendor / Merchant Name</label>
              <input className="input" value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} placeholder="e.g. Taj Hotel, Uber, Amazon" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Additional details about this expense..." />
            </div>
            <div>
              <label className="label">Approval Rule</label>
              <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                Applied automatically by the system based on amount/category.
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-secondary flex items-center gap-2 text-sm">
                <Upload size={16} /> Save as Draft
              </button>
              <button type="button" disabled={saving} onClick={(e) => handleSubmit(e, true)} className="btn-primary flex items-center gap-2 text-sm">
                <Send size={16} /> Save & Submit for Approval
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
