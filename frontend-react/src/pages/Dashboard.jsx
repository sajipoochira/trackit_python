import React from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api'
import { convert as convertFx } from '../ratesStore.js'
import { formatCurrency } from '../utils/format.js'

function useAsync(fn, deps) {
  const [state, setState] = React.useState({ loading: true, error: '', data: null })
  React.useEffect(() => {
    let ok = true
    setState({ loading: true, error: '', data: null })
    fn().then((data) => { if (ok) setState({ loading: false, error: '', data }) })
      .catch((e) => { if (ok) setState({ loading: false, error: e?.message || 'Failed', data: null }) })
    return () => { ok = false }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  return state
}

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h2 className="h3 mb-3">Dashboard</h2>
      <div className="mb-3">Welcome, <strong>{user?.username}</strong></div>
      <HoldingsPieSection />
    </div>
  )
}

function HoldingsPieSection() {
  const pref = 'INR'
  const fetchHoldings = React.useCallback(async () => {
    const [incomes, expenses, investments] = await Promise.all([
      api.getIncomes(),
      api.getExpenses(),
      api.getInvestments(),
    ])
    const inc = Array.isArray(incomes) ? incomes : (incomes?.results || [])
    const exp = Array.isArray(expenses) ? expenses : (expenses?.results || [])
    const inv = Array.isArray(investments) ? investments : (investments?.results || [])

    const holdings = new Map() // symbol -> { name, qty, cost }

    const parseChargesFromNotes = (notes) => {
      if (!notes) return 0
      const m = String(notes).match(/Charges:\s*([0-9]+(?:\.[0-9]+)?)/i)
      if (!m) return 0
      const n = Number(m[1]); return Number.isFinite(n) ? n : 0
    }
    const parseQtyFromNotes = (notes) => {
      if (!notes) return 0
      const m = String(notes).match(/Qty:\s*([0-9]+(?:\.[0-9]+)?)/i)
      if (!m) return 0
      const n = Number(m[1]); return Number.isFinite(n) ? n : 0
    }

    const addBuy = (symbol, name, qty, unitPrice, charges, currency) => {
      const q = Number(qty) || 0
      const price = Number(unitPrice) || 0
      const ch = Number(charges) || 0
      if (q <= 0) return
      const total = q * price + ch
      const totalPref = (currency && currency !== pref) ? (convertFx(total, currency, pref) || total) : total
      const cur = holdings.get(symbol) || { name: name || symbol, qty: 0, cost: 0 }
      cur.qty += q
      cur.cost += totalPref
      if (!cur.name && name) cur.name = name
      holdings.set(symbol, cur)
    }

    const addSell = (symbol, qty) => {
      const q = Number(qty) || 0
      if (q <= 0) return
      const cur = holdings.get(symbol) || { name: symbol, qty: 0, cost: 0 }
      if (cur.qty <= 0) { holdings.set(symbol, cur); return }
      const avg = cur.qty > 0 ? (cur.cost / cur.qty) : 0
      const reduceQty = Math.min(cur.qty, q)
      cur.qty -= reduceQty
      cur.cost -= avg * reduceQty
      holdings.set(symbol, cur)
    }

    // From Investments (category Stocks)
    inv.filter(x => (String(x.category || '')).toLowerCase() === 'stocks').forEach(x => {
      addBuy(x.symbol || x.name || 'UNKNOWN', x.name || x.symbol || 'UNKNOWN', x.quantity, x.buy_price, parseChargesFromNotes(x.notes), x.currency)
    })

    // Expenses titled "Stock Buy <SYMBOL>"
    exp.filter(x => (x.title || '').toLowerCase().startsWith('stock buy')).forEach(x => {
      const t = String(x.title || '')
      const m = t.match(/stock buy\s+(\S+)/i)
      const symbol = m ? m[1] : 'UNKNOWN'
      const qty = parseQtyFromNotes(x.notes)
      let unit = 0
      const m2 = String(x.notes || '').match(/@\s*([0-9]+(?:\.[0-9]+)?)/)
      if (m2) { const n = Number(m2[1]); if (Number.isFinite(n)) unit = n }
      const ch = parseChargesFromNotes(x.notes)
      addBuy(symbol, symbol, qty, unit, ch, x.currency)
    })

    // Income titled "Stock Sell <SYMBOL>"
    inc.filter(x => (x.title || '').toLowerCase().startsWith('stock sell')).forEach(x => {
      const t = String(x.title || '')
      const m = t.match(/stock sell\s+(\S+)/i)
      const symbol = m ? m[1] : 'UNKNOWN'
      const qty = parseQtyFromNotes(x.notes)
      addSell(symbol, qty)
    })

    const rows = Array.from(holdings.entries()).map(([symbol, v]) => {
      const qty = Math.max(0, Number(v.qty) || 0)
      const cost = qty > 0 ? Math.max(0, Number(v.cost) || 0) : 0
      return { symbol, name: v.name || symbol, qty, cost }
    }).filter(r => r.qty > 0).sort((a,b)=> a.symbol.localeCompare(b.symbol))

    return rows
  }, [])

  const { loading, error, data: rows } = useAsync(fetchHoldings, [])
  const [quotes, setQuotes] = React.useState({})
  const [qLoading, setQLoading] = React.useState(false)

  React.useEffect(() => {
    let ok = true
    const loadQuotes = async () => {
      if (!rows || rows.length === 0) { setQuotes({}); return }
      const syms = Array.from(new Set(rows.map(r => (r.symbol || '').toUpperCase()).filter(Boolean)))
      setQLoading(true)
      try {
        const results = await Promise.all(syms.map(s => api.getLatestQuote(s).catch(() => null)))
        const q = {}
        results.forEach((res, idx) => { if (res && syms[idx]) q[syms[idx]] = res.currentPrice || {} })
        if (ok) setQuotes(q)
      } finally { if (ok) setQLoading(false) }
    }
    loadQuotes()
    return () => { ok = false }
  }, [rows])

  const refreshNow = async () => {
    if (!rows || rows.length === 0) return
    const syms = Array.from(new Set(rows.map(r => (r.symbol || '').toUpperCase()).filter(Boolean)))
    setQLoading(true)
    try {
      await Promise.all(syms.map(s => api.getLtp(s).catch(() => null)))
      const results = await Promise.all(syms.map(s => api.getLatestQuote(s).catch(() => null)))
      const q = {}
      results.forEach((res, idx) => { if (res && syms[idx]) q[syms[idx]] = res.currentPrice || {} })
      setQuotes(q)
    } finally { setQLoading(false) }
  }

  const items = React.useMemo(() => {
    if (!rows) return []
    return rows.map(r => {
      const sym = String(r.symbol || '').toUpperCase()
      const qp = quotes[sym]
      const p = qp ? Number(qp.NSE || qp.BSE) : NaN
      const qty = Number(r.qty) || 0
      const current = (Number.isFinite(p) ? p : 0) * qty
      return { symbol: sym, name: r.name || sym, cost: r.cost || 0, current }
    })
  }, [rows, quotes])

  const totalCost = items.reduce((s, x) => s + x.cost, 0)
  const totalCurrent = items.reduce((s, x) => s + x.current, 0)

  return (
    <div className="card">
      <div className="card-header d-flex align-items-center justify-content-between">
        <strong>Stock Holdings Breakdown</strong>
        <button className="btn btn-sm btn-outline-primary" onClick={refreshNow} disabled={qLoading || loading}>
          {qLoading ? 'Refreshing…' : 'Refresh Prices'}
        </button>
      </div>
      <div className="card-body">
        {loading && <div className="text-muted">Loading holdings…</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        {!loading && items.length === 0 && (<div className="text-muted">No stock holdings</div>)}
        {items.length > 0 && (
          <div className="row g-4 align-items-center">
            <div className="col-md-6">
              <h6 className="mb-2">By Current Value (INR)</h6>
              <PieChart data={items.map(x => ({ key: x.symbol, value: x.current }))} />
              <div className="small text-muted mt-2">Total: {formatCurrency(totalCurrent, 'INR')}</div>
            </div>
            <div className="col-md-6">
              <h6 className="mb-2">By Cost (INR)</h6>
              <PieChart data={items.map(x => ({ key: x.symbol, value: x.cost }))} />
              <div className="small text-muted mt-2">Total: {formatCurrency(totalCost, 'INR')}</div>
            </div>
            <div className="col-md-6">
              <h6 className="mb-2">Bar Chart — Current Value</h6>
              <BarChart data={items.map(x => ({ key: x.symbol, value: x.current }))} unit="INR" />
            </div>
            <div className="col-md-6">
              <h6 className="mb-2">Bar Chart — Cost</h6>
              <BarChart data={items.map(x => ({ key: x.symbol, value: x.cost }))} unit="INR" />
            </div>
            <div className="col-12">
              <Legend data={items} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#22c55e', '#e11d48', '#0ea5e9'
]

function PieChart({ data = [], size = 160, stroke = 18 }) {
  const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size/2}, ${size/2}) rotate(-90)`}>
        {total <= 0 && (
          <circle r={r} cx={0} cy={0} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        )}
        {total > 0 && data.map((d, i) => {
          const val = Math.max(0, Number(d.value) || 0)
          const frac = val / total
          const dash = frac * c
          const dasharray = `${dash} ${c - dash}`
          const el = (
            <circle key={d.key || i}
              r={r} cx={0} cy={0} fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={stroke}
              strokeDasharray={dasharray}
              strokeDashoffset={-acc}
            />
          )
          acc += dash
          return el
        })}
      </g>
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fill="#6b7280">
        {total > 0 ? '100%' : 'No Data'}
      </text>
    </svg>
  )
}

function BarChart({ data = [], unit = 'INR', height = 180 }) {
  const items = data.map(d => ({ key: d.key, value: Number(d.value) || 0 }))
  const max = items.reduce((m, d) => Math.max(m, d.value), 0)
  const sorted = items.sort((a, b) => b.value - a.value)
  return (
    <div style={{ width: '100%', minHeight: height }}>
      {sorted.length === 0 && (
        <div className="text-muted">No data</div>
      )}
      {sorted.map((d, i) => {
        const pct = max > 0 ? (d.value / max) * 100 : 0
        return (
          <div key={d.key || i} className="mb-2">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <div className="d-flex align-items-center gap-2">
                <span style={{ display: 'inline-block', width: 10, height: 10, background: COLORS[i % COLORS.length] }} />
                <span className="small fw-semibold">{d.key}</span>
              </div>
              <div className="small text-muted">{formatCurrency(d.value, unit)}</div>
            </div>
            <div style={{ background: '#e5e7eb', height: 10, borderRadius: 6 }}>
              <div style={{ width: pct + '%', height: 10, background: COLORS[i % COLORS.length], borderRadius: 6 }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Legend({ data = [] }) {
  const totalCost = data.reduce((s, x) => s + (Number(x.cost) || 0), 0)
  const totalCurr = data.reduce((s, x) => s + (Number(x.current) || 0), 0)
  return (
    <div className="table-responsive">
      <table className="table table-sm align-middle">
        <thead>
          <tr>
            <th></th>
            <th>Symbol</th>
            <th className="text-end">Cost %</th>
            <th className="text-end">Current %</th>
            <th className="text-end">Cost (INR)</th>
            <th className="text-end">Current (INR)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((x, i) => {
            const costPct = totalCost > 0 ? (x.cost / totalCost) * 100 : 0
            const currPct = totalCurr > 0 ? (x.current / totalCurr) * 100 : 0
            return (
              <tr key={x.symbol || i}>
                <td><span style={{ display: 'inline-block', width: 12, height: 12, background: COLORS[i % COLORS.length] }} /></td>
                <td>{x.symbol}</td>
                <td className="text-end">{costPct.toFixed(1)}%</td>
                <td className="text-end">{currPct.toFixed(1)}%</td>
                <td className="text-end">{formatCurrency(x.cost, 'INR')}</td>
                <td className="text-end">{formatCurrency(x.current, 'INR')}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
