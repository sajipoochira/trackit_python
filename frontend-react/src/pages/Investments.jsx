import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { convert as convertFx, getPreferredCurrency, setPreferredCurrency, subscribe as subscribeRates } from '../ratesStore.js'
import { formatCurrency } from '../utils/format.js'

export default function Investments() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { (async () => {
    try {
      const data = await api.getInvestments()
      setItems(Array.isArray(data) ? data : (data?.results || []))
    } catch (e) {
      setError(e?.message || 'Failed to load investments')
    } finally { setLoading(false) }
  })() }, [])

  return (
    <div>
      <h2 className="h4 mb-3">Investments Summary</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <SummaryCard items={items} loading={loading} />
    </div>
  )
}

// formatting handled by formatCellValue

function stripReadOnly(obj, roSet) {
  const ro = roSet || new Set(['id','pk','owner','user','created_at','updated_at'])
  const out = {}
  Object.keys(obj || {}).forEach(k => { if (!ro.has(k)) out[k] = obj[k] })
  return out
}

function seedTemplate(sample) {
  const ro = new Set(['id','pk','owner','user','created_at','updated_at'])
  const out = {}
  if (sample) {
    Object.keys(sample).forEach(k => { if (!ro.has(k)) out[k] = sample[k] ?? '' })
  } else {
    Object.assign(out, {
      name: '',
      symbol: '',
      quantity: 0,
      buy_price: 0,
      currency: 'INR',
      date: '',
      category: 'Stocks'
    })
  }
  return out
}

function pickInvestmentConfig(config){
  if ((config.order && config.order.length) || (config.overrides && Object.keys(config.overrides).length)) return config
  return {
    order: ['name','symbol','quantity','buy_price','currency','date','category'],
    overrides: {
      name: { type: 'text', required: true, label: 'Investment Name' },
      symbol: { type: 'text', required: true, label: 'Symbol/Ticker' },
      quantity: { type: 'number', required: true, step: 1, min: 0 },
      buy_price: { type: 'number', required: true, step: 0.01, min: 0 },
      currency: { type: 'select', options: ['INR','QAR'], required: true },
      date: { type: 'date', required: false },
      category: { type: 'select', options: ['Gold','Land','Properties','Stocks','Business'], required: false }
    },
    template: { name: '', symbol: '', quantity: 0, buy_price: 0, currency: 'INR', date: '', category: 'Stocks' },
    readOnly: new Set(['id','pk','owner','user','created_at','updated_at'])
  }
}

function getColumns(items, cfg){
  const ro = cfg.readOnly || new Set()
  const makeLabel = (name) => (cfg.overrides?.[name]?.label) || labelize(name)
  const cols = []
  const order = Array.isArray(cfg.order) ? cfg.order : []
  order.forEach(n => { if (!ro.has(n)) cols.push({ key: n, label: makeLabel(n) }) })
  const extraKeys = items.length ? Object.keys(items[0]) : []
  extraKeys.forEach(n => { if (!ro.has(n) && !cols.find(c=>c.key===n)) cols.push({ key: n, label: makeLabel(n) }) })
  return cols
}

function labelize(name){
  return String(name).replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase())
}

