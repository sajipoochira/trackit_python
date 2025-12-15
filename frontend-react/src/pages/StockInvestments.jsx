import React from 'react'
import { api } from '../api'
import { formatCurrency, formatNumber } from '../utils/format.js'
import { convert as convertFx } from '../ratesStore.js'
import BulkCreateCard from '../components/BulkCreateCard.jsx'
import { parseCSV } from '../utils/csv.js'

export default function StockInvestments() {
  const [refreshKey, setRefreshKey] = React.useState(0)
  const onChanged = React.useCallback(() => setRefreshKey(x => x + 1), [])
  const [show, setShow] = React.useState({ transfers: false, buy: false, sell: false })

  const [incomes, setIncomes] = React.useState([])
  const [expenses, setExpenses] = React.useState([])
  const [investments, setInvestments] = React.useState([])
  const [dataLoading, setDataLoading] = React.useState(true)
  const [dataError, setDataError] = React.useState('')

  React.useEffect(() => {
    let ok = true
    const fetchAllPages = async (apiCall) => {
      let all = []
      let page = 1
      while (true) {
        // Use ?page=X query param. Assuming standard DRF pagination.
        // If not paginated, API ignores param and returns list/result, which we handle.
        const q = `?page=${page}`
        const res = await apiCall(q)
        const list = Array.isArray(res) ? res : (res?.results || [])
        all = all.concat(list)

        // Check if there is a next page
        // Standard DRF returns { count, next, previous, results }
        if (!res || !res.next) break
        page++
      }
      return all
    }

    const loadAll = async () => {
      setDataError(''); setDataLoading(true)
      try {
        const [inc, exp, inv] = await Promise.all([
          fetchAllPages((q) => api.getIncomes(q)),
          fetchAllPages((q) => api.getExpenses(q)),
          fetchAllPages((q) => api.getInvestments(q)),
        ])
        if (!ok) return
        setIncomes(inc)
        setExpenses(exp)
        setInvestments(inv)
      } catch (e) {
        if (ok) setDataError(e?.message || 'Failed to load data')
      } finally {
        if (ok) setDataLoading(false)
      }
    }
    loadAll()
    return () => { ok = false }
  }, [refreshKey])

  return (
    <div>
      <h2 className="h4 mb-3">Stock Investments</h2>
      {dataError && <div className="alert alert-danger">{dataError}</div>}
      <div className="mb-2">
        <button className="btn btn-sm btn-outline-primary" onClick={() => setRefreshKey(x => x + 1)} disabled={dataLoading}>
          {dataLoading ? 'Loading…' : 'Refresh Data'}
        </button>
      </div>
      <BrokerSummaryCard incomes={incomes} expenses={expenses} investments={investments} loading={dataLoading} />
      <StockPriceCard />
      <StockHoldingsCard incomes={incomes} expenses={expenses} investments={investments} loading={dataLoading} />

      <div className="d-flex gap-2 mb-3">
        <button className={`btn btn-outline-secondary btn-sm ${show.transfers ? 'active' : ''}`} onClick={() => setShow(s => ({ ...s, transfers: !s.transfers }))}>Broker Transfers</button>
        <button className={`btn btn-outline-secondary btn-sm ${show.buy ? 'active' : ''}`} onClick={() => setShow(s => ({ ...s, buy: !s.buy }))}>Buy Stocks</button>
        <button className={`btn btn-outline-secondary btn-sm ${show.sell ? 'active' : ''}`} onClick={() => setShow(s => ({ ...s, sell: !s.sell }))}>Sell Stocks</button>
      </div>

      {show.transfers && <BrokerTransfersCard onChanged={onChanged} onClose={() => setShow(s => ({ ...s, transfers: false }))} />}
      {show.buy && <BuyStockCard onChanged={onChanged} onClose={() => setShow(s => ({ ...s, buy: false }))} />}
      {show.sell && <SellStockCard onChanged={onChanged} onClose={() => setShow(s => ({ ...s, sell: false }))} />}
    </div>
  )
}

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

function normalizeList(res) { return Array.isArray(res) ? res : (res?.results || []) }

function parseChargesFromNotes(notes) {
  if (!notes) return 0
  const m = String(notes).match(/Charges:\s*([0-9]+(?:\.[0-9]+)?)/i)
  if (!m) return 0
  const n = Number(m[1]); return Number.isFinite(n) ? n : 0
}

function parseQtyFromNotes(notes) {
  if (!notes) return 0
  const m = String(notes).match(/Qty:\s*([0-9]+(?:\.[0-9]+)?)/i)
  if (!m) return 0
  const n = Number(m[1]); return Number.isFinite(n) ? n : 0
}

function triggerDownload(filename, content, mime = 'text/csv') {
  try {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (_) { }
}

function BrokerSummaryCard({ incomes = [], expenses = [], investments = [], loading = false }) {
  const pref = 'INR'
  const [manualTick, setManualTick] = React.useState(0)
  const data = React.useMemo(() => {
    const inc = normalizeList(incomes)
    const exp = normalizeList(expenses)
    const inv = normalizeList(investments)
    const convertAmt = (amt, cur) => {
      const n = Number(amt) || 0
      if (!cur || cur === pref) return n
      const v = convertFx(n, cur, pref)
      return Number.isFinite(v) ? v : n
    }
    const deposits = exp.filter(x => (x.title || '').toLowerCase() === 'broker deposit')
      .reduce((s, x) => s + convertAmt(x.amount, x.currency), 0)
    const withdrawals = inc.filter(x => (x.source || '').toLowerCase() === 'broker withdrawal')
      .reduce((s, x) => s + convertAmt(x.amount, x.currency), 0)
    const sellProceeds = inc.filter(x => (x.category || '').toLowerCase() === 'stocks')
      .reduce((s, x) => s + convertAmt(x.amount, x.currency), 0)
    const buyExpensesFallback = exp.filter(x => (x.category || '').toLowerCase() === 'stocks')
      .reduce((s, x) => s + convertAmt(x.amount, x.currency), 0)
    const stockInvestments = inv.filter(x => (String(x.category || '')).toLowerCase() === 'stocks')
    const buysFromInvestments = stockInvestments.reduce((s, x) => {
      const qty = Number(x.quantity) || 0
      const price = Number(x.buy_price) || 0
      const ch = parseChargesFromNotes(x.notes)
      const total = qty * price + ch
      return s + convertAmt(total, x.currency)
    }, 0)
    const totalBuys = buyExpensesFallback + buysFromInvestments
    const balance = deposits - withdrawals - totalBuys + sellProceeds
    return { deposits, withdrawals, totalBuys, sellProceeds, balance, pref }
  }, [incomes, expenses, investments, manualTick])

  return (
    <div className="card mb-3">
      <div className="card-header"><strong>Broker Cash Summary</strong></div>
      <div className="card-body">
        {loading && <div className="text-muted">Loading summary…</div>}
        {data && !loading && (
          <>
            <div className="row">
              <SummaryItem label="Deposits" value={data.deposits} currency={data.pref} />
              <SummaryItem label="Withdrawals" value={-data.withdrawals} currency={data.pref} negative />
              <SummaryItem label="Total Buys" value={-data.totalBuys} currency={data.pref} negative />
              <SummaryItem label="Sell Proceeds" value={data.sellProceeds} currency={data.pref} />
              <SummaryItem label="Broker Balance" value={data.balance} currency={data.pref} emphasize />
            </div>
            <div className="mt-2 text-end">
              <button className="btn btn-sm btn-outline-primary" onClick={() => setManualTick(t => t + 1)}>Refresh Summary</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SummaryItem({ label, value, currency = 'INR', negative, emphasize }) {
  const color = emphasize ? 'text-primary' : (negative ? 'text-danger' : 'text-success')
  return (
    <div className="col-md-2 col-6 mb-2">
      <div className="fw-semibold">{label}</div>
      <div className={color}>{formatCurrency(value, currency)}</div>
    </div>
  )
}

function StockHoldingsCard({ incomes = [], expenses = [], investments = [], loading = false }) {
  const pref = 'INR'
  const fetchAll = React.useCallback(async () => {
    const inc = normalizeList(incomes)
    const exp = normalizeList(expenses)
    const inv = normalizeList(investments)

    const holdings = new Map() // symbol -> { name, qty, cost }
    const breakdowns = new Map() // symbol -> [{ date, qty, unit, currency, charges, source }]

    const pushBreakdown = (symbol, entry) => {
      const key = (symbol || 'UNKNOWN').toUpperCase().replace(/\s+/g, '')
      if (!key) return
      const list = breakdowns.get(key) || []
      list.push(entry)
      breakdowns.set(key, list)
    }

    const addBuy = (symbol, name, qty, unitPrice, charges, currency, date, source) => {
      const sym = (symbol || 'UNKNOWN').toUpperCase().replace(/\s+/g, '')
      if (!sym) return
      const q = Number(qty) || 0
      const price = Number(unitPrice) || 0
      const ch = Number(charges) || 0
      if (q <= 0) return
      const total = q * price + ch
      const totalPref = (currency && currency !== pref) ? (convertFx(total, currency, pref) || total) : total
      const cur = holdings.get(sym) || { name: name || sym, qty: 0, cost: 0 }
      cur.qty += q
      cur.cost += totalPref
      if (!cur.name && name) cur.name = name
      holdings.set(sym, cur)
      pushBreakdown(sym, { date, qty: q, unit: price, currency, charges: ch, source })
    }

    const addSell = (symbol, qty) => {
      const sym = (symbol || 'UNKNOWN').toUpperCase().replace(/\s+/g, '')
      if (!sym) return
      const q = Number(qty) || 0
      if (q <= 0) return
      const cur = holdings.get(sym) || { name: sym, qty: 0, cost: 0 }
      if (cur.qty <= 0) { holdings.set(sym, cur); return }
      const avg = cur.qty > 0 ? (cur.cost / cur.qty) : 0
      const reduceQty = Math.min(cur.qty, q)
      cur.qty -= reduceQty
      cur.cost -= avg * reduceQty
      holdings.set(sym, cur)
      // Note: we don't push breakdown for sells currently, but could
    }

    // 1. Buys from Investments
    // Support both legacy (type='stock') and new (category='Stocks' + type='Stocks') schemas
    inv.forEach(x => {
      const cat = String(x.category || '').toLowerCase()
      const t = String(x.type || '').toLowerCase()
      const rawSymbol = (x.symbol || '').toUpperCase().trim()
      const nameCandidate = (x.name || '').toUpperCase().trim()
      const looksLikeSymbol = !!nameCandidate && !nameCandidate.includes(' ') && nameCandidate.length <= 12

      const isStock = (cat === 'stocks' || t === 'stock' || t === 'stocks' || !!rawSymbol || looksLikeSymbol)
      if (!isStock) return

      const symbol = rawSymbol || (looksLikeSymbol ? nameCandidate : (x.name || 'UNKNOWN'))
      const name = x.name || symbol
      const qty = Number(x.quantity) || Number(x.qty) || 0
      if (qty <= 0) return

      const charges = parseChargesFromNotes(x.notes)
      let unit = Number(x.buy_price) || 0
      if (!unit) {
        const pv = Number(x.purchase_value) || 0
        unit = qty > 0 ? (pv / qty) : 0
      }
      addBuy(symbol, name, qty, unit, charges, x.currency, x.date, 'investment')
    })

    // 2. Buy fallbacks from Expenses 
    // Matches if category is 'stocks' OR title starts with "Stock Buy"
    exp.filter(x => {
      const cat = (x.category || '').toLowerCase()
      const title = (x.title || '').toLowerCase()
      return cat === 'stocks' || title.startsWith('stock buy')
    }).forEach(x => {
      // Extract symbol from title: "Stock Buy TATA" or "Stock Buy TATA MOTORS"
      const title = String(x.title || '')
      // Check for Title pattern
      let symbol = 'UNKNOWN'
      const m = title.match(/stock buy[:\s]+(.*)/i)
      if (m && m[1]) {
        symbol = m[1]
      } else if ((x.category || '').toLowerCase() === 'stocks') {
        // If category is explicitly stocks but title doesn't match pattern, try to find a symbol in notes or just use UNKNOWN
        // This is a robust fallback
        symbol = 'Unknown Stock'
      }

      const qty = parseQtyFromNotes(x.notes)
      let unit = 0
      const m2 = String(x.notes || '').match(/@\s*([0-9]+(?:\.[0-9]+)?)/)
      if (m2) { const n = Number(m2[1]); if (Number.isFinite(n)) unit = n }
      const ch = parseChargesFromNotes(x.notes)

      addBuy(symbol, symbol, qty, unit, ch, x.currency, x.date, 'expense')
    })

    // 3. Sells from Income
    // Matches if source (or title for safety) starts with "Stock Sell"
    inc.forEach(x => {
      const source = (x.source || '').trim()
      const title = (x.title || '').trim() // API might return title if serializer included it (unlikely but safe)
      const textToCheck = source || title || ''

      if (!textToCheck.toLowerCase().startsWith('stock sell')) return

      // Extract symbol
      let symbol = 'UNKNOWN'
      const m = textToCheck.match(/stock sell[:\s]+(.*)/i)
      if (m && m[1]) {
        symbol = m[1]
      }

      const qty = parseQtyFromNotes(x.notes)
      addSell(symbol, qty)
    })

    const rows = Array.from(holdings.entries()).map(([symbol, v]) => {
      const qty = Math.max(0, Number(v.qty) || 0)
      const cost = qty > 0 ? Math.max(0, Number(v.cost) || 0) : 0
      const avg = qty > 0 ? cost / qty : 0
      return { symbol, name: v.name || symbol, qty, avg, cost }
    }).filter(r => r.qty > 0).sort((a, b) => a.symbol.localeCompare(b.symbol))

    return { rows, currency: pref, breakdowns: Object.fromEntries(breakdowns) }
  }, [])

  const { loading: localLoading, error, data } = useAsync(fetchAll, [incomes, expenses, investments])
  const [quotes, setQuotes] = React.useState({})
  const [qLoading, setQLoading] = React.useState(false)

  React.useEffect(() => {
    let ok = true
    const loadQuotes = async () => {
      if (!data || !data.rows) return
      const syms = Array.from(new Set(data.rows.map(r => (r.symbol || '').toUpperCase()).filter(s => s && s !== 'UNKNOWN')))
      if (syms.length === 0) { if (ok) setQuotes({}); return }
      setQLoading(true)
      try {
        const res = await api.getLatestQuotes(syms)
        const map = (res && res.results) || {}
        const out = {}
        Object.keys(map).forEach(k => { const v = map[k] || {}; out[k] = { ...(v.currentPrice || {}), updatedAt: v.updatedAt } })
        if (ok) setQuotes(out)
      } finally { if (ok) setQLoading(false) }
    }
    loadQuotes()
    return () => { ok = false }
  }, [data])

  const refreshQuotesNow = async () => {
    if (!data || !data.rows) return
    const syms = Array.from(new Set(data.rows.map(r => (r.symbol || '').toUpperCase()).filter(s => s && s !== 'UNKNOWN')))
    if (syms.length === 0) return
    setQLoading(true)
    try {
      await Promise.all(syms.map(s => api.getLtp(s).catch(() => null)))
      const res = await api.getLatestQuotes(syms)
      console.log(res)
      const map = (res && res.results) || {}
      const out = {}
      Object.keys(map).forEach(k => { const v = map[k] || {}; out[k] = { ...(v.currentPrice || {}), updatedAt: v.updatedAt } })
      setQuotes(out)
    } finally { setQLoading(false) }
  }

  return (
    <div className="card mb-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <strong>Current Stock Holdings</strong>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-sm btn-outline-primary" onClick={refreshQuotesNow} disabled={qLoading || loading}>{qLoading ? 'Refreshing prices…' : 'Refresh Prices'}</button>
        </div>
      </div>
      <div className="card-body">
        {(loading || localLoading) && <div className="text-muted">Loading holdings…</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        {!error && !(loading || localLoading) && (
          (!data || !Array.isArray(data.rows) || data.rows.length === 0) ? (
            <div className="text-muted">No holdings</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-sm">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th className="text-end">Qty</th>
                    <th className="text-end">Avg Cost ({data.currency})</th>
                    <th className="text-end">Total Cost ({data.currency})</th>
                    <th className="text-end">LTP (INR)</th>
                    <th className="text-end">Current Value (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r, idx) => (
                    <tr key={idx}>
                      <td>{(() => {
                        const sym = String(r.symbol || '').toUpperCase()
                        const bds = (data.breakdowns || {})[sym] || []
                        const tip = bds.map(b => {
                          const dt = b.date ? new Date(b.date).toLocaleDateString() : '-'
                          const qty = formatNumber(b.qty)
                          const unit = formatCurrency(b.unit, b.currency || 'INR')
                          return `${dt} · ${qty} @ ${unit}`
                        }).join('\n')
                        return <span title={tip}>{r.symbol}</span>
                      })()}</td>
                      <td>{r.name}</td>
                      <td className="text-end">{formatNumber(r.qty)}</td>
                      <td className="text-end">{formatCurrency(r.avg, data.currency)}</td>
                      <td className="text-end">{formatCurrency(r.cost, data.currency)}</td>
                      <td className="text-end">{(() => {
                        const sym = String(r.symbol || '').toUpperCase()
                        const qp = quotes[sym]
                        if (!qp) return qLoading ? '…' : '-'
                        const p = Number(qp.NSE || qp.BSE)
                        return Number.isFinite(p) ? formatCurrency(p, 'INR') : (qp.NSE || qp.BSE || '-')
                      })()}</td>
                      <td className="text-end">{(() => {
                        const sym = String(r.symbol || '').toUpperCase()
                        const qp = quotes[sym]
                        const p = qp ? Number(qp.NSE || qp.BSE) : NaN
                        const qty = Number(r.qty) || 0
                        if (!Number.isFinite(p) || qty <= 0) return '-'
                        return formatCurrency(p * qty, 'INR')
                      })()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4"></td>
                    <td className="text-end fw-semibold">{(() => {
                      if (!data || !data.rows) return '-'
                      const totalCost = data.rows.reduce((sum, r) => sum + (Number(r.cost) || 0), 0)
                      return formatCurrency(totalCost, 'INR')
                    })()}</td>
                    <td></td>
                    <td className="text-end fw-semibold">{(() => {
                      if (!data || !data.rows) return '-'
                      const total = data.rows.reduce((sum, r) => {
                        const sym = String(r.symbol || '').toUpperCase()
                        const qp = quotes[sym]
                        const p = qp ? Number(qp.NSE || qp.BSE) : NaN
                        const qty = Number(r.qty) || 0
                        if (!Number.isFinite(p) || qty <= 0) return sum
                        return sum + p * qty
                      }, 0)
                      return formatCurrency(total, 'INR')
                    })()}</td>
                  </tr>
                  <tr>
                    <td colSpan="6" className="text-end">Profit / Loss (INR)</td>
                    <td className="text-end fw-semibold">{(() => {
                      if (!data || !data.rows) return '-'
                      const totalCost = data.rows.reduce((sum, r) => sum + (Number(r.cost) || 0), 0)
                      const totalCurr = data.rows.reduce((sum, r) => {
                        const sym = String(r.symbol || '').toUpperCase()
                        const qp = quotes[sym]
                        const p = qp ? Number(qp.NSE || qp.BSE) : NaN
                        const qty = Number(r.qty) || 0
                        if (!Number.isFinite(p) || qty <= 0) return sum
                        return sum + p * qty
                      }, 0)
                      const pnl = totalCurr - totalCost
                      return formatCurrency(pnl, 'INR')
                    })()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}

function StockPriceCard() {
  const [symbol, setSymbol] = React.useState('EKC')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [quote, setQuote] = React.useState(null)

  const fetchNow = async () => {
    setError(''); setLoading(true)
    try {
      const res = await api.getLtp(symbol)
      setQuote(res)
    } catch (e) {
      setError(e?.message || 'Failed to fetch')
    } finally { setLoading(false) }
  }

  return (
    <div className="card mb-3">
      <div className="card-header d-flex align-items-center justify-content-between">
        <strong>Last Traded Price</strong>
        <div className="d-flex align-items-center gap-2">
          <input className="form-control form-control-sm" style={{ width: 140 }} value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="Symbol (e.g. EKC)" />
          <button className="btn btn-sm btn-primary" onClick={fetchNow} disabled={loading}>{loading ? 'Fetching…' : 'Refresh Now'}</button>
        </div>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger mb-2">{error}</div>}
        {!quote && <div className="text-muted">Enter a symbol and click Refresh Now.</div>}
        {quote && (
          <div className="row g-3">
            <div className="col-12 col-md-4"><div className="small text-uppercase text-muted">Symbol</div><div className="fw-semibold">{quote.symbol}</div></div>
            <div className="col-6 col-md-4"><div className="small text-uppercase text-muted">BSE</div><div className="fw-semibold">{quote?.currentPrice?.BSE ?? '-'}</div></div>
            <div className="col-6 col-md-4"><div className="small text-uppercase text-muted">NSE</div><div className="fw-semibold">{quote?.currentPrice?.NSE ?? '-'}</div></div>
            {quote.updatedAt && <div className="col-12"><div className="small text-muted">Updated at: {new Date(quote.updatedAt).toLocaleString()}</div></div>}
          </div>
        )}
        <div className="small text-muted mt-2">Auto-refresh runs hourly Mon–Fri between 08:00 and 14:00 server time.</div>
      </div>
    </div>
  )
}

function BrokerTransfersCard({ onChanged, onClose }) {
  const [type, setType] = React.useState('deposit') // deposit | withdrawal
  const [amount, setAmount] = React.useState('')
  const [currency, setCurrency] = React.useState('INR')
  const [date, setDate] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [msg, setMsg] = React.useState('')
  const [err, setErr] = React.useState('')
  const [bulkOpen, setBulkOpen] = React.useState(false)
  const [bulkText, setBulkText] = React.useState('')
  const [bulkMode, setBulkMode] = React.useState('csv')

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg(''); setErr(''); setSaving(true)
    try {
      const payload = {
        amount: Number(amount),
        currency,
        date,
        notes,
      }
      if (type === 'deposit') {
        await api.createExpense({ ...payload, title: 'Broker Deposit' })
      } else {
        await api.createIncome({ ...payload, source: 'Broker Withdrawal' })
      }
      setMsg('Saved successfully')
      setAmount(''); setDate(''); setNotes('')
      try { onChanged && onChanged() } catch (_) { }
    } catch (e1) {
      setErr(e1?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card mb-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <strong>Broker Account Transfers</strong>
        <div className="btn-group">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { triggerDownload('broker_transfers_template.csv', 'type,amount,currency,date,notes\n') }}>Download CSV Template</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { setBulkText('type,amount,currency,date,notes\ndeposit,1000,INR,2025-01-01,initial'); setBulkMode('csv'); setBulkOpen(true) }}>Bulk Upload</button>
          {onClose && <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Hide</button>}
        </div>
      </div>
      <div className="card-body">
        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-danger">{err}</div>}
        <form onSubmit={onSubmit}>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Type</label>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="deposit">Deposit to Broker</option>
                <option value="withdrawal">Withdrawal from Broker</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Amount</label>
              <input type="number" step="0.01" className="form-control" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="col-md-2">
              <label className="form-label">Currency</label>
              <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="INR">INR</option>
                <option value="QAR">QAR</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>
          <div className="mt-3">
            <label className="form-label">Notes</label>
            <input type="text" className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>
          <div className="mt-3 d-flex gap-2">
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>

        {bulkOpen && (
          <BulkCreateCard
            title="Bulk Broker Transfers"
            text={bulkText}
            setText={setBulkText}
            mode={bulkMode}
            setMode={setBulkMode}
            parseItems={(input) => {
              if (bulkMode === 'csv') return parseCSV(input)
              const parsed = JSON.parse(input || '[]'); return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])
            }}
            onSubmit={async (item) => {
              const t = (item.type || 'deposit').toString().toLowerCase()
              const payload = {
                amount: Number(item.amount) || 0,
                currency: item.currency || 'INR',
                date: item.date || '',
                notes: item.notes || ''
              }
              if (t === 'deposit') await api.createExpense({ ...payload, title: 'Broker Deposit' })
              else await api.createIncome({ ...payload, source: 'Broker Withdrawal' })
            }}
            onCancel={() => { setBulkOpen(false); try { onChanged && onChanged() } catch (_) { } }}
            help="CSV headers: type,amount,currency,date,notes. Type: deposit or withdrawal."
          />
        )}
      </div>
    </div>
  )
}

function BuyStockCard({ onChanged, onClose }) {
  const [name, setName] = React.useState('')
  const [symbol, setSymbol] = React.useState('')
  const [exchange, setExchange] = React.useState('NSE')
  const [qty, setQty] = React.useState('')
  const [price, setPrice] = React.useState('')
  const [charges, setCharges] = React.useState('0')
  const [currency, setCurrency] = React.useState('INR')
  const [date, setDate] = React.useState('')
  const [msg, setMsg] = React.useState('')
  const [err, setErr] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [bulkOpen, setBulkOpen] = React.useState(false)
  const [bulkText, setBulkText] = React.useState('')
  const [bulkMode, setBulkMode] = React.useState('csv')

  const total = (Number(qty) || 0) * (Number(price) || 0) + (Number(charges) || 0)

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg(''); setErr(''); setSaving(true)
    const payload = {
      name,
      symbol,
      qty: Number(qty),
      purchase_value: Number(price),
      current_value: Number(price),
      currency,
      date,
      category: 'stocks',
      type: 'Stocks',
      notes: `Exchange: ${exchange}; Charges: ${charges}; Total: ${formatNumber(total)}`
    }
    try {
      await api.createInvestment(payload)
      setMsg('Buy recorded under Investments')
      setName(''); setSymbol(''); setQty(''); setPrice(''); setCharges('0'); setDate('')
      try { onChanged && onChanged() } catch (_) { }
    } catch (e1) {
      try {
        await api.createExpense({ title: `Stock Buy ${symbol}`, amount: total, currency, date, notes: `Exchange: ${exchange}; Qty:${qty} @ ${price}; Charges:${charges}` })
        setMsg('Buy recorded as Expense (fallback)')
        setName(''); setSymbol(''); setQty(''); setPrice(''); setCharges('0'); setDate('')
        try { onChanged && onChanged() } catch (_) { }
      } catch (e2) {
        setErr(e2?.message || e1?.message || 'Failed to save')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card mb-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <strong>Buy Stocks</strong>
        <div className="btn-group">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { triggerDownload('stock_buys_template.csv', 'name,symbol,exchange,qty,unit_price,charges,currency,date\n') }}>Download CSV Template</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { setBulkText('name,symbol,exchange,qty,unit_price,charges,currency,date\nABC Ltd,ABC,NSE,10,100,5,INR,2025-01-01'); setBulkMode('csv'); setBulkOpen(true) }}>Bulk Upload</button>
          {onClose && <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Hide</button>}
        </div>
      </div>
      <div className="card-body">
        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-danger">{err}</div>}
        <form onSubmit={onSubmit}>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Stock Name</label>
              <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="col-md-2">
              <label className="form-label">Symbol</label>
              <input className="form-control" value={symbol} onChange={(e) => setSymbol(e.target.value)} required />
            </div>
            <div className="col-md-2">
              <label className="form-label">Exchange</label>
              <input className="form-control" value={exchange} onChange={(e) => setExchange(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label">Qty</label>
              <input type="number" step="1" className="form-control" value={qty} onChange={(e) => setQty(e.target.value)} required />
            </div>
            <div className="col-md-1">
              <label className="form-label">Unit Price</label>
              <input type="number" step="0.01" className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="col-md-2">
              <label className="form-label">Charges</label>
              <input type="number" step="0.01" className="form-control" value={charges} onChange={(e) => setCharges(e.target.value)} />
            </div>
          </div>
          <div className="row g-3 mt-2">
            <div className="col-md-2">
              <label className="form-label">Currency</label>
              <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="INR">INR</option>
                <option value="QAR">QAR</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="col-md-7 d-flex align-items-end justify-content-end">
              <div className="text-end">
                <div className="fw-bold">Total: {formatCurrency(total, currency)}</div>
              </div>
            </div>
          </div>
          <div className="mt-3 d-flex gap-2">
            <button className="btn btn-success" disabled={saving}>{saving ? 'Saving...' : 'Record Buy'}</button>
          </div>
        </form>

        {bulkOpen && (
          <BulkCreateCard
            title="Bulk Buy Stocks"
            text={bulkText}
            setText={setBulkText}
            mode={bulkMode}
            setMode={setBulkMode}
            parseItems={(input) => {
              if (bulkMode === 'csv') return parseCSV(input)
              const parsed = JSON.parse(input || '[]'); return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])
            }}
            onSubmit={async (item) => {
              const quantity = Number(item.qty) || Number(item.quantity) || 0
              const unit = Number(item.unit_price) || Number(item.price) || Number(item.buy_price) || 0
              const ch = Number(item.charges) || 0
              const cur = item.currency || 'INR'
              const dt = item.date || ''
              const total2 = quantity * unit + ch
              const payload = {
                name: item.name || '',
                symbol: item.symbol || '',
                qty: quantity,
                purchase_value: unit,
                current_value: unit,
                currency: cur,
                date: dt,
                date: dt,
                category: 'stocks',
                type: 'Stocks',
                notes: `Exchange: ${item.exchange || ''}; Charges: ${ch}; Total: ${formatNumber(total2)}`
              }
              try {
                await api.createInvestment(payload)
              } catch {
                await api.createExpense({ title: `Stock Buy ${payload.symbol}`, amount: total2, currency: cur, date: dt, notes: `Exchange: ${item.exchange || ''}; Qty:${quantity} @ ${unit}; Charges:${ch}` })
              }
            }}
            onCancel={() => { setBulkOpen(false); try { onChanged && onChanged() } catch (_) { } }}
            help="CSV headers: name,symbol,exchange,qty,unit_price,charges,currency,date"
          />
        )}
      </div>
    </div>
  )
}

function SellStockCard({ onChanged, onClose }) {
  const [symbol, setSymbol] = React.useState('')
  const [exchange, setExchange] = React.useState('NSE')
  const [qty, setQty] = React.useState('')
  const [price, setPrice] = React.useState('')
  const [charges, setCharges] = React.useState('0')
  const [currency, setCurrency] = React.useState('INR')
  const [date, setDate] = React.useState('')
  const [msg, setMsg] = React.useState('')
  const [err, setErr] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [bulkOpen, setBulkOpen] = React.useState(false)
  const [bulkText, setBulkText] = React.useState('')
  const [bulkMode, setBulkMode] = React.useState('csv')

  const proceeds = (Number(qty) || 0) * (Number(price) || 0) - (Number(charges) || 0)

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg(''); setErr(''); setSaving(true)
    try {
      await api.createIncome({ source: `Stock Sell ${symbol}`, amount: proceeds, currency, date, category: 'stocks', type: 'stocks', notes: `Exchange: ${exchange}; Qty:${qty} @ ${price}; Charges:${charges}` })
      setMsg('Sell recorded as Income')
      setSymbol(''); setQty(''); setPrice(''); setCharges('0'); setDate('')
      try { onChanged && onChanged() } catch (_) { }
    } catch (e1) {
      setErr(e1?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card mb-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <strong>Sell Stocks</strong>
        <div className="btn-group">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { triggerDownload('stock_sells_template.csv', 'symbol,exchange,qty,unit_price,charges,currency,date\n') }}>Download CSV Template</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { setBulkText('symbol,exchange,qty,unit_price,charges,currency,date\nABC,NSE,5,120,3,INR,2025-01-02'); setBulkMode('csv'); setBulkOpen(true) }}>Bulk Upload</button>
          {onClose && <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Hide</button>}
        </div>
      </div>
      <div className="card-body">
        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-danger">{err}</div>}
        <form onSubmit={onSubmit}>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Symbol</label>
              <input className="form-control" value={symbol} onChange={(e) => setSymbol(e.target.value)} required />
            </div>
            <div className="col-md-2">
              <label className="form-label">Exchange</label>
              <input className="form-control" value={exchange} onChange={(e) => setExchange(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label">Qty</label>
              <input type="number" step="1" className="form-control" value={qty} onChange={(e) => setQty(e.target.value)} required />
            </div>
            <div className="col-md-2">
              <label className="form-label">Unit Price</label>
              <input type="number" step="0.01" className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Charges</label>
              <input type="number" step="0.01" className="form-control" value={charges} onChange={(e) => setCharges(e.target.value)} />
            </div>
          </div>
          <div className="row g-3 mt-2">
            <div className="col-md-2">
              <label className="form-label">Currency</label>
              <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="INR">INR</option>
                <option value="QAR">QAR</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="col-md-7 d-flex align-items-end justify-content-end">
              <div className="text-end">
                <div className="fw-bold">Proceeds: {formatCurrency(proceeds, currency)}</div>
              </div>
            </div>
          </div>
          <div className="mt-3 d-flex gap-2">
            <button className="btn btn-danger" disabled={saving}>{saving ? 'Saving...' : 'Record Sell'}</button>
          </div>
        </form>

        {bulkOpen && (
          <BulkCreateCard
            title="Bulk Sell Stocks"
            text={bulkText}
            setText={setBulkText}
            mode={bulkMode}
            setMode={setBulkMode}
            parseItems={(input) => {
              if (bulkMode === 'csv') return parseCSV(input)
              const parsed = JSON.parse(input || '[]'); return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])
            }}
            onSubmit={async (item) => {
              const quantity = Number(item.qty) || Number(item.quantity) || 0
              const unit = Number(item.unit_price) || Number(item.price) || 0
              const ch = Number(item.charges) || 0
              const cur = item.currency || 'INR'
              const dt = item.date || ''
              const proceeds2 = quantity * unit - ch
              await api.createIncome({ title: `Stock Sell ${item.symbol || ''}`, amount: proceeds2, currency: cur, date: dt, notes: `Exchange: ${item.exchange || ''}; Qty:${quantity} @ ${unit}; Charges:${ch}` })
            }}
            onCancel={() => { setBulkOpen(false); try { onChanged && onChanged() } catch (_) { } }}
            help="CSV headers: symbol,exchange,qty,unit_price,charges,currency,date"
          />
        )}
      </div>
    </div>
  )
}
