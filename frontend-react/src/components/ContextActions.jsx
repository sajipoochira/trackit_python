import React from 'react'
import { useLocation, Link } from 'react-router-dom'

const map = {
  '/investments': 'investments',
  '/income': 'income',
  '/expenses': 'expenses',
  '/assets': 'assets',
  '/liabilities': 'liabilities',
}

export default function ContextActions(){
  const { pathname } = useLocation()
  const key = map[pathname]
  if (!key) return null
  const href = `/bulk?resource=${encodeURIComponent(key)}`
  return (
    <div className="d-flex justify-content-end mb-3">
      <Link to={href} className="btn btn-outline-secondary btn-sm">Bulk Add</Link>
    </div>
  )
}

