import React from 'react'

export default function DataTable({ data = [], title = 'Items' }) {
  if (!Array.isArray(data)) return null
  const rows = data
  const columns = rows.length ? Object.keys(rows[0]) : []
  return (
    <div className="card">
      <div className="card-header"><strong>{title}</strong></div>
      <div className="card-body">
        {rows.length === 0 ? (
          <div className="text-muted">No data</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c}>{formatValue(r[c])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function formatValue(val) {
  if (val === null || val === undefined) return ''
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

