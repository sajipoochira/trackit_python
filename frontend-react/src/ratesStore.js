let rates = {}
let base = 'QAR'
let preferredCurrency = 'QAR'
const listeners = new Set()

const API = import.meta?.env?.VITE_RATES_API || 'https://api.exchangerate.fun/latest?base=QAR'

export async function initRates() {
  try {
    const res = await fetch(API)
    if (!res.ok) throw new Error('Failed to fetch rates')
    const data = await res.json()
    base = data.base || 'QAR'
    rates = data.rates || {}
    notify()
  } catch (e) {
    // swallow for now
  }
}

export function getPreferredCurrency() { return preferredCurrency }
export function setPreferredCurrency(c) { preferredCurrency = (c || 'QAR').toUpperCase(); notify() }
export function getRates() { return { rates, base } }

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function notify(){ listeners.forEach(fn => { try { fn() } catch(_){} }) }

export function convert(amount, from, to){
  const a = Number(amount)
  if (!Number.isFinite(a)) return NaN
  const src = (from || base || 'QAR').toUpperCase()
  const dst = (to || base || 'QAR').toUpperCase()
  if (src === dst) return a
  let inBase
  if (src === base) inBase = a
  else {
    const r = rates[src]
    if (!r) return NaN
    inBase = a / r
  }
  if (dst === base) return inBase
  const rd = rates[dst]
  if (!rd) return NaN
  return inBase * rd
}

