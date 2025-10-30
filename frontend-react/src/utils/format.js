export function currencySymbol(code) {
  const map = { INR: '₹', QAR: 'ر.ق' }
  return map[code] || code || ''
}

export function formatNumber(n, fractionDigits) {
  const num = Number(n)
  if (!Number.isFinite(num)) return String(n ?? '')
  const isInt = Number.isInteger(num)
  const minFrac = fractionDigits !== undefined ? fractionDigits : (isInt ? 0 : 2)
  const maxFrac = fractionDigits !== undefined ? fractionDigits : 2
  return num.toLocaleString(undefined, { minimumFractionDigits: minFrac, maximumFractionDigits: maxFrac })
}

export function formatDate(value) {
  if (!value) return ''
  try {
    // Handle YYYY-MM-DD or ISO
    const d = new Date(value)
    if (isNaN(d.getTime())) return String(value)
    return d.toLocaleDateString()
  } catch {
    return String(value)
  }
}

export function formatCurrency(amount, code) {
  const sym = currencySymbol(code)
  const n = formatNumber(amount)
  if (!sym) return n
  // Place symbol before for known ones
  return `${sym}${n}`
}

export function formatCellValue(item, key, cfg, opts = {}) {
  const val = item?.[key]
  if (val === null || val === undefined) return ''
  const type = cfg?.overrides?.[key]?.type

  if (type === 'date') return formatDate(val)
  if (type === 'number') {
    // Pair with currency if available and field looks monetary
    if (['amount','value','buy_price','allocated_amount'].includes(key)) {
      const code = item?.currency
      const primary = formatCurrency(val, code)
      const { preferredCurrency, convert } = opts
      const pref = preferredCurrency
      if (pref && convert && code && code !== pref) {
        const converted = convert(val, code, pref)
        if (Number.isFinite(converted)) {
          const secondary = formatCurrency(converted, pref)
          return `${primary} (≈ ${secondary})`
        }
      }
      return primary
    }
    return formatNumber(val)
  }
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
