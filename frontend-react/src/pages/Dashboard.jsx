import React from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  return (
    <div>
      <h2 className="h3 mb-3">Dashboard</h2>
      <div className="card">
        <div className="card-body">
          <p>Welcome, <strong>{user?.username}</strong>!</p>
          <p>This is a minimal React dashboard. You can extend it with your investments, income, expenses pages next.</p>
        </div>
      </div>
    </div>
  )
}

