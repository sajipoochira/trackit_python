import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import DynamicForm from '../components/DynamicForm.jsx'
import { getFormConfig } from '../utils/schema.js'
import { formatCellValue } from '../utils/format.js'
import { useRates } from '../context/RatesContext.jsx'

export default function Assets() {
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
      const data = await api.getAssets()
      setItems(Array.isArray(data) ? data : (data?.results || []))
    } catch (e) {
      setError(e?.message || 'Failed to load assets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { (async () => { setFormConfig(await getFormConfig('/assets/')); await load() })() }, [])

  const useConfig = useMemo(()=>pickAssetConfig(formConfig), [formConfig])
  const columns = useMemo(()=>getColumns(items, useConfig), [items, useConfig])

  // removed duplicate fallback columns declaration

  function openCreate() {
    setFormMode('create')
    setEditingId(null)
    const template = Object.keys(useConfig.template || {}).length ? useConfig.template : seedTemplate(items[0])
    setFormValues(template)
    setFormOpen(true)
  }

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
    if (!confirm('Delete this asset?')) return
    try { await api.deleteAsset(id); await load() } catch (e) { alert(e?.message || 'Delete failed') }
  }

  async function handleSubmit(payload) {
    if (formMode==='create') await api.createAsset(payload)
    else if (formMode==='edit' && editingId) await api.updateAsset(editingId, payload)
    setFormOpen(false)
    await load()
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">Assets</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={openCreate}>New Asset</button>
          <button className="btn btn-outline-primary" onClick={load} disabled={loading}>Refresh</button>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}

      {formOpen && (
        <DynamicForm
          title={`${formMode==='create'?'Create':'Edit'} Asset`}
          initialValues={formValues || {}}
          overrides={useConfig.overrides}
          order={useConfig.order}
          onSubmit={handleSubmit}
          onCancel={()=>setFormOpen(false)}
        />
      )}

      <div className="card">
        <div className="card-header"><strong>Asset List</strong></div>
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

function pickAssetConfig(config){
  // Use backend schema if present
  if ((config.order && config.order.length) || (config.overrides && Object.keys(config.overrides).length)) return config
  // Fallback to a sensible Assets schema
  return {
    order: ['name','type','value','currency','notes'],
    overrides: {
      name: { type: 'text', required: true, label: 'Asset Name', minLength: 1 },
      type: { type: 'select', required: true, options: ['property','vehicle','jewelry','electronics','furniture','bank_account','other'], label: 'Asset Type' },
      value: { type: 'number', required: true, step: 0.01, min: 0, label: 'Current Value' },
      currency: { type: 'select', options: ['INR','QAR'], required: true },
      notes: { type: 'text', required: false }
    },
    template: { name: '', type: '', value: 0, currency: 'INR', notes: '' },
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

function seedTemplate(sample) {
  const ro = new Set(['id','pk','owner','user','created_at','updated_at'])
  const out = {}
  if (sample) {
    Object.keys(sample).forEach(k => { if (!ro.has(k)) out[k] = sample[k] ?? '' })
  } else {
    Object.assign(out, {
      name: '',
      type: '',
      value: 0,
      currency: 'INR',
      notes: ''
    })
  }
  return out
}
  const { preferredCurrency, convert } = useRates() || {}
