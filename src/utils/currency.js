// src/utils/currency.js

export async function fetchRatesFromKGS() {
  // Free API, no key needed
  const res = await fetch('https://open.er-api.com/v6/latest/KGS')
  const data = await res.json()
  if (!data.rates) throw new Error('No rates returned')

  // API returns "how many X per 1 KGS"
  // We want "how many KGS per 1 X" (price of foreign currency in soms)
  return {
    USD: +(1 / data.rates.USD).toFixed(2),
    RUB: +(1 / data.rates.RUB).toFixed(4),
    KZT: +(1 / data.rates.KZT).toFixed(4),
    UZS: +(1 / data.rates.UZS).toFixed(6),
  }
}

// Rates object always stores: "how many KGS per 1 unit of currency"
// Example: rates.USD = 88.5 means 1 USD = 88.5 KGS

// Convert any amount to KGS
function toKGS(amount, currency, rates) {
  if (currency === 'KGS') return amount
  const rate = rates[currency]
  if (!rate) return amount
  return amount * rate
}

// Convert any amount to the user's base currency
// baseCurrency can be KGS, USD, RUB, KZT, UZS
export function toBase(amount, fromCurrency, baseCurrency, rates) {
  if (fromCurrency === baseCurrency) return amount
  // Step 1: convert to KGS
  const inKGS = toKGS(amount, fromCurrency, rates)
  // Step 2: convert KGS → baseCurrency
  if (baseCurrency === 'KGS') return inKGS
  const baseRate = rates[baseCurrency] // KGS per 1 unit of baseCurrency
  if (!baseRate) return inKGS
  return inKGS / baseRate
}

export const RATE_DISPLAY = [
  { sym: '$',    code: 'USD', label: 'USD' },
  { sym: '₽',    code: 'RUB', label: 'RUB' },
  { sym: '₸',    code: 'KZT', label: 'KZT' },
  { sym: 'сўм',  code: 'UZS', label: 'UZS' },
]