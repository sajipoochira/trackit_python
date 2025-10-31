import React from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { formatCurrency } from '../utils/format.js'
import { convert as convertFx } from '../ratesStore.js'

function useAsync(fn, deps){
  const [state, setState] = React.useState({ loading: true, error: '', data: null })
  React.useEffect(()=>{
    let ok = true
    setState({ loading: true, error: '', data: null })
    fn().then(d=>{ if (ok) setState({ loading: false, error: '', data: d }) })
      .catch(e=>{ if (ok) setState({ loading: false, error: e?.message || 'Failed', data: null }) })
    return ()=>{ ok = false }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  return state
}

function normalizeList(res) { return Array.isArray(res) ? res : (res?.results || []) }

function parseChargesFromNotes(notes){
  if (!notes) return 0; const m = String(notes).match(/Charges:\s*([0-9]+(?:\.[0-9]+)?)/i); if (!m) return 0; const n = Number(m[1]); return Number.isFinite(n) ? n : 0
}
function parseQtyFromNotes(notes){
  if (!notes) return 0; const m = String(notes).match(/Qty:\s*([0-9]+(?:\.[0-9]+)?)/i); if (!m) return 0; const n = Number(m[1]); return Number.isFinite(n) ? n : 0
}

function computeHoldingsFor(category, inc, exp, inv, pref='INR'){
  const convertAmt = (amt, cur) => {
    const n = Number(amt) || 0; if (!cur || cur === pref) return n; const v = convertFx(n, cur, pref); return Number.isFinite(v) ? v : n
  }
  const lc = category.toLowerCase()
  const buysTitle = `${category} Buy`.toLowerCase()
  const sellsTitle = `${category} Sell`.toLowerCase()
  const holdings = new Map()
  const addBuy = (name, qty, unit, charges, currency) => {
    const q = Number(qty) || 0; const u = Number(unit) || 0; const ch = Number(charges) || 0
    const total = q * u + ch; const cur = holdings.get(name) || { qty: 0, cost: 0 }
    cur.qty += q; cur.cost += convertAmt(total, currency); holdings.set(name, cur)
  }
  const addSell = (name, q) => {
    const cur = holdings.get(name) || { qty: 0, cost: 0 }
    if (cur.qty <= 0 || q <= 0) { holdings.set(name, cur); return }
    const avg = cur.qty > 0 ? (cur.cost / cur.qty) : 0
    const reduceQty = Math.min(cur.qty, q); cur.qty -= reduceQty; cur.cost -= avg * reduceQty; holdings.set(name, cur)
  }
  inv.filter(x => (String(x.category || '')).toLowerCase() === lc).forEach(x => {
    addBuy(x.name || category.toUpperCase(), x.quantity, x.buy_price, parseChargesFromNotes(x.notes), x.currency)
  })
  exp.filter(x => (x.title || '').toLowerCase().startsWith(buysTitle)).forEach(x => {
    const t = String(x.title || ''); const m = t.match(new RegExp(`${category} buy\\s+(.+)`, 'i'))
    const name = (m ? m[1] : category).toUpperCase()
    const qty = parseQtyFromNotes(x.notes)
    let unit = 0; const m2 = String(x.notes || '').match(/@\s*([0-9]+(?:\.[0-9]+)?)/); if (m2) { const n = Number(m2[1]); if (Number.isFinite(n)) unit = n }
    const ch = parseChargesFromNotes(x.notes)
    addBuy(name, qty, unit, ch, x.currency)
  })
  inc.filter(x => (x.title || '').toLowerCase().startsWith(sellsTitle)).forEach(x => {
    const t = String(x.title || ''); const m = t.match(new RegExp(`${category} sell\\s+(.+)`, 'i'))
    const name = (m ? m[1] : category).toUpperCase(); const qty = parseQtyFromNotes(x.notes); addSell(name, qty)
  })
  const rows = Array.from(holdings.entries()).map(([name, v]) => ({ name, qty: Math.max(0, Number(v.qty)||0), cost: Math.max(0, Number(v.cost)||0) }))
  const totalCost = rows.reduce((s, r) => s + r.cost, 0)
  return { rows, totalCost, currency: pref }
}

export default function Investments(){
  const pref = 'INR'
  const fetchAll = React.useCallback(async ()=>{
    const [incomes, expenses, investments] = await Promise.all([
      api.getIncomes(), api.getExpenses(), api.getInvestments()
    ])
    const inc = normalizeList(incomes), exp = normalizeList(expenses), inv = normalizeList(investments)
    return {
      stocks: computeHoldingsFor('Stocks', inc, exp, inv, pref),
      gold: computeHoldingsFor('Gold', inc, exp, inv, pref),
      business: computeHoldingsFor('Business', inc, exp, inv, pref),
    }
  }, [])
  const { loading, error, data } = useAsync(fetchAll, [])

  return (
    <div>
      <h2 className="h4 mb-3">Investments</h2>
      {loading && <div className="text-muted">Loading…</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {data && (
        <div className="row g-3">
          <SummaryCard title="Stocks" total={data.stocks.totalCost} currency={data.stocks.currency} to="/stocks" />
          <SummaryCard title="Gold" total={data.gold.totalCost} currency={data.gold.currency} to="/gold" />
          <SummaryCard title="Business" total={data.business.totalCost} currency={data.business.currency} to="/business" />
        </div>
      )}
    </div>
  )
}

function SummaryCard({ title, total, currency, to }){
  return (
    <div className="col-md-4">
      <div className="card h-100">
        <div className="card-body d-flex flex-column">
          <h5 className="card-title">{title}</h5>
          <div className="mt-auto">
            <div className="text-muted small">Total Cost</div>
            <div className="fs-5 fw-semibold">{formatCurrency(total || 0, currency || 'INR')}</div>
          </div>
        </div>
        <div className="card-footer text-end">
          <Link className="btn btn-sm btn-primary" to={to}>Open</Link>
        </div>
      </div>
    </div>
  )
}

