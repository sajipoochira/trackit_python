import React from 'react'
import { initRates, getPreferredCurrency, setPreferredCurrency, convert, getRates, subscribe } from '../ratesStore.js'

// Backward-compatible provider that ensures rates are initialized
export function RatesProvider({ children }) {
  React.useEffect(() => { initRates() }, [])
  return children
}

// Non-hook accessor to avoid invalid hook calls; returns latest store snapshot
export function useRates() {
  return {
    ...getRates(),
    preferredCurrency: getPreferredCurrency(),
    setPreferredCurrency,
    convert
  }
}
