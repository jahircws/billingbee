const CURRENCY_CONFIG: Record<string, { symbol: string; locale: string }> = {
  // South Asia
  INR: { symbol: "₹", locale: "en-IN" },
  PKR: { symbol: "Rs ", locale: "en-PK" },
  BDT: { symbol: "৳", locale: "bn-BD" },
  LKR: { symbol: "Rs ", locale: "en-LK" },
  NPR: { symbol: "Rs ", locale: "en-NP" },
  MVR: { symbol: "Rf ", locale: "en-MV" },
  // North America
  USD: { symbol: "$", locale: "en-US" },
  CAD: { symbol: "CA$", locale: "en-CA" },
  MXN: { symbol: "MX$", locale: "es-MX" },
  // Europe
  EUR: { symbol: "€", locale: "de-DE" },
  GBP: { symbol: "£", locale: "en-GB" },
  CHF: { symbol: "CHF ", locale: "de-CH" },
  SEK: { symbol: "kr ", locale: "sv-SE" },
  NOK: { symbol: "kr ", locale: "nb-NO" },
  DKK: { symbol: "kr ", locale: "da-DK" },
  PLN: { symbol: "zł ", locale: "pl-PL" },
  CZK: { symbol: "Kč ", locale: "cs-CZ" },
  HUF: { symbol: "Ft ", locale: "hu-HU" },
  RON: { symbol: "lei ", locale: "ro-RO" },
  BGN: { symbol: "лв ", locale: "bg-BG" },
  ISK: { symbol: "kr ", locale: "is-IS" },
  UAH: { symbol: "₴", locale: "uk-UA" },
  RSD: { symbol: "din ", locale: "sr-RS" },
  BAM: { symbol: "KM ", locale: "bs-BA" },
  MKD: { symbol: "ден ", locale: "mk-MK" },
  MDL: { symbol: "L ", locale: "ro-MD" },
  // East Asia
  JPY: { symbol: "¥", locale: "ja-JP" },
  CNY: { symbol: "¥", locale: "zh-CN" },
  KRW: { symbol: "₩", locale: "ko-KR" },
  TWD: { symbol: "NT$", locale: "zh-TW" },
  HKD: { symbol: "HK$", locale: "zh-HK" },
  MNT: { symbol: "₮", locale: "mn-MN" },
  // Southeast Asia
  SGD: { symbol: "S$", locale: "en-SG" },
  MYR: { symbol: "RM ", locale: "ms-MY" },
  THB: { symbol: "฿", locale: "th-TH" },
  PHP: { symbol: "₱", locale: "en-PH" },
  IDR: { symbol: "Rp ", locale: "id-ID" },
  VND: { symbol: "₫", locale: "vi-VN" },
  KHR: { symbol: "៛", locale: "km-KH" },
  BND: { symbol: "B$", locale: "ms-BN" },
  MOP: { symbol: "P ", locale: "zh-MO" },
  LAK: { symbol: "₭", locale: "lo-LA" },
  // Central Asia
  KZT: { symbol: "₸", locale: "kk-KZ" },
  UZS: { symbol: "so'm ", locale: "uz-UZ" },
  AZN: { symbol: "₼", locale: "az-AZ" },
  GEL: { symbol: "₾", locale: "ka-GE" },
  AMD: { symbol: "֏", locale: "hy-AM" },
  KGS: { symbol: "с ", locale: "ky-KG" },
  TJS: { symbol: "SM ", locale: "tg-TJ" },
  TMT: { symbol: "T ", locale: "tk-TM" },
  // Middle East & North Africa
  AED: { symbol: "AED ", locale: "ar-AE" },
  SAR: { symbol: "SR ", locale: "ar-SA" },
  QAR: { symbol: "QR ", locale: "ar-QA" },
  KWD: { symbol: "KD ", locale: "ar-KW" },
  BHD: { symbol: "BD ", locale: "ar-BH" },
  OMR: { symbol: "OMR ", locale: "ar-OM" },
  JOD: { symbol: "JD ", locale: "ar-JO" },
  ILS: { symbol: "₪", locale: "he-IL" },
  IQD: { symbol: "IQD ", locale: "ar-IQ" },
  EGP: { symbol: "E£", locale: "ar-EG" },
  MAD: { symbol: "MAD ", locale: "ar-MA" },
  TND: { symbol: "DT ", locale: "ar-TN" },
  DZD: { symbol: "DA ", locale: "ar-DZ" },
  // Sub-Saharan Africa
  ZAR: { symbol: "R ", locale: "en-ZA" },
  NGN: { symbol: "₦", locale: "en-NG" },
  KES: { symbol: "KSh ", locale: "en-KE" },
  GHS: { symbol: "GH₵", locale: "en-GH" },
  ETB: { symbol: "Br ", locale: "am-ET" },
  TZS: { symbol: "TSh ", locale: "en-TZ" },
  UGX: { symbol: "USh ", locale: "en-UG" },
  RWF: { symbol: "RF ", locale: "rw-RW" },
  MUR: { symbol: "Rs ", locale: "en-MU" },
  XAF: { symbol: "FCFA ", locale: "fr-CM" },
  XOF: { symbol: "CFA ", locale: "fr-SN" },
  ZMW: { symbol: "ZK ", locale: "en-ZM" },
  BWP: { symbol: "P ", locale: "en-BW" },
  SCR: { symbol: "Rs ", locale: "en-SC" },
  MZN: { symbol: "MT ", locale: "pt-MZ" },
  AOA: { symbol: "Kz ", locale: "pt-AO" },
  MGA: { symbol: "Ar ", locale: "mg-MG" },
  CDF: { symbol: "FC ", locale: "fr-CD" },
  MWK: { symbol: "MK ", locale: "en-MW" },
  CVE: { symbol: "Esc ", locale: "pt-CV" },
  // Latin America
  BRL: { symbol: "R$", locale: "pt-BR" },
  ARS: { symbol: "AR$", locale: "es-AR" },
  CLP: { symbol: "CL$", locale: "es-CL" },
  COP: { symbol: "CO$", locale: "es-CO" },
  PEN: { symbol: "S/.", locale: "es-PE" },
  UYU: { symbol: "$U ", locale: "es-UY" },
  BOB: { symbol: "Bs.", locale: "es-BO" },
  GTQ: { symbol: "Q ", locale: "es-GT" },
  HNL: { symbol: "L ", locale: "es-HN" },
  DOP: { symbol: "RD$", locale: "es-DO" },
  TTD: { symbol: "TT$", locale: "en-TT" },
  JMD: { symbol: "J$", locale: "en-JM" },
  CRC: { symbol: "₡", locale: "es-CR" },
  PYG: { symbol: "Gs.", locale: "es-PY" },
  NIO: { symbol: "C$", locale: "es-NI" },
  GYD: { symbol: "G$", locale: "en-GY" },
  SRD: { symbol: "Sr$", locale: "nl-SR" },
  // Pacific
  AUD: { symbol: "A$", locale: "en-AU" },
  NZD: { symbol: "NZ$", locale: "en-NZ" },
  FJD: { symbol: "FJ$", locale: "en-FJ" },
  PGK: { symbol: "K ", locale: "en-PG" },
  XPF: { symbol: "F ", locale: "fr-PF" },
  // Caribbean
  XCD: { symbol: "EC$", locale: "en-AG" },
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
