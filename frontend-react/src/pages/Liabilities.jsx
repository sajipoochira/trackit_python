import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import DynamicForm from '../components/DynamicForm.jsx'
import { getFormConfig } from '../utils/schema.js'
import { formatCellValue } from '../utils/format.js'
import { useRates } from '../context/RatesContext.jsx'
import BulkCreateCard from '../components/BulkCreateCard.jsx'
import { parseCSV } from '../utils/csv.js'
import { coerceTypesWithOverrides } from '../utils/bulk.js'

export default function Liabilities() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const [formValues, setFormValues] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [formConfig, setFormConfig] = useState({ overrides: {}, order: [], template: {}, readOnly: new Set() })

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await api.getLiabilities()
      setItems(Array.isArray(data) ? data : (data?.results || []))
    } catch (e) {
      setError(e?.message || 'Failed to load liabilities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { (async () => { setFormConfig(await getFormConfig('/liabilities/')); await load() })() }, [])

  const useConfig = React.useMemo(()=>pickLiabilityConfig(formConfig), [formConfig])
  const columns = React.useMemo(()=>getColumns(items, useConfig), [items, useConfig])
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkMode, setBulkMode] = useState('json')

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
    if (!confirm('Delete this liability?')) return
    try { await api.deleteLiability(id); await load() } catch (e) { alert(e?.message || 'Delete failed') }
  }

  async function handleSubmit(payload) {
    if (formMode==='create') await api.createLiability(payload)
    else if (formMode==='edit' && editingId) await api.updateLiability(editingId, payload)
    setFormOpen(false)
    await load()
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">Liabilities</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={openCreate}>New Liability</button>
          <button className="btn btn-outline-secondary" onClick={openBulk}>Bulk Add</button>
          <button className="btn btn-outline-primary" onClick={load} disabled={loading}>Refresh</button>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}

      {formOpen && (
        <DynamicForm
          title={`${formMode==='create'?'Create':'Edit'} Liability`}
          initialValues={formValues || {}}
          overrides={useConfig.overrides}
          order={useConfig.order}
          onSubmit={handleSubmit}
          onCancel={()=>setFormOpen(false)}
        />
      )}

      {bulkOpen && (
        <BulkCreateCard
          title="Bulk Create Liabilities"
          text={bulkText}
          setText={setBulkText}
          onSubmit={async (item)=>{ await api.createLiability(item) }}
          onCancel={()=> setBulkOpen(false)}
          help="Paste a JSON array or CSV with header row."
          mode={bulkMode}
          setMode={setBulkMode}
          parseItems={parseItems}
        />
      )}

      <div className="card">
        <div className="card-header"><strong>Liability List</strong></div>
        <div className="card-body">
          {!items.length ? <div className="text-muted">No data</div> : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead><tr>{columns.map(c=> <th key={c.key}>{c.label}</th>)}<th>Actions</th></tr></thead>
                <tbody>
                  {items.map((item, idx)=> (
                    <tr key={idx}>
                      {columns.map(c=> <td key={c.key}>{formatCellValue(item, c.key, useConfig, { preferredCurrency, convert })}</td>)}
                      <td>
                        <div className="btn-group btn-group-sm">
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
      title: '',
      amount: 0,
      currency: 'INR',
      start_date: '',
      interest_rate: 0,
      monthly_payment: 0,
      notes: ''
    })
  }
  return out
}

function pickLiabilityConfig(config){
  if ((config.order && config.order.length) || (config.overrides && Object.keys(config.overrides).length)) return config
  return {
    order: ['title','amount','currency','start_date','interest_rate','monthly_payment','notes'],
    overrides: {
      title: { type: 'text', required: true, label: 'Liability Title' },
      amount: { type: 'number', required: true, step: 0.01, min: 0 },
      currency: { type: 'select', options: ['INR','QAR'], required: true },
      start_date: { type: 'date', required: true },
      interest_rate: { type: 'number', required: false, step: 0.01, min: 0 },
      monthly_payment: { type: 'number', required: false, step: 0.01, min: 0 },
      notes: { type: 'text', required: false }
    },
    template: { title: '', amount: 0, currency: 'INR', start_date: '', interest_rate: 0, monthly_payment: 0, notes: '' },
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
  const { preferredCurrency, convert } = useRates() || {}
