import React from 'react'
import BulkCreateCard from '../components/BulkCreateCard.jsx'
import { api } from '../api'
import { getFormConfig } from '../utils/schema.js'
import { parseCSV, toCSV } from '../utils/csv.js'

const resources = [
  { key: 'investments', title: 'Investments', endpoint: '/investments/', create: (x)=>api.createInvestment(x) },
  { key: 'income', title: 'Income', endpoint: '/incomes/', create: (x)=>api.createIncome(x) },
  { key: 'expenses', title: 'Expenses', endpoint: '/expenses/', create: (x)=>api.createExpense(x) },
  { key: 'assets', title: 'Assets', endpoint: '/assets/', create: (x)=>api.createAsset(x) },
  { key: 'liabilities', title: 'Liabilities', endpoint: '/liabilities/', create: (x)=>api.createLiability(x) },
]

export default function BulkImport(){
  const [current, setCurrent] = React.useState(resources[0])
  const [text, setText] = React.useState('[{}]')
  const [mode, setMode] = React.useState('json')
  const [cfg, setCfg] = React.useState({ overrides:{}, order:[], template:{}, readOnly:new Set() })
  React.useEffect(()=>{ (async()=>{ setCfg(await getFormConfig(current.endpoint)) })() }, [current])
  React.useEffect(()=>{
    // Preselect from query param ?resource=assets
    try {
      const params = new URLSearchParams(window.location.search)
      const r = params.get('resource')
      if (r) {
        const found = resources.find(x => x.key === r)
        if (found) setCurrent(found)
      }
    } catch(_) {}
  }, [])
  const useCfg = React.useMemo(()=> pickFallbackIfEmpty(current.key, cfg), [current, cfg])
  const onCancel = () => setText('[{}]')
  const parseItems = React.useCallback((input)=>{
    if (mode === 'csv') {
      const rows = parseCSV(input)
      const mapped = rows.map(r => coerceTypes(r, useCfg))
      return mapped
    }
    const parsed = JSON.parse(input || '[]')
    return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])
  }, [mode, useCfg])
  const downloadJSON = () => {
    const sample = Object.keys(useCfg.template||{}).length ? useCfg.template : {}
    const content = JSON.stringify([sample], null, 2)
    triggerDownload(`${current.key}_template.json`, content, 'application/json')
  }
  const downloadCSV = () => {
    const headers = useCfg.order && useCfg.order.length ? useCfg.order : Object.keys(useCfg.template || {})
    const content = toCSV(headers, [useCfg.template || {}])
    triggerDownload(`${current.key}_template.csv`, content, 'text/csv')
  }
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">Bulk Import</h2>
        <select className="form-select" style={{maxWidth: 260}} value={current.key} onChange={(e)=>{
          const r = resources.find(x=>x.key===e.target.value); setCurrent(r)
        }}>
          {resources.map(r=> <option key={r.key} value={r.key}>{r.title}</option>)}
        </select>
      </div>
      <div className="d-flex gap-2 mb-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={downloadJSON}>Download JSON Template</button>
        <button className="btn btn-outline-secondary btn-sm" onClick={downloadCSV}>Download CSV Template</button>
      </div>
      <BulkCreateCard
        title={`Bulk Create ${current.title}`}
        text={text}
        setText={setText}
        mode={mode}
        setMode={setMode}
        parseItems={parseItems}
        onSubmit={(item)=> current.create(item)}
        onCancel={onCancel}
        help={`Paste ${mode.toUpperCase()} data for ${current.title}. JSON: array of objects. CSV: first row headers.`}
      />
    </div>
  )
}

function triggerDownload(filename, content, mime='text/plain'){
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function pickFallbackIfEmpty(resourceKey, cfg){
  const has = (cfg.order && cfg.order.length) || (cfg.overrides && Object.keys(cfg.overrides).length)
  if (has) return cfg
  // minimal fallbacks
  if (resourceKey === 'investments') return { order:['name','symbol','quantity','buy_price','currency','date','category'], overrides:{ quantity:{type:'number'}, buy_price:{type:'number'}, currency:{type:'text'}, date:{type:'date'}, category:{type:'text'} }, template:{ name:'', symbol:'', quantity:0, buy_price:0, currency:'INR', date:'', category:'Stocks' }, readOnly:new Set() }
  if (resourceKey === 'income') return { order:['title','amount','currency','date','notes'], overrides:{ amount:{type:'number'}, currency:{type:'text'}, date:{type:'date'} }, template:{ title:'', amount:0, currency:'INR', date:'', notes:'' }, readOnly:new Set() }
  if (resourceKey === 'expenses') return { order:['title','category','amount','currency','date','notes'], overrides:{ amount:{type:'number'}, currency:{type:'text'}, date:{type:'date'} }, template:{ title:'', category:'', amount:0, currency:'INR', date:'', notes:'' }, readOnly:new Set() }
  if (resourceKey === 'assets') return { order:['name','type','value','currency','notes'], overrides:{ value:{type:'number'}, currency:{type:'text'} }, template:{ name:'', type:'', value:0, currency:'INR', notes:'' }, readOnly:new Set() }
  if (resourceKey === 'liabilities') return { order:['title','amount','currency','start_date','interest_rate','monthly_payment','notes'], overrides:{ amount:{type:'number'}, currency:{type:'text'}, start_date:{type:'date'}, interest_rate:{type:'number'}, monthly_payment:{type:'number'} }, template:{ title:'', amount:0, currency:'INR', start_date:'', interest_rate:0, monthly_payment:0, notes:'' }, readOnly:new Set() }
  return cfg
}

function coerceTypes(obj, cfg){
  const out = {}
  const overrides = cfg?.overrides || {}
  Object.keys(obj || {}).forEach(k => {
    const meta = overrides[k] || {}
    const v = obj[k]
    if (meta.type === 'number') {
      const n = Number(v)
      out[k] = Number.isFinite(n) ? n : 0
    } else if (meta.type === 'checkbox') {
      const s = String(v).toLowerCase()
      out[k] = (s === 'true' || s === '1' || s === 'yes')
    } else {
      out[k] = v
    }
  })
  return out
}
