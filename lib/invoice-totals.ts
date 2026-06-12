// Single source of truth for invoice/quote totals so the live form preview,
// the server-side persistence, and the PDF can never drift.
//
// Order of operations (GST-correct): per-line discount reduces the line first,
// then the invoice-level discount is allocated across lines proportionally to
// each line's net amount and subtracted from the TAXABLE BASE — tax is computed
// on the post-discount amount, not the original product amount.

export interface TotalsItem {
  quantity: number
  unitPrice: number
  taxRate?: number
  taxType?: string // "FIXED" | "PERCENTAGE"
  discount?: number // per-line discount, percent (ignored for FIXED tax lines)
}

export interface ComputedLine {
  taxableBase: number
  taxAmount: number
  total: number
}

export interface InvoiceTotals {
  lines: ComputedLine[]
  subtotal: number // gross Σ (qty × unitPrice)
  netSubtotal: number // after per-line discounts, before invoice discount
  taxAmount: number
  discountAmount: number // invoice-level discount actually applied (absolute)
  total: number
}

export function computeInvoiceTotals(items: TotalsItem[], invoiceDiscount = 0): InvoiceTotals {
  const enriched = items.map((i) => {
    const gross = i.quantity * i.unitPrice
    const net = i.taxType === "FIXED" ? gross : gross - gross * ((i.discount ?? 0) / 100)
    return { ...i, gross, net }
  })

  const subtotal = enriched.reduce((s, i) => s + i.gross, 0)
  const netSubtotal = enriched.reduce((s, i) => s + i.net, 0)
  const discountAmount = Math.max(0, Math.min(invoiceDiscount, netSubtotal))

  const lines: ComputedLine[] = enriched.map((i) => {
    const alloc = netSubtotal > 0 ? discountAmount * (i.net / netSubtotal) : 0
    const taxableBase = i.net - alloc
    const taxAmount =
      i.taxType === "FIXED" ? (i.taxRate ?? 0) : taxableBase * ((i.taxRate ?? 0) / 100)
    return { taxableBase, taxAmount, total: taxableBase + taxAmount }
  })

  const taxAmount = lines.reduce((s, l) => s + l.taxAmount, 0)
  const total = lines.reduce((s, l) => s + l.taxableBase, 0) + taxAmount

  return { lines, subtotal, netSubtotal, taxAmount, discountAmount, total }
}
