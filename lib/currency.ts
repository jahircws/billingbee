const CURRENCY_CONFIG: Record<string, { symbol: string; locale: string }> = {
  INR: { symbol: "₹", locale: "en-IN" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "de-DE" },
  GBP: { symbol: "£", locale: "en-GB" },
  AED: { symbol: "AED ", locale: "ar-AE" },
  SGD: { symbol: "S$", locale: "en-SG" },
  AUD: { symbol: "A$", locale: "en-AU" },
  CAD: { symbol: "CA$", locale: "en-CA" },
}

export function fmtCurrency(amount: number | string | unknown, currency = "INR"): string {
  const n = Number(amount)
  const cfg = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.INR
  return `${cfg.symbol}${n.toLocaleString(cfg.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtCurrencyShort(amount: number | string | unknown, currency = "INR"): string {
  const n = Number(amount)
  const cfg = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.INR
  return `${cfg.symbol}${n.toLocaleString(cfg.locale)}`
}

export function getCurrencySymbol(currency = "INR"): string {
  return (CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.INR).symbol
}
