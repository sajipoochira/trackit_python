import React from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Investments from './pages/Investments.jsx'
import Income from './pages/Income.jsx'
import Expenses from './pages/Expenses.jsx'
import Assets from './pages/Assets.jsx'
import Liabilities from './pages/Liabilities.jsx'
import BulkImport from './pages/BulkImport.jsx'
import StockInvestments from './pages/StockInvestments.jsx'
import NavBar from './components/NavBar.jsx'
import ContextActions from './components/ContextActions.jsx'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{minHeight: '40vh'}}>
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

function AppShell() {
  const { isAuthenticated } = useAuth()
  return (
    <div>
      {isAuthenticated && <NavBar />}
      <div className="container py-4">
        {isAuthenticated && <ContextActions />}
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/investments" element={<ProtectedRoute><Investments /></ProtectedRoute>} />
          <Route path="/income" element={<ProtectedRoute><Income /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
          <Route path="/liabilities" element={<ProtectedRoute><Liabilities /></ProtectedRoute>} />
          <Route path="/stocks" element={<ProtectedRoute><StockInvestments /></ProtectedRoute>} />
          <Route path="/bulk" element={<ProtectedRoute><BulkImport /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
        </Routes>
      </div>
    </div>
  )
}
