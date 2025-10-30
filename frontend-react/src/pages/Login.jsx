import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username, password)
    } catch (e) {
      setError(e?.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="card shadow-lg border-0">
              <div className="card-header"><strong>Sign In</strong></div>
              <div className="card-body p-4">
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={onSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input className="form-control" value={username} onChange={e=>setUsername(e.target.value)} required />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Password</label>
                    <input type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} required />
                  </div>
                  <button className="btn btn-primary w-100" disabled={submitting}>
                    {submitting ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

