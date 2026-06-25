import { NextRequest, NextResponse } from "next/server"
import { fmtCurrency } from "@/lib/currency"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image, Font, Link } from "@react-pdf/renderer"
import { format } from "date-fns"
import path from "path"
import QRCode from "qrcode"
import { generatePaymentToken } from "@/lib/payment-token"

const COUNTRY_NAMES: Record<string, string> = {
  IN: "India", US: "United States", GB: "United Kingdom", AU: "Australia",
  CA: "Canada", SG: "Singapore", AE: "United Arab Emirates", DE: "Germany",
  FR: "France", NL: "Netherlands", JP: "Japan", NZ: "New Zealand",
  ZA: "South Africa", NG: "Nigeria", KE: "Kenya", BR: "Brazil",
  MX: "Mexico", AR: "Argentina", PK: "Pakistan", BD: "Bangladesh",
}

// Built-in Helvetica has no glyph for ₹ / € / £ (it renders garbage like "¹"),
// so register DejaVu Sans, which covers all the currency symbols we format.
Font.register({
  family: "DejaVu",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/DejaVuSans.ttf") },
    { src: path.join(process.cwd(), "public/fonts/DejaVuSans-Bold.ttf"), fontWeight: "bold" },
  ],
})

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "DejaVu", color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  orgName: { fontSize: 18, fontWeight: "bold", color: "#059669" },
  invoiceTitle: { fontSize: 22, fontWeight: "bold", color: "#059669", textAlign: "right" },
  invoiceNumber: { fontSize: 11, color: "#6b7280", textAlign: "right", marginTop: 4 },
  section: { marginBottom: 16 },
  label: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  value: { fontSize: 10, color: "#111827" },
  bold: { fontWeight: "bold" },
  grid: { flexDirection: "row", gap: 24 },
  col: { flex: 1 },
  colRight: { flex: 1, alignItems: "flex-end" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e5e7eb", marginVertical: 16 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    padding: "8 12",
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: "8 12",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  th: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "bold" },
  td: { fontSize: 10, color: "#374151" },
  descCol: { flex: 3 },
  numCol: { flex: 1, textAlign: "right" },
  totals: { alignItems: "flex-end", marginTop: 8 },
  totalRow: { flexDirection: "row", gap: 16, paddingVertical: 3 },
  totalLabel: { fontSize: 10, color: "#6b7280", width: 80, textAlign: "right" },
  totalValue: { fontSize: 10, color: "#111827", width: 80, textAlign: "right" },
  grandTotal: { fontSize: 13, fontWeight: "bold", color: "#059669" },
  watermark: {
    position: "absolute",
    top: "40%",
    left: "15%",
    fontSize: 34,
    color: "#e5e7eb",
    opacity: 0.06,
    transform: "rotate(-45deg)",
  },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48 },
  footerText: { fontSize: 8, color: "#9ca3af", textAlign: "center" },
  payFooter: { borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 8, marginBottom: 8 },
  payFooterRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  payFooterText: { fontSize: 8, color: "#6b7280" },
  payFooterUrl: { fontSize: 7, color: "#059669", marginTop: 3 },
  upiSection: { borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 8, marginBottom: 8 },
  upiHeading: { fontSize: 8, color: "#6b7280", marginBottom: 4 },
  upiNote: { fontSize: 7, color: "#9ca3af", marginTop: 3 },
})

