import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import DynamicForm from '../components/DynamicForm.jsx'
import { getFormConfig } from '../utils/schema.js'
import BulkCreateCard from '../components/BulkCreateCard.jsx'
import { parseCSV } from '../utils/csv.js'
import { coerceTypesWithOverrides } from '../utils/bulk.js'
import { formatCellValue } from '../utils/format.js'
import { convert as convertFx, getPreferredCurrency, setPreferredCurrency, subscribe as subscribeRates } from '../ratesStore.js'

export default function Investments() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const [formValues, setFormValues] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [formConfig, setFormConfig] = useState({ overrides: {}, order: [], template: {}, readOnly: new Set() })
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkMode, setBulkMode] = useState('json')

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await api.getInvestments()
      setItems(Array.isArray(data) ? data : (data?.results || []))
    } catch (e) {
      setError(e?.message || 'Failed to load investments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { (async () => { setFormConfig(await getFormConfig('/investments/')); await load() })() }, [])

  const useConfig = useMemo(()=>pickInvestmentConfig(formConfig), [formConfig])
  const columns = useMemo(()=>getColumns(items, useConfig), [items, useConfig])

  function openCreate() {
    setFormMode('create')
    setEditingId(null)
    const template = Object.keys(useConfig.template || {}).length ? useConfig.template : seedTemplate(items[0])
    setFormValues(template)
    setFormOpen(true)
  }
  function openBulk() {
    const sample = Object.keys(useConfig.template || {}).length ? useConfig.template : seedTemplate(items[0])
    setBulkText(JSON.stringify([sample], null, 2))
    setBulkOpen(true)
  }
  const parseItems = React.useCallback((input)=>{
    if (bulkMode === 'csv') {
      const rows = parseCSV(input)
      return rows.map(r => coerceTypesWithOverrides(r, useConfig.overrides))
    }
    const parsed = JSON.parse(input || '[]')
    return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])
  }, [bulkMode, useConfig])

  function openEdit(item) {
    const id = item.id ?? item.pk
    if (!id) return
    setFormMode('edit')
    setEditingId(id)
    setFormValues(stripReadOnly(item, useConfig.readOnly))
    setFormOpen(true)
  }

  async function onDelete(item) {
    const id = item.id ?? item.pk
    if (!id) return
    if (!confirm('Delete this investment?')) return
    try {
      await api.deleteInvestment(id)
      await load()
    } catch (e) {
      alert(e?.message || 'Delete failed')
    }
  }

  async function handleSubmit(payload) {
    if (formMode === 'create') await api.createInvestment(payload)
    else if (formMode === 'edit' && editingId) await api.updateInvestment(editingId, payload)
    setFormOpen(false)
    await load()
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">Investments</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={openCreate}>New Investment</button>
          <button className="btn btn-outline-secondary" onClick={openBulk}>Bulk Add</button>
          <button className="btn btn-outline-primary" onClick={load} disabled={loading}>Refresh</button>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}

      {formOpen && (
        <DynamicForm
          title={`${formMode === 'create' ? 'Create' : 'Edit'} Investment`}
          initialValues={formValues || {}}
          overrides={useConfig.overrides}
          order={useConfig.order}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
        />
      )}

      {bulkOpen && (
        <BulkCreateCard
          title="Bulk Create Investments"
          text={bulkText}
          setText={setBulkText}
          onSubmit={async (item)=>{ await api.createInvestment(item) }}
          onCancel={()=> setBulkOpen(false)}
          help="Provide JSON array or CSV with header row. Unknown fields will be ignored if serializer allows."
          mode={bulkMode}
          setMode={setBulkMode}
          parseItems={parseItems}
        />
      )}

      <div className="card">
        <div className="card-header"><strong>Investment List</strong></div>
        <div className="card-body">
          {!items.length ? (
            <div className="text-muted">No data</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    {columns.map((c) => (<th key={c.key}>{c.label}</th>))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      {columns.map((c) => (<td key={c.key}>{formatCellValue(item, c.key, useConfig)}</td>))}
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <button className="btn btn-outline-primary" onClick={()=>openEdit(item)}>Edit</button>
                          <button className="btn btn-outline-danger" onClick={()=>onDelete(item)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <StocksAccumulatedCard items={items} />
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

function StocksAccumulatedCard({ items = [] }){
  const [pref, setPref] = useState(getPreferredCurrency())
  useEffect(() => {
    const unsub = subscribeRates(() => setPref(getPreferredCurrency()))
    return () => { try { unsub && unsub() } catch(_){} }
  }, [])

  const stocks = useMemo(() => (items || []).filter(x => (String(x.category || '')).toLowerCase() === 'stocks'), [items])

  const perSymbol = useMemo(() => {
    const map = new Map()
    stocks.forEach(x => {
      const sym = x.symbol || x.name || 'UNKNOWN'
      const qty = Number(x.quantity) || 0
      const price = Number(x.buy_price) || 0
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

  const setCurrency = (c) => { try { setPreferredCurrency(c); setPref(c) } catch(_){} }

  return (
    <div className="card mb-3">
      <div className="card-header d-flex align-items-center justify-content-between">
        <strong>Stocks Summary (Accumulated)</strong>
        <div className="d-flex align-items-center gap-2">
          <div className="btn-group btn-group-sm" role="group">
            <button className={`btn btn-outline-secondary ${pref==='INR'?'active':''}`} onClick={()=>setCurrency('INR')}>INR</button>
            <button className={`btn btn-outline-secondary ${pref==='QAR'?'active':''}`} onClick={()=>setCurrency('QAR')}>QAR</button>
          </div>
          <button className="btn btn-sm btn-outline-primary" onClick={refreshNow} disabled={qLoading}>{qLoading ? 'Refreshing…' : 'Refresh Prices'}</button>
        </div>
      </div>
      <div className="card-body">
        {rows.length === 0 ? (
          <div className="text-muted">No stock investments</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th className="text-end">Qty</th>
                  <th className="text-end">Current value ({pref})</th>
                  <th className="text-end">Purchase value ({pref})</th>
                  <th>Currency</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.symbol || i}>
                    <td>{r.name || r.symbol}</td>
                    <td>{r.symbol}</td>
                    <td>Stocks</td>
                    <td className="text-end">{Number(r.qty) || 0}</td>
                    <td className="text-end">{r.current != null ? r.current.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}</td>
                    <td className="text-end">{Number(r.cost || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td>{pref}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-secondary" onClick={async ()=>{ setQLoading(true); try { await api.getLtp(r.symbol); await loadQuotes([r.symbol]); } finally { setQLoading(false) }}} disabled={qLoading}>Refresh</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" className="text-end fw-semibold">Totals</td>
                  <td className="text-end fw-semibold">{totals.totalCurr.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="text-end fw-semibold">{totals.totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td>{pref}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan="7" className="text-end">Profit / Loss ({pref})</td>
                  <td className="text-end fw-semibold">{totals.pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

