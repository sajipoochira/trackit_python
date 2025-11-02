import React from 'react'
import { api } from '../api'
import { formatCurrency, formatNumber } from '../utils/format.js'
import { convert as convertFx, getPreferredCurrency, setPreferredCurrency, subscribe as subscribeRates } from '../ratesStore.js'

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

export default function BusinessInvestments(){
  const [pref, setPref] = React.useState(getPreferredCurrency())
  React.useEffect(()=>{
    const unsub = subscribeRates(()=> setPref(getPreferredCurrency()))
    return ()=> { try { unsub && unsub() } catch(_){} }
  }, [])
  const fetchAll = React.useCallback(async () => {
    const [incomes, expenses, investments] = await Promise.all([
      api.getIncomes(), api.getExpenses(), api.getInvestments()
    ])
    const inc = normalizeList(incomes)
    const exp = normalizeList(expenses)
    const inv = normalizeList(investments)

    const convertAmt = (amt, cur) => {
      const n = Number(amt) || 0
      if (!cur || cur === pref) return n
      const v = convertFx(n, cur, pref)
      return Number.isFinite(v) ? v : n
    }

    const holdings = new Map() // name -> { name, qty, cost }
    const addBuy = (name, qty, unit, charges, currency) => {
      const q = Number(qty) || 0
      const u = Number(unit) || 0
      const ch = Number(charges) || 0
      const total = q * u + ch
      const cur = holdings.get(name) || { name, qty: 0, cost: 0 }
      cur.qty += q
      cur.cost += convertAmt(total, currency)
      holdings.set(name, cur)
    }
    const addSell = (name, q) => {
      const cur = holdings.get(name) || { name, qty: 0, cost: 0 }
      if (cur.qty <= 0 || q <= 0) { holdings.set(name, cur); return }
      const avg = cur.qty > 0 ? (cur.cost / cur.qty) : 0
      const reduceQty = Math.min(cur.qty, q)
      cur.qty -= reduceQty
      cur.cost -= avg * reduceQty
      holdings.set(name, cur)
    }

    // From Investments (category/type Business) with legacy fields support
    inv.forEach(x => {
      const cat = String(x.category || '').toLowerCase()
      const t = String(x.type || '').toLowerCase()
      const isBiz = cat === 'business' || t === 'business'
      if (!isBiz) return
      const name = x.name || 'BUSINESS'
      const qty = Number(x.quantity) || Number(x.qty) || 0
      if (qty <= 0) return
      let unit = Number(x.buy_price) || 0
      if (!unit) {
        const pv = Number(x.purchase_value) || 0
        unit = qty > 0 ? (pv / qty) : 0
      }
      const ch = parseChargesFromNotes(x.notes)
      addBuy(name, qty, unit, ch, x.currency)
    })
    // Expense fallback: "Business Buy <NAME>"
    exp.filter(x => (x.title || '').toLowerCase().startsWith('business buy')).forEach(x => {
      const t = String(x.title || '')
      const m = t.match(/business buy\s+(.+)/i)
      const name = (m ? m[1] : 'BUSINESS').toUpperCase()
      const qty = parseQtyFromNotes(x.notes)
      let unit = 0
      const m2 = String(x.notes || '').match(/@\s*([0-9]+(?:\.[0-9]+)?)/)
      if (m2) { const n = Number(m2[1]); if (Number.isFinite(n)) unit = n }
      const ch = parseChargesFromNotes(x.notes)
      addBuy(name, qty, unit, ch, x.currency)
    })
    // Income fallback: "Business Sell <NAME>"
    inc.filter(x => (x.title || '').toLowerCase().startsWith('business sell')).forEach(x => {
      const t = String(x.title || '')
      const m = t.match(/business sell\s+(.+)/i)
      const name = (m ? m[1] : 'BUSINESS').toUpperCase()
      const qty = parseQtyFromNotes(x.notes)
      addSell(name, qty)
    })

    const rows = Array.from(holdings.values()).map(v => {
      const qty = Math.max(0, Number(v.qty) || 0)
      const cost = qty > 0 ? Math.max(0, Number(v.cost) || 0) : 0
      const avg = qty > 0 ? cost / qty : 0
      return { name: v.name, qty, avg, cost }
    }).filter(r => r.qty > 0).sort((a,b)=> a.name.localeCompare(b.name))

    return { rows, currency: pref }
  }, [])

  const { loading, error, data } = useAsync(fetchAll, [])

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">Business Investments</h2>
        <div className="btn-group btn-group-sm" role="group">
          <button className={`btn btn-outline-secondary ${pref==='INR'?'active':''}`} onClick={()=> setPreferredCurrency('INR')}>INR</button>
          <button className={`btn btn-outline-secondary ${pref==='QAR'?'active':''}`} onClick={()=> setPreferredCurrency('QAR')}>QAR</button>
        </div>
      </div>
      <div className="card mb-3">
        <div className="card-header"><strong>Current Business Holdings</strong></div>
        <div className="card-body">
          {loading && <div className="text-muted">Loading…</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          {data && (
            data.rows.length === 0 ? (
              <div className="text-muted">No holdings</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th className="text-end">Qty</th>
                      <th className="text-end">Avg Cost ({data.currency})</th>
                      <th className="text-end">Total Cost ({data.currency})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r, idx)=> (
                      <tr key={idx}>
                        <td>{r.name}</td>
                        <td className="text-end">{formatNumber(r.qty)}</td>
                        <td className="text-end">{formatCurrency(r.avg, data.currency)}</td>
                        <td className="text-end">{formatCurrency(r.cost, data.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td></td>
                      <td></td>
                      <td className="text-end fw-semibold">Total Cost</td>
                      <td className="text-end fw-semibold">{(() => {
                        const totalCost = data.rows.reduce((sum, r) => sum + (Number(r.cost) || 0), 0)
                        return formatCurrency(totalCost, data.currency)
                      })()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      <TransferCard />
      <BuyCard />
      <SellCard />
    </div>
  )
}

function TransferCard(){
  const [type, setType] = React.useState('deposit')
  const [amount, setAmount] = React.useState('')
  const [currency, setCurrency] = React.useState('INR')
  const [date, setDate] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [msg, setMsg] = React.useState('')
  const [err, setErr] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const onSubmit = async (e)=>{
    e.preventDefault(); setMsg(''); setErr(''); setSaving(true)
    try{
      const payload = { title: type === 'deposit' ? 'Deposit' : 'Withdrawal', amount: Number(amount)||0, currency, date, notes }
      if (type === 'deposit') await api.createExpense(payload); else await api.createIncome(payload)
      setMsg('Saved'); setAmount(''); setDate(''); setNotes('')
    }catch(e1){ setErr(e1?.message || 'Failed to save') } finally { setSaving(false) }
  }
  return (
    <div className="card mb-3">
      <div className="card-header"><strong>Transfers</strong></div>
      <div className="card-body">
        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-danger">{err}</div>}
        <form onSubmit={onSubmit}>
          <div className="row g-3">
            <div className="col-md-3"><label className="form-label">Type</label><select className="form-select" value={type} onChange={e=>setType(e.target.value)}><option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option></select></div>
            <div className="col-md-3"><label className="form-label">Amount</label><input type="number" step="0.01" className="form-control" value={amount} onChange={e=>setAmount(e.target.value)} required /></div>
            <div className="col-md-2"><label className="form-label">Currency</label><select className="form-select" value={currency} onChange={e=>setCurrency(e.target.value)}><option value="INR">INR</option><option value="QAR">QAR</option></select></div>
            <div className="col-md-4"><label className="form-label">Date</label><input type="date" className="form-control" value={date} onChange={e=>setDate(e.target.value)} required /></div>
          </div>
          <div className="mt-3"><label className="form-label">Notes</label><input className="form-control" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Optional" /></div>
          <div className="mt-3"><button className="btn btn-outline-secondary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
        </form>
      </div>
    </div>
  )
}

function BuyCard(){
  const [name, setName] = React.useState('')
  const [qty, setQty] = React.useState('')
  const [price, setPrice] = React.useState('')
  const [charges, setCharges] = React.useState('0')
  const [currency, setCurrency] = React.useState('INR')
  const [date, setDate] = React.useState('')
  const [msg, setMsg] = React.useState('')
  const [err, setErr] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const total = (Number(qty) || 0) * (Number(price) || 0) + (Number(charges) || 0)

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg(''); setErr(''); setSaving(true)
    try {
      await api.createInvestment({ name, quantity: Number(qty), buy_price: Number(price), currency, date, category: 'Business', notes: `Charges: ${charges}; Total: ${total}` })
      setMsg('Buy recorded under Investments')
      setName(''); setQty(''); setPrice(''); setCharges('0'); setDate('')
    } catch (e1) {
      try {
        await api.createExpense({ title: `Business Buy ${name}`, amount: total, currency, date, notes: `Qty:${qty} @ ${price}; Charges:${charges}` })
        setMsg('Buy recorded as Expense')
        setName(''); setQty(''); setPrice(''); setCharges('0'); setDate('')
      } catch(e2) { setErr(e2?.message || e1?.message || 'Failed to save') }
    } finally { setSaving(false) }
  }

  return (
    <div className="card mb-3">
      <div className="card-header"><strong>Buy Business Investment</strong></div>
      <div className="card-body">
        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-danger">{err}</div>}
        <form onSubmit={onSubmit}>
          <div className="row g-3">
            <div className="col-md-4"><label className="form-label">Name</label><input className="form-control" value={name} onChange={e=>setName(e.target.value)} required /></div>
            <div className="col-md-2"><label className="form-label">Qty</label><input type="number" step="0.01" className="form-control" value={qty} onChange={e=>setQty(e.target.value)} required /></div>
            <div className="col-md-3"><label className="form-label">Unit Price</label><input type="number" step="0.01" className="form-control" value={price} onChange={e=>setPrice(e.target.value)} required /></div>
            <div className="col-md-3"><label className="form-label">Charges</label><input type="number" step="0.01" className="form-control" value={charges} onChange={e=>setCharges(e.target.value)} /></div>
          </div>
          <div className="row g-3 mt-2">
            <div className="col-md-2"><label className="form-label">Currency</label><select className="form-select" value={currency} onChange={e=>setCurrency(e.target.value)}><option value="INR">INR</option><option value="QAR">QAR</option></select></div>
            <div className="col-md-3"><label className="form-label">Date</label><input type="date" className="form-control" value={date} onChange={e=>setDate(e.target.value)} required /></div>
            <div className="col-md-7 d-flex align-items-end justify-content-end"><div className="text-end"><div className="fw-bold">Total: {formatCurrency(total, currency)}</div></div></div>
          </div>
          <div className="mt-3"><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
        </form>
      </div>
    </div>
  )
}

function SellCard(){
  const [name, setName] = React.useState('')
  const [qty, setQty] = React.useState('')
  const [price, setPrice] = React.useState('')
  const [charges, setCharges] = React.useState('0')
  const [currency, setCurrency] = React.useState('INR')
  const [date, setDate] = React.useState('')
  const [msg, setMsg] = React.useState('')
  const [err, setErr] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const proceeds = (Number(qty) || 0) * (Number(price) || 0) - (Number(charges) || 0)

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg(''); setErr(''); setSaving(true)
    try {
      await api.createIncome({ title: `Business Sell ${name}`, amount: proceeds, currency, date, notes: `Qty:${qty} @ ${price}; Charges:${charges}` })
      setMsg('Sell recorded as Income')
      setName(''); setQty(''); setPrice(''); setCharges('0'); setDate('')
    } catch(e2) { setErr(e2?.message || 'Failed to save') } finally { setSaving(false) }
  }

  return (
    <div className="card mb-3">
      <div className="card-header"><strong>Sell Business Investment</strong></div>
      <div className="card-body">
        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-danger">{err}</div>}
        <form onSubmit={onSubmit}>
          <div className="row g-3">
            <div className="col-md-4"><label className="form-label">Name</label><input className="form-control" value={name} onChange={e=>setName(e.target.value)} required /></div>
            <div className="col-md-2"><label className="form-label">Qty</label><input type="number" step="0.01" className="form-control" value={qty} onChange={e=>setQty(e.target.value)} required /></div>
            <div className="col-md-2"><label className="form-label">Unit Price</label><input type="number" step="0.01" className="form-control" value={price} onChange={e=>setPrice(e.target.value)} required /></div>
            <div className="col-md-3"><label className="form-label">Charges</label><input type="number" step="0.01" className="form-control" value={charges} onChange={e=>setCharges(e.target.value)} /></div>
          </div>
          <div className="row g-3 mt-2">
            <div className="col-md-2"><label className="form-label">Currency</label><select className="form-select" value={currency} onChange={e=>setCurrency(e.target.value)}><option value="INR">INR</option><option value="QAR">QAR</option></select></div>
            <div className="col-md-3"><label className="form-label">Date</label><input type="date" className="form-control" value={date} onChange={e=>setDate(e.target.value)} required /></div>
            <div className="col-md-7 d-flex align-items-end justify-content-end"><div className="text-end"><div className="fw-bold">Proceeds: {formatCurrency(proceeds, currency)}</div></div></div>
          </div>
          <div className="mt-3"><button className="btn btn-danger" disabled={saving}>{saving ? 'Saving...' : 'Record Sell'}</button></div>
        </form>
      </div>
    </div>
  )
}