// fmt is defined per-invoice below, after we know the currency

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const orgId = session.user.orgId

  const { id } = await params

  const [invoice, org] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id, orgId },
      include: {
        client: true,
        items: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, plan: true, logo: true, address: true, city: true, state: true, pincode: true, email: true, phone: true, gstin: true, pan: true, upiQrUrl: true },
    }),
  ])

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const fmt = (n: unknown) => fmtCurrency(n, invoice.currency)

  const showPayLink = invoice.status === "UNPAID" || invoice.status === "OVERDUE"
  let payUrl: string | null = null
  let qrDataUrl: string | null = null
  if (showPayLink) {
    const token = generatePaymentToken(invoice.id, orgId)
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://billingbee.co"
    payUrl = `${base}/pay/${token}`
    qrDataUrl = await QRCode.toDataURL(payUrl, { width: 80, margin: 1 })
  }

  const isPro = org?.plan !== "free"

  // Fetch UPI QR image as base64 data URL for PDF embedding (INR invoices only)
  let upiQrDataUrl: string | null = null
  const showUpiQr = invoice.currency === "INR" && !!org?.upiQrUrl
  if (showUpiQr && org?.upiQrUrl) {
    try {
      const imgRes = await fetch(org.upiQrUrl)
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer())
        const ct = imgRes.headers.get("content-type") ?? "image/png"
        upiQrDataUrl = `data:${ct};base64,${buf.toString("base64")}`
      }
    } catch {
      // skip UPI QR if fetch fails
    }
  }

  // ---- GST tax-type determination (CGST Rule 46) ----------------------------
  // The place of supply / tax type is derived from the GSTIN state codes, NOT
  // from whatever label the user happened to store on the line item. A supply
  // is intra-state when supplier and recipient share a state code → CGST+SGST;
  // otherwise it is inter-state → IGST.
  const supplierGstin = org?.gstin?.trim() || null
  const recipientGstin = (invoice.client as { gstin?: string | null }).gstin?.trim() || null
  const supplierStateCode = supplierGstin?.slice(0, 2) || null
  const posStateCode = recipientGstin?.slice(0, 2) || null
  // Only treat as a GST tax invoice when the supplier is registered.
  const isGstInvoice = !!supplierGstin && invoice.currency === "INR"
  // Default to intra-state when we can't compare (safer than over-charging IGST).
  const isInterState =
    !!supplierStateCode && !!posStateCode && supplierStateCode !== posStateCode
  const taxAmount = Number(invoice.taxAmount)
  // Representative rate: the max line rate (correct when all lines share a rate,
  // which is the common case for a single-rate invoice).
  const gstRate = invoice.items.reduce((m, i) => Math.max(m, Number(i.taxRate)), 0)
  const halfRate = gstRate / 2
  const placeOfSupply = (invoice.client as { state?: string | null }).state || null

  const gstComponentLabel = (rate: number) =>
    isInterState ? `IGST ${rate}%` : `CGST ${rate / 2}% + SGST ${rate / 2}%`

  // City, State – Pincode line, composed from the separate address fields.
  const cityStateLine = (city?: string | null, state?: string | null, pincode?: string | null) => {
    const locality = [city, state].filter(Boolean).join(", ")
    return [locality, pincode].filter(Boolean).join(" - ") || null
  }
  const supplierCityState = cityStateLine(org?.city, org?.state, org?.pincode)
  const clientCityState = cityStateLine(
    (invoice.client as { city?: string | null }).city,
    (invoice.client as { state?: string | null }).state,
    (invoice.client as { pincode?: string | null }).pincode,
  )

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark for free plan */}
        {!isPro && (
          <Text style={styles.watermark}>Created with BillingBee</Text>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View>
            {org?.logo && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={org.logo} style={{ maxHeight: 44, maxWidth: 160, marginBottom: 8, objectFit: "contain" }} />
            )}
            <Text style={styles.orgName}>{org?.name ?? "Your Business"}</Text>
            {org?.address && <Text style={{ ...styles.value, color: "#6b7280", marginTop: 4 }}>{org.address}</Text>}
            {supplierCityState && <Text style={{ ...styles.value, color: "#6b7280" }}>{supplierCityState}</Text>}
            {org?.email && <Text style={{ ...styles.value, color: "#6b7280" }}>{org.email}</Text>}
            {org?.phone && <Text style={{ ...styles.value, color: "#6b7280" }}>{org.phone}</Text>}
            {supplierGstin && invoice.currency === "INR" && <Text style={{ ...styles.value, color: "#6b7280", marginTop: 4 }}>GSTIN: {supplierGstin}</Text>}
            {org?.pan && <Text style={{ ...styles.value, color: "#6b7280" }}>PAN: {org.pan}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>{isGstInvoice ? "TAX INVOICE" : "INVOICE"}</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Billing info */}
        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.label}>Bill to</Text>
            <Text style={{ ...styles.value, ...styles.bold }}>{invoice.client.name}</Text>
            {invoice.client.email && <Text style={styles.value}>{invoice.client.email}</Text>}
            {invoice.client.phone && <Text style={styles.value}>{invoice.client.phone}</Text>}
            {invoice.client.address && <Text style={styles.value}>{invoice.client.address}</Text>}
            {clientCityState && <Text style={styles.value}>{clientCityState}</Text>}
            {(() => {
              const cc = (invoice.client as { country?: string | null }).country
              if (!cc || cc === "IN") return null
              return <Text style={styles.value}>{COUNTRY_NAMES[cc] ?? cc}</Text>
            })()}
            {(invoice.client as { gstin?: string | null }).gstin && invoice.currency === "INR" && (
              <Text style={{ ...styles.value, color: "#6b7280" }}>GSTIN: {(invoice.client as { gstin?: string | null }).gstin}</Text>
            )}
          </View>
          <View style={styles.colRight}>
            <View style={{ marginBottom: 8, alignItems: "flex-end" }}>
              <Text style={styles.label}>Issue date</Text>
              <Text style={styles.value}>{format(invoice.issueDate, "d MMMM yyyy")}</Text>
            </View>
            {invoice.dueDate && (
              <View style={{ marginBottom: 8, alignItems: "flex-end" }}>
                <Text style={styles.label}>Due date</Text>
                <Text style={{ ...styles.value, ...styles.bold }}>{format(invoice.dueDate, "d MMMM yyyy")}</Text>
              </View>
            )}
            {invoice.status !== "DRAFT" && (
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.label}>Status</Text>
                <Text style={styles.value}>{invoice.status}</Text>
              </View>
            )}
            {isGstInvoice && placeOfSupply && (
              <View style={{ marginTop: 8, alignItems: "flex-end" }}>
                <Text style={styles.label}>Place of supply</Text>
                <Text style={styles.value}>
                  {placeOfSupply}
                  {posStateCode ? ` (${posStateCode})` : ""}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Items */}
        <View style={styles.tableHeader}>
          <Text style={{ ...styles.th, ...styles.descCol }}>Description</Text>
          <Text style={{ ...styles.th, ...styles.numCol }}>Qty</Text>
          <Text style={{ ...styles.th, ...styles.numCol }}>Rate</Text>
          <Text style={{ ...styles.th, ...styles.numCol }}>Tax</Text>
          <Text style={{ ...styles.th, ...styles.numCol }}>Amount</Text>
        </View>
        {invoice.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <View style={styles.descCol}>
              <Text style={styles.td}>{item.description}</Text>
              {invoice.currency === 'INR' && (item as { hsn?: string | null }).hsn && (
                <Text style={{ ...styles.td, fontSize: 8, color: "#9ca3af" }}>
                  HSN/SAC: {(item as { hsn?: string | null }).hsn}
                </Text>
              )}
            </View>
            <Text style={{ ...styles.td, ...styles.numCol }}>{Number(item.quantity)}</Text>
            <Text style={{ ...styles.td, ...styles.numCol }}>{fmt(item.unitPrice)}</Text>
            <Text style={{ ...styles.td, ...styles.numCol }}>
              {Number(item.taxRate) > 0
                ? isGstInvoice
                  ? gstComponentLabel(Number(item.taxRate))
                  : `${(item as { taxName?: string | null }).taxName && (item as { taxName?: string | null }).taxName !== "None"
                      ? `${(item as { taxName?: string | null }).taxName} `
                      : ""}${Number(item.taxRate)}%`
                : "—"}
            </Text>
            <Text style={{ ...styles.td, ...styles.numCol }}>{fmt(item.total)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{isGstInvoice ? "Taxable value" : "Subtotal"}</Text>
            <Text style={styles.totalValue}>{fmt(invoice.subtotal)}</Text>
          </View>
          {taxAmount > 0 && (
            isGstInvoice ? (
              isInterState ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>IGST {gstRate}%</Text>
                  <Text style={styles.totalValue}>{fmt(taxAmount)}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>CGST {halfRate}%</Text>
                    <Text style={styles.totalValue}>{fmt(taxAmount / 2)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>SGST {halfRate}%</Text>
                    <Text style={styles.totalValue}>{fmt(taxAmount / 2)}</Text>
                  </View>
                </>
              )
            ) : (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax</Text>
                <Text style={styles.totalValue}>{fmt(taxAmount)}</Text>
              </View>
            )
          )}
          <View style={{ ...styles.divider, width: 176, marginVertical: 6 }} />
          <View style={styles.totalRow}>
            <Text style={{ ...styles.totalLabel, ...styles.grandTotal }}>Total</Text>
            <Text style={{ ...styles.totalValue, ...styles.grandTotal }}>{fmt(invoice.total)}</Text>
          </View>
          {Number(invoice.amountPaid) > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Paid</Text>
                <Text style={{ ...styles.totalValue, color: "#059669" }}>- {fmt(invoice.amountPaid)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={{ ...styles.totalLabel, ...styles.bold }}>Amount due</Text>
                <Text style={{ ...styles.totalValue, ...styles.bold }}>{fmt(invoice.amountDue)}</Text>
              </View>
            </>
          )}
        </View>

        {/* GST declaration + signatory */}
        {isGstInvoice && (
          <>
            <View style={styles.divider} />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...styles.value, color: "#6b7280" }}>
                  Tax is payable on reverse charge: No
                </Text>
                <Text style={{ ...styles.value, color: "#6b7280", marginTop: 2 }}>
                  {isInterState
                    ? "Inter-state supply — IGST applicable."
                    : "Intra-state supply — CGST + SGST applicable."}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: "flex-end", justifyContent: "flex-end" }}>
                <Text style={{ ...styles.value, marginTop: 24 }}>For {org?.name ?? "Your Business"}</Text>
                <Text style={{ ...styles.label, marginTop: 20 }}>Authorised Signatory</Text>
              </View>
            </View>
          </>
        )}

        {/* Notes */}
        {invoice.notes && (
          <>
            <View style={styles.divider} />
            <View>
              <Text style={styles.label}>Notes</Text>
              <Text style={{ ...styles.value, color: "#6b7280" }}>{invoice.notes}</Text>
            </View>
          </>
        )}
        {invoice.terms && (
          <>
            <View style={styles.divider} />
            <View>
              <Text style={styles.label}>Terms</Text>
              <Text style={{ ...styles.value, color: "#6b7280" }}>{invoice.terms}</Text>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {upiQrDataUrl && (
            <View style={styles.upiSection}>
              <Text style={styles.upiHeading}>Pay via UPI</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={upiQrDataUrl} style={{ width: 120, height: 120 }} />
              <Text style={styles.upiNote}>Scan with any UPI app — Google Pay, PhonePe, Paytm</Text>
            </View>
          )}
          {showPayLink && payUrl && qrDataUrl && (
            <View style={styles.payFooter}>
              <View style={styles.payFooterRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.payFooterText}>Pay this invoice online:</Text>
                  <Link src={payUrl} style={styles.payFooterUrl}>Click here to pay online</Link>
                </View>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={qrDataUrl} style={{ width: 56, height: 56 }} />
              </View>
            </View>
          )}
          <Text style={styles.footerText}>
            {!isPro ? "Generated with BillingBee · billingbee.co" : `${org?.name ?? ""} · Thank you for your business`}
          </Text>
        </View>
      </Page>
    </Document>
  )

  const buffer = await renderToBuffer(doc)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
    },
  })
}
