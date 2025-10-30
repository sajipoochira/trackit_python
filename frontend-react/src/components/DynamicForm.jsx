import React, { useMemo, useState } from 'react'

const READ_ONLY_KEYS = new Set(['id','pk','owner','user','created_at','updated_at'])

export default function DynamicForm({ initialValues = {}, onSubmit, onCancel, title = 'Edit Item', overrides = {}, order = [] }) {
  const [values, setValues] = useState(() => ({ ...initialValues }))
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const baseFields = useMemo(() => inferFields(values), [values])
  const merged = useMemo(() => applyOverrides(baseFields, overrides), [baseFields, overrides])
  const fields = useMemo(() => {
    if (order && order.length) {
      const by = Object.fromEntries(merged.map(f => [f.name, f]))
      const list = []
      order.forEach(name => { if (by[name]) list.push(by[name]) })
      // add any that weren't in order at the end
      merged.forEach(f => { if (!order.includes(f.name)) list.push(f) })
      return list
    }
    return merged
  }, [merged, order])

  const handleChange = (name, val, type) => {
    if (type === 'number') {
      // Allow empty string to avoid coercion issues while typing
      setValues(v => ({ ...v, [name]: val }))
      return
    }
    if (type === 'checkbox') {
      setValues(v => ({ ...v, [name]: !!val }))
      return
    }
    setValues(v => ({ ...v, [name]: val }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    // client-side validation
    const { ok, errors } = validate(values, fields)
    if (!ok) {
      setFieldErrors(errors)
      setError('Please correct the highlighted fields.')
      return
    }
    try {
      const payload = coercePayload(values, fields)
      await onSubmit(payload)
    } catch (err) {
      // Map DRF-style error object to field errors when available
      if (err && err.errors && typeof err.errors === 'object') {
        const fe = {}
        for (const [k, v] of Object.entries(err.errors)) {
          if (k === 'non_field_errors') {
            // accumulate at top-level message
            const msg = Array.isArray(v) ? v.join('\n') : String(v)
            setError(msg)
          } else {
            fe[k] = Array.isArray(v) ? v.join('\n') : String(v)
          }
        }
        setFieldErrors(fe)
        if (!('non_field_errors' in (err.errors || {}))) {
          setError(err.message || 'Save failed')
        }
      } else {
        setError(err?.message || 'Save failed')
      }
    }
  }

  return (
    <div className="card mb-3">
      <div className="card-header"><strong>{title}</strong></div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          <div className="row g-3">
            {fields.map(f => (
              <div className={"col-md-" + (f.type === 'textarea' ? '12' : '6')} key={f.name}>
                <label className="form-label">{f.label || labelize(f.name)}{f.required ? ' *' : ''}</label>
                {renderInput(f, values[f.name], (val) => handleChange(f.name, val, f.type), fieldErrors[f.name])}
                {fieldErrors[f.name] ? (
                  <div className="text-danger small mt-1">{fieldErrors[f.name]}</div>
                ) : (f.helpText ? <div className="form-text">{f.helpText}</div> : null)}
              </div>
            ))}
          </div>
          <div className="d-flex gap-2 mt-3">
            <button type="submit" className="btn btn-primary">Save</button>
            {onCancel && <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  )
}

function inferFields(values) {
  const keys = Object.keys(values).filter(k => !READ_ONLY_KEYS.has(k))
  const fields = keys.map((k) => {
    const v = values[k]
    const lower = k.toLowerCase()
    // Type inference by key and current value
    if (typeof v === 'boolean' || lower.startsWith('is_')) {
      return { name: k, type: 'checkbox' }
    }
    if (lower.includes('date')) {
      return { name: k, type: 'date' }
    }
    if (lower.includes('currency')) {
      return { name: k, type: 'select', options: ['INR','QAR'] }
    }
    if (lower.includes('amount') || lower.includes('value') || lower.includes('price') || lower.includes('quantity') || lower.includes('shares')) {
      return { name: k, type: 'number', step: 0.01 }
    }
    if (typeof v === 'number') {
      return { name: k, type: 'number', step: 1 }
    }
    if (typeof v === 'object') {
      return { name: k, type: 'textarea' }
    }
    return { name: k, type: 'text' }
  })
  return fields
}

function applyOverrides(fields, overrides) {
  if (!overrides || typeof overrides !== 'object') return fields
  const byName = Object.fromEntries(fields.map(f => [f.name, f]))
  Object.entries(overrides).forEach(([name, cfg]) => {
    if (byName[name]) {
      byName[name] = { ...byName[name], ...cfg, name }
    } else {
      // add a new field if it wasn't inferred
      byName[name] = { name, ...(cfg || {}) }
    }
  })
  return Object.values(byName)
}

function validate(values, fields) {
  const errors = {}
  for (const f of fields) {
    const val = values[f.name]
    const isEmpty = val === null || val === undefined || (typeof val === 'string' && val.trim() === '')
    if (f.required && isEmpty) {
      errors[f.name] = 'This field is required.'
      continue
    }
    if (isEmpty) continue
    if (f.type === 'number') {
      const n = Number(val)
      if (Number.isNaN(n)) { errors[f.name] = 'Must be a number.'; continue }
      if (f.min !== undefined && n < f.min) { errors[f.name] = `Must be ≥ ${f.min}.`; continue }
      if (f.max !== undefined && n > f.max) { errors[f.name] = `Must be ≤ ${f.max}.`; continue }
    } else if (f.type === 'text') {
      if (f.minLength !== undefined && String(val).length < f.minLength) { errors[f.name] = `Must be at least ${f.minLength} characters.`; continue }
      if (f.maxLength !== undefined && String(val).length > f.maxLength) { errors[f.name] = `Must be at most ${f.maxLength} characters.`; continue }
      if (f.pattern) {
        try {
          const re = new RegExp(f.pattern)
          if (!re.test(String(val))) errors[f.name] = 'Invalid format.'
        } catch (_) {}
      }
    } else if (f.type === 'select') {
      if (Array.isArray(f.options) && f.options.length && !f.options.includes(val)) {
        errors[f.name] = 'Invalid option.'
      }
    } else if (f.type === 'textarea') {
      // if override says textarea for JSON, ensure it is valid JSON when provided as string
      if (typeof val === 'string') {
        try { JSON.parse(val) } catch { errors[f.name] = 'Must be valid JSON.' }
      }
    }
  }
  return { ok: Object.keys(errors).length === 0, errors }
}

function coercePayload(values, fields) {
  const payload = {}
  for (const f of fields) {
    let val = values[f.name]
    if (f.type === 'number') {
      if (val === '' || val === null || val === undefined) { payload[f.name] = null; continue }
      const n = Number(val)
      if (Number.isNaN(n)) throw new Error(`Field ${f.name} must be a number`)
      payload[f.name] = n
      continue
    }
    if (f.type === 'checkbox') {
      payload[f.name] = !!val
      continue
    }
    if (f.type === 'date') {
      // expect yyyy-mm-dd
      payload[f.name] = val
      continue
    }
    if (f.type === 'textarea') {
      try {
        payload[f.name] = typeof val === 'string' ? JSON.parse(val) : val
      } catch (e) {
        throw new Error(`Field ${f.name} must be valid JSON`)
      }
      continue
    }
    payload[f.name] = val
  }
  return payload
}

function renderInput(field, value, onChange, errorMsg) {
  if (field.type === 'checkbox') {
    return (
      <div className="form-check">
        <input className="form-check-input" type="checkbox" checked={!!value} onChange={e=>onChange(e.target.checked)} />
      </div>
    )
  }
  if (field.type === 'date') {
    const formatted = value ? formatDateValue(value) : ''
    return <input type="date" className={`form-control${errorMsg? ' is-invalid':''}`} value={formatted} onChange={e=>onChange(e.target.value)} />
  }
  if (field.type === 'number') {
    const props = {}
    if (field.min !== undefined) props.min = field.min
    if (field.max !== undefined) props.max = field.max
    return <input type="number" step={field.step || 1} {...props} className={`form-control${errorMsg? ' is-invalid':''}`} value={value ?? ''} onChange={e=>onChange(e.target.value)} />
  }
  if (field.type === 'select') {
    return (
      <select className={`form-select${errorMsg? ' is-invalid':''}`} value={value ?? ''} onChange={e=>onChange(e.target.value)}>
        <option value="">Select...</option>
        {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    )
  }
  if (field.type === 'textarea') {
    const text = typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)
    return <textarea className={`form-control${errorMsg? ' is-invalid':''}`} rows={6} value={text} onChange={e=>onChange(e.target.value)} />
  }
  const textProps = {}
  if (field.minLength !== undefined) textProps.minLength = field.minLength
  if (field.maxLength !== undefined) textProps.maxLength = field.maxLength
  if (field.pattern) textProps.pattern = field.pattern
  return <input type="text" {...textProps} className={`form-control${errorMsg? ' is-invalid':''}`} value={value ?? ''} onChange={e=>onChange(e.target.value)} />
}

function labelize(name) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (m)=>m.toUpperCase())
}

function formatDateValue(val) {
  // If already yyyy-mm-dd, return as is; otherwise try to parse
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val
  try {
    const d = new Date(val)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth()+1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  } catch {
    return ''
  }
}
