// Simple CSV parser and stringifier supporting quoted values and commas

export function parseCSV(text) {
  if (!text || !text.trim()) return []
  const rows = []
  let i = 0, cur = '', inQuotes = false, row = []
  const pushCell = () => { row.push(cur); cur = '' }
  const pushRow = () => { if (row.length) rows.push(row); row = [] }
  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i += 1 } else { inQuotes = false }
      } else { cur += ch }
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') pushCell()
      else if (ch === '\n') { pushCell(); pushRow() }
      else if (ch === '\r') { /* ignore */ }
      else cur += ch
    }
    i += 1
  }
  pushCell(); pushRow()
  // Remove empty trailing rows
  const nonEmpty = rows.filter(r => r.some(c => (c ?? '').toString().trim() !== ''))
  if (nonEmpty.length === 0) return []
  const headers = nonEmpty[0].map(h => (h || '').trim())
  const dataRows = nonEmpty.slice(1)
  return dataRows.map(r => {
    const obj = {}
    headers.forEach((h, idx) => { if (h) obj[h] = (r[idx] ?? '').trim() })
    return obj
  })
}

export function toCSV(headers, rows) {
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
    return s
  }
  const lines = []
  lines.push(headers.map(esc).join(','))
  rows.forEach(r => { lines.push(headers.map(h => esc(r[h])).join(',')) })
  return lines.join('\n')
}