function SummaryCard({ items = [], loading = false }){
  const [pref, setPref] = useState(getPreferredCurrency())
  useEffect(() => {
    const unsub = subscribeRates(() => setPref(getPreferredCurrency()))
    return () => { try { unsub && unsub() } catch(_){} }
  }, [])

  const stocks = useMemo(() => (items || []).filter(x => {
    const cat = String(x.category || '').toLowerCase()
    const t = String(x.type || '').toLowerCase()
    const nameCandidate = (x.name || '').toUpperCase().trim()
    const looksLikeSymbol = !!nameCandidate && !nameCandidate.includes(' ') && nameCandidate.length <= 12
    return cat === 'stocks' || t === 'stock' || t === 'stocks' || !!(x.symbol) || looksLikeSymbol
  }), [items])
  const gold = useMemo(() => (items || []).filter(x => {
    const cat = String(x.category || '').toLowerCase(); const t = String(x.type || '').toLowerCase();
    return cat === 'gold' || t === 'gold'
  }), [items])
  const business = useMemo(() => (items || []).filter(x => {
    const cat = String(x.category || '').toLowerCase(); const t = String(x.type || '').toLowerCase();
    return cat === 'business' || t === 'business'
  }), [items])
  const others = useMemo(() => (items || []).filter(x => {
    const cat = String(x.category || '').toLowerCase(); const t = String(x.type || '').toLowerCase();
    const isStock = cat === 'stocks' || t === 'stock' || t === 'stocks' || !!(x.symbol)
    const isGold = cat === 'gold' || t === 'gold'
    const isBiz = cat === 'business' || t === 'business'
    return !(isStock || isGold || isBiz)
  }), [items])

  const perSymbol = useMemo(() => {
    const map = new Map()
    stocks.forEach(x => {
      const sym = (x.symbol || x.name || 'UNKNOWN').toUpperCase()
      const qty = Number(x.quantity) || Number(x.qty) || 0
      let price = Number(x.buy_price) || 0
      if (!price) {
        const pv = Number(x.purchase_value) || 0
        price = qty > 0 ? (pv / qty) : 0
      }
      const cur = String(x.currency || 'INR').toUpperCase()
      const costNative = qty * price
      const cost = cur === pref ? costNative : (convertFx(costNative, cur, pref) || costNative)
      const row = map.get(sym) || { symbol: sym, name: x.name || sym, qty: 0, cost: 0, currency: pref }
      row.qty += qty
      row.cost += cost
      map.set(sym, row)
    })
    return Array.from(map.values()).filter(r => r.qty > 0)
  }, [stocks, pref])

  const [quotes, setQuotes] = useState({})
  const [qLoading, setQLoading] = useState(false)

  const loadQuotes = async (symbols) => {
    if (!symbols || symbols.length === 0) { setQuotes({}); return }
    setQLoading(true)
    try {
      const res = await api.getLatestQuotes(symbols)
      const out = {}
      const map = (res && res.results) || {}
      Object.keys(map).forEach(k => { out[k] = map[k]?.currentPrice || {} })
      setQuotes(out)
    } finally { setQLoading(false) }
  }

  useEffect(() => {
    const syms = Array.from(new Set(perSymbol.map(r => (r.symbol || '').toUpperCase()).filter(Boolean)))
    loadQuotes(syms)
  }, [perSymbol])

  const refreshNow = async () => {
    const syms = Array.from(new Set(perSymbol.map(r => (r.symbol || '').toUpperCase()).filter(Boolean)))
    if (!syms.length) return
    setQLoading(true)
    try {
      await Promise.all(syms.map(s => api.getLtp(s).catch(() => null)))
      await loadQuotes(syms)
    } finally { setQLoading(false) }
  }

  const rows = useMemo(() => perSymbol.map(r => {
    const sym = String(r.symbol || '').toUpperCase()
    const qp = quotes[sym]
    const ltpInInr = qp ? Number(qp.NSE || qp.BSE) : NaN
    const ltp = (pref === 'INR') ? ltpInInr : (convertFx(ltpInInr, 'INR', pref) || NaN)
    const current = Number.isFinite(ltp) ? (ltp * (Number(r.qty) || 0)) : null
    return { ...r, ltp, current }
  }), [perSymbol, quotes, pref])

  const totals = useMemo(() => {
    const totalCost = rows.reduce((s, r) => s + (Number(r.cost) || 0), 0)
    const totalCurr = rows.reduce((s, r) => s + (Number(r.current) || 0), 0)
    return { totalCost, totalCurr, pnl: totalCurr - totalCost }
  }, [rows])

  // Gold & Business & Others: use cost as current (no live price)
  const sumCategory = (arr) => {
    let cost = 0
    arr.forEach(x => {
      const qty = Number(x.quantity) || Number(x.qty) || 0
      let price = Number(x.buy_price) || 0
      if (!price) { const pv = Number(x.purchase_value) || 0; price = qty > 0 ? (pv / qty) : 0 }
      const ch = 0 // notes parsing optional
      const native = qty * price + ch
      const cur = String(x.currency || 'INR').toUpperCase()
      const val = cur === pref ? native : (convertFx(native, cur, pref) || native)
      cost += val
    })
    return { cost, current: cost, pnl: 0 }
  }
  const goldTotals = useMemo(()=> sumCategory(gold), [gold, pref])
  const bizTotals = useMemo(()=> sumCategory(business), [business, pref])
  const otherTotals = useMemo(()=> sumCategory(others), [others, pref])

  const setCurrency = (c) => { try { setPreferredCurrency(c); setPref(c) } catch(_){} }

  return (
    <div className="card mb-3">
      <div className="card-header d-flex align-items-center justify-content-between">
        <strong>Investments Summary</strong>
        <div className="d-flex align-items-center gap-2">
          <div className="btn-group btn-group-sm" role="group">
            <button className={`btn btn-outline-secondary ${pref==='INR'?'active':''}`} onClick={()=>setCurrency('INR')}>INR</button>
            <button className={`btn btn-outline-secondary ${pref==='QAR'?'active':''}`} onClick={()=>setCurrency('QAR')}>QAR</button>
          </div>
          <button className="btn btn-sm btn-outline-primary" onClick={refreshNow} disabled={qLoading}>{qLoading ? 'Refreshing…' : 'Refresh Prices (Stocks)'}</button>
        </div>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-muted">Loading…</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Type</th>
                  <th className="text-end">Total Cost ({pref})</th>
                  <th className="text-end">Current Value ({pref})</th>
                  <th className="text-end">P/L ({pref})</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Stocks</td>
                  <td className="text-end">{formatCurrency(totals.totalCost, pref)}</td>
                  <td className="text-end">{formatCurrency(totals.totalCurr, pref)}</td>
                  <td className="text-end">{formatCurrency(totals.pnl, pref)}</td>
                </tr>
                <tr>
                  <td>Gold</td>
                  <td className="text-end">{formatCurrency(goldTotals.cost, pref)}</td>
                  <td className="text-end">{formatCurrency(goldTotals.current, pref)}</td>
                  <td className="text-end">{formatCurrency(goldTotals.pnl, pref)}</td>
                </tr>
                <tr>
                  <td>Business</td>
                  <td className="text-end">{formatCurrency(bizTotals.cost, pref)}</td>
                  <td className="text-end">{formatCurrency(bizTotals.current, pref)}</td>
                  <td className="text-end">{formatCurrency(bizTotals.pnl, pref)}</td>
                </tr>
                <tr>
                  <td>Other</td>
                  <td className="text-end">{formatCurrency(otherTotals.cost, pref)}</td>
                  <td className="text-end">{formatCurrency(otherTotals.current, pref)}</td>
                  <td className="text-end">{formatCurrency(otherTotals.pnl, pref)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td className="text-end fw-semibold">Totals</td>
                  <td className="text-end fw-semibold">{formatCurrency((totals.totalCost + goldTotals.cost + bizTotals.cost + otherTotals.cost), pref)}</td>
                  <td className="text-end fw-semibold">{formatCurrency((totals.totalCurr + goldTotals.current + bizTotals.current + otherTotals.current), pref)}</td>
                  <td className="text-end fw-semibold">{formatCurrency((totals.pnl + goldTotals.pnl + bizTotals.pnl + otherTotals.pnl), pref)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
