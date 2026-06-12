import { NextRequest, NextResponse } from "next/server"
import { fmtCurrency } from "@/lib/currency"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer"
import { format } from "date-fns"
import path from "path"

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
    fontSize: 48,
    color: "#e5e7eb",
    opacity: 0.6,
    transform: "rotate(-30deg)",
  },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48 },
  footerText: { fontSize: 8, color: "#9ca3af", textAlign: "center" },
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
      select: { name: true, plan: true, logo: true, address: true, email: true, phone: true, gstin: true, pan: true, state: true },
    }),
  ])

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const fmt = (n: unknown) => fmtCurrency(n, invoice.currency)

  const isPro = org?.plan !== "free"

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
  const isGstInvoice = !!supplierGstin
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
            {org?.email && <Text style={{ ...styles.value, color: "#6b7280" }}>{org.email}</Text>}
            {org?.phone && <Text style={{ ...styles.value, color: "#6b7280" }}>{org.phone}</Text>}
            {supplierGstin && <Text style={{ ...styles.value, color: "#6b7280", marginTop: 4 }}>GSTIN: {supplierGstin}</Text>}
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
            {(invoice.client as { gstin?: string | null }).gstin && (
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
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>{invoice.status}</Text>
            </View>
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
              {(item as { hsn?: string | null }).hsn && (
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
          <Text style={styles.footerText}>
            {!isPro ? "Generated with BillingBee · billingbee.app" : `${org?.name ?? ""} · Thank you for your business`}
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
