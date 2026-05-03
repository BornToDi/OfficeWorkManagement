import React, { useState } from 'react'

function Icon({ name, className = '' }){
  if (name === 'user') return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25c0-3.037 3.582-5.25 7.5-5.25s7.5 2.213 7.5 5.25" />
    </svg>
  )
  if (name === 'mail') return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 8.25v7.5a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 15.75v-7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.125l8.25 5.25a2.25 2.25 0 002.25 0L21 7.125" />
    </svg>
  )
  return null
}

export default function AuthForm({ mode = 'login', onSubmit }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [userRole, setUserRole] = useState('EMPLOYEE')

  function validate(){
    const e = {}
    if (mode === 'register' && !name.trim()) e.name = 'Name is required'
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'Password must be at least 8 characters'
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setLoading(true)
    try {
      if (mode === 'login') await onSubmit(email, password)
      else await onSubmit(name, email, password, userRole)
    } catch (err) {
      setError(err.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded shadow">
      {mode === 'register' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="name">Name</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Icon name="user" className="w-5 h-5" />
            </div>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} className={`input pl-10`} aria-invalid={fieldErrors.name ? 'true' : 'false'} autoComplete="name" />
          </div>
          {fieldErrors.name && <div className="text-red-600 text-sm mt-1">{fieldErrors.name}</div>}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" htmlFor="userRole">Role</label>
                  <select id="userRole" value={userRole} onChange={(e) => setUserRole(e.target.value)} className="w-full border rounded px-3 py-2">
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGEMENT">Management</option>
                  </select>
                </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon name="mail" className="w-5 h-5" />
          </div>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`input pl-10`} aria-invalid={fieldErrors.email ? 'true' : 'false'} autoComplete="email" />
        </div>
        {fieldErrors.email && <div className="text-red-600 text-sm mt-1">{fieldErrors.email}</div>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {/* empty to keep spacing; could add a lock icon */}
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0-10v2m-6 6h12"/></svg>
          </div>
          <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={`input pl-10 pr-14`} aria-invalid={fieldErrors.password ? 'true' : 'false'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800">{showPassword ? 'Hide' : 'Show'}</button>
        </div>
        {fieldErrors.password && <div className="text-red-600 text-sm mt-1">{fieldErrors.password}</div>}
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}
      <button disabled={loading} className={`btn w-full ${loading ? 'opacity-70' : ''}`}>
        {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
      </button>
    </form>
  )
}
