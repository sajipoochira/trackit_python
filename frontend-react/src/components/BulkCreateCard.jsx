import React from 'react'

export default function BulkCreateCard({ title = 'Bulk Create', text, setText, onSubmit, onCancel, help, mode = 'json', setMode, parseItems, enableUpload = true }) {
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState('')
  const [report, setReport] = React.useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setReport(null)
    let items
    try {
      if (typeof parseItems === 'function') {
        items = parseItems(text)
      } else {
        const parsed = JSON.parse(text || '[]')
        items = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])
      }
    } catch (e) { setError((e?.message) || 'Could not parse input'); return }
    if (!items.length) {
      setError('No items found in the input')
      return
    }
    setSubmitting(true)
    const results = { success: 0, failed: 0, errors: [] }
    for (let i = 0; i < items.length; i++) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await onSubmit(items[i], i)
        results.success += 1
      } catch (err) {
        results.failed += 1
        results.errors.push({ index: i, message: err?.message || 'Failed' })
      }
    }
    setReport(results)
    setSubmitting(false)
  }

  return (
    <div className="card mb-3">
      <div className="card-header"><strong>{title}</strong></div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        {help && <div className="alert alert-info"><small>{help}</small></div>}
        <form onSubmit={handleSubmit}>
          {setMode && (
            <div className="mb-2">
              <label className="form-label me-2">Input type:</label>
              <select className="form-select" style={{maxWidth:200, display:'inline-block'}} value={mode} onChange={(e)=>setMode(e.target.value)}>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          )}
          <div className="mb-3">
            <label className="form-label">{mode === 'csv' ? 'CSV rows (first row headers)' : 'JSON array of items'}</label>
            <textarea className="form-control" rows={10} value={text} onChange={(e)=>setText(e.target.value)} />
            <div className="form-text">
              {mode === 'csv' ? 'Paste CSV with header row' : 'Paste a JSON array like [ {...}, {...} ]'}
            </div>
          </div>
          {enableUpload && (
            <div className="mb-3">
              <label className="form-label">Or upload a CSV file</label>
              <input type="file" accept=".csv,text/csv" className="form-control" onChange={(e)=>{
                const file = e.target.files && e.target.files[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => { setText(String(reader.result || '')); if (setMode) setMode('csv') }
                reader.readAsText(file)
              }} />
            </div>
          )}
          <div className="d-flex gap-2">
            <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Uploading...' : 'Create All'}</button>
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
          </div>
        </form>
        {report && (
          <div className="mt-3">
            <div className="alert alert-secondary">
              <div>Created: {report.success}</div>
              <div>Failed: {report.failed}</div>
            </div>
            {report.errors.length > 0 && (
              <div className="alert alert-warning">
                <div className="mb-2"><strong>Errors</strong></div>
                <ul className="mb-0">
                  {report.errors.map((e, idx)=> (
                    <li key={idx}>Row {e.index + 1}: {e.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
