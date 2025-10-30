import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getPreferredCurrency, setPreferredCurrency, subscribe } from '../ratesStore.js'

export default function NavBar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const isActive = (p) => pathname === p ? 'nav-link active' : 'nav-link'
  const [pref, setPref] = React.useState(getPreferredCurrency())
  React.useEffect(() => {
    return subscribe(() => setPref(getPreferredCurrency()))
  }, [])

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">TrackIt</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item"><Link className={isActive('/')} to="/">Dashboard</Link></li>
            <li className="nav-item"><Link className={isActive('/investments')} to="/investments">Investments</Link></li>
            <li className="nav-item"><Link className={isActive('/stocks')} to="/stocks">Stocks</Link></li>
            <li className="nav-item"><Link className={isActive('/income')} to="/income">Income</Link></li>
            <li className="nav-item"><Link className={isActive('/expenses')} to="/expenses">Expenses</Link></li>
            <li className="nav-item"><Link className={isActive('/assets')} to="/assets">Assets</Link></li>
            <li className="nav-item"><Link className={isActive('/liabilities')} to="/liabilities">Liabilities</Link></li>
            <li className="nav-item"><Link className={isActive('/bulk')} to="/bulk">Bulk Import</Link></li>
          </ul>
          <div className="navbar-text me-3">
            <small className="me-2">Signed in as {user?.username}</small>
            <select className="form-select form-select-sm d-inline-block" style={{ width: 120 }} value={pref}
              onChange={(e)=>setPreferredCurrency(e.target.value)}>
              <option value="QAR">Display in QAR</option>
              <option value="INR">Display in INR</option>
            </select>
          </div>
          <button className="btn btn-outline-light btn-sm" onClick={logout}>Logout</button>
        </div>
      </div>
    </nav>
  )
}
