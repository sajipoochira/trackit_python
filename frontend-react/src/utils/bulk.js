export function coerceTypesWithOverrides(obj, overrides = {}) {
  const out = {}
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

