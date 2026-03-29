import api from './axios'

// Auth
export const signup = (data) => api.post('/api/auth/signup', data)
export const login = (data) => api.post('/api/auth/login', data)
export const getCountries = () => api.get('/api/auth/countries')
export const getMe = () => api.get('/api/auth/me')

// Users
export const getUsers = () => api.get('/api/users/')
export const createUser = (data) => api.post('/api/users/', data)
export const updateUser = (id, data) => api.put(`/api/users/${id}`, data)
export const deleteUser = (id) => api.delete(`/api/users/${id}`)
export const getManagers = () => api.get('/api/users/managers')

// Expenses
export const getExpenses = () => api.get('/api/expenses/')
export const createExpense = (data) => api.post('/api/expenses/', data)
export const submitExpense = (id) => api.post(`/api/expenses/${id}/submit`)
export const getExpense = (id) => api.get(`/api/expenses/${id}`)
export const getExpenseApprovals = (id) => api.get(`/api/expenses/${id}/approvals`)
export const getCategories = () => api.get('/api/expenses/categories/list')
export const scanReceipt = (formData) => api.post('/api/expenses/ocr/scan', formData)

// Approvals
export const getPendingApprovals = () => api.get('/api/approvals/pending')
export const getApprovalSummary = () => api.get('/api/approvals/summary')
export const approveRequest = (id, comment) => api.post(`/api/approvals/${id}/approve`, { comment })
export const rejectRequest = (id, comment) => api.post(`/api/approvals/${id}/reject`, { comment })
export const getApprovalRules = () => api.get('/api/approvals/rules')
export const createApprovalRule = (data) => api.post('/api/approvals/rules', data)
export const getApprovalRule = (id) => api.get(`/api/approvals/rules/${id}`)
export const deleteApprovalRule = (id) => api.delete(`/api/approvals/rules/${id}`)
