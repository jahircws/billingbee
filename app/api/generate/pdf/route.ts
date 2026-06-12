import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { fmtCurrency } from "@/lib/currency"
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"
import React from "react"
import path from "path"

// Built-in Helvetica has no glyph for ₹ / € / £, so register DejaVu Sans which
// covers all the currency symbols we format.
Font.register({
  family: "DejaVu",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/DejaVuSans.ttf") },
    { src: path.join(process.cwd(), "public/fonts/DejaVuSans-Bold.ttf"), fontWeight: "bold" },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: "DejaVu",
    fontSize: 10,
    padding: 48,
    backgroundColor: "#ffffff",
    color: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  docTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#059669",
    textAlign: "right",
  },
  docNumber: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 2,
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  label: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 10,
    color: "#111827",
  },
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colRate: { flex: 1, textAlign: "right" },
  colAmt: { flex: 1, textAlign: "right" },
  headerText: { fontSize: 8, color: "#6b7280", fontWeight: "bold" },
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  totalsBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalLabel: { fontSize: 9, color: "#6b7280" },
  totalValue: { fontSize: 9, color: "#111827" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    paddingTop: 6,
    marginTop: 3,
  },
  grandTotalLabel: { fontSize: 11, fontWeight: "bold", color: "#111827" },
  grandTotalValue: { fontSize: 11, fontWeight: "bold", color: "#059669" },
  notes: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.5,
  },
  watermark: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "center",
  },
  watermarkText: {
    fontSize: 8,
    color: "#9ca3af",
  },
})

interface LineItem {
  description: string
  qty: number
  rate: number
}

interface DocumentData {
  documentType: string
  docNumber: string
  fromName: string
  fromEmail?: string
  toName: string
  toEmail?: string
  toCompany?: string
  issueDate: string
  dueDate?: string
  items: LineItem[]
  taxName?: string
  taxRate?: number
  notes?: string
  paymentTerms?: string
  currency?: string
}

function InvoicePDF({ data }: { data: DocumentData }) {
  const subtotal = data.items.reduce((s, i) => s + i.qty * i.rate, 0)
  const taxAmt = data.taxRate ? subtotal * (data.taxRate / 100) : 0
  const total = subtotal + taxAmt
  const fmt = (n: number) => fmtCurrency(n, data.currency || "INR")
  const docLabel = data.documentType.charAt(0).toUpperCase() + data.documentType.slice(1)

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.companyName }, data.fromName),
          data.fromEmail ? React.createElement(Text, { style: { fontSize: 9, color: "#6b7280", marginTop: 2 } }, data.fromEmail) : null
        ),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.docTitle }, docLabel),
          React.createElement(Text, { style: styles.docNumber }, `#${data.docNumber}`)
        )
      ),
      // Bill to / dates
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.label }, "Bill To"),
          React.createElement(Text, { style: styles.value }, data.toName),
          data.toCompany ? React.createElement(Text, { style: { fontSize: 9, color: "#4b5563" } }, data.toCompany) : null,
          data.toEmail ? React.createElement(Text, { style: { fontSize: 9, color: "#4b5563" } }, data.toEmail) : null
        ),
        React.createElement(
          View,
          { style: { alignItems: "flex-end" } },
          React.createElement(Text, { style: styles.label }, "Issue Date"),
          React.createElement(Text, { style: styles.value }, data.issueDate),
          data.dueDate ? React.createElement(Text, { style: { ...styles.label, marginTop: 8 } }, "Due Date") : null,
          data.dueDate ? React.createElement(Text, { style: styles.value }, data.dueDate) : null
        )
      ),
      // Table header
      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: { ...styles.headerText, flex: 3 } }, "Description"),
          React.createElement(Text, { style: { ...styles.headerText, flex: 1, textAlign: "center" } }, "Qty"),
          React.createElement(Text, { style: { ...styles.headerText, flex: 1, textAlign: "right" } }, "Rate"),
          React.createElement(Text, { style: { ...styles.headerText, flex: 1, textAlign: "right" } }, "Amount")
        ),
        ...data.items.map((item, i) =>
          React.createElement(
            View,
            { key: i, style: styles.tableRow },
            React.createElement(Text, { style: { ...styles.value, flex: 3 } }, item.description || "-"),
            React.createElement(Text, { style: { ...styles.value, flex: 1, textAlign: "center" } }, String(item.qty)),
            React.createElement(Text, { style: { ...styles.value, flex: 1, textAlign: "right" } }, fmt(item.rate)),
            React.createElement(Text, { style: { ...styles.value, flex: 1, textAlign: "right" } }, fmt(item.qty * item.rate))
          )
        )
      ),
      // Totals
      React.createElement(
        View,
        { style: styles.totalsSection },
        React.createElement(
          View,
          { style: styles.totalsBox },
          React.createElement(
            View,
            { style: styles.totalRow },
            React.createElement(Text, { style: styles.totalLabel }, "Subtotal"),
            React.createElement(Text, { style: styles.totalValue }, fmt(subtotal))
          ),
          data.taxRate
            ? React.createElement(
                View,
                { style: styles.totalRow },
                React.createElement(Text, { style: styles.totalLabel }, `${data.taxName || "Tax"} (${data.taxRate}%)`),
                React.createElement(Text, { style: styles.totalValue }, fmt(taxAmt))
              )
            : null,
          React.createElement(
            View,
            { style: styles.grandTotalRow },
            React.createElement(Text, { style: styles.grandTotalLabel }, "Total"),
            React.createElement(Text, { style: styles.grandTotalValue }, fmt(total))
          )
        )
      ),
      // Notes
      data.notes
        ? React.createElement(
            View,
            { style: styles.notes },
            React.createElement(Text, { style: styles.notesLabel }, "Notes"),
            React.createElement(Text, { style: styles.notesText }, data.notes)
          )
        : null,
      data.paymentTerms
        ? React.createElement(
            View,
            { style: styles.notes },
            React.createElement(Text, { style: styles.notesLabel }, "Payment Terms"),
            React.createElement(Text, { style: styles.notesText }, data.paymentTerms)
          )
        : null,
      // Watermark
      React.createElement(
        View,
        { style: styles.watermark },
        React.createElement(Text, { style: styles.watermarkText }, "Created free with BillingBee — billingbee.co")
      )
    )
  )
}

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, "pdf")
  if (limited) return limited

  const { documentData } = await req.json() as { documentData: DocumentData }

  if (!documentData) {
    return NextResponse.json({ error: "documentData required" }, { status: 400 })
  }

  // renderToBuffer requires a Document element at the root
  const docElement = React.createElement(InvoicePDF, { data: documentData })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(docElement as any)

  const docType = documentData.documentType || "invoice"
  const docNum = documentData.docNumber || "001"
  const filename = `${docType}-${docNum}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
