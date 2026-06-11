import { NextRequest, NextResponse } from "next/server"
import { fmtCurrency } from "@/lib/currency"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import { format } from "date-fns"

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  orgName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#059669" },
  invoiceTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#059669", textAlign: "right" },
  invoiceNumber: { fontSize: 11, color: "#6b7280", textAlign: "right", marginTop: 4 },
  section: { marginBottom: 16 },
  label: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  value: { fontSize: 10, color: "#111827" },
  bold: { fontFamily: "Helvetica-Bold" },
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
  th: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "Helvetica-Bold" },
  td: { fontSize: 10, color: "#374151" },
  descCol: { flex: 3 },
  numCol: { flex: 1, textAlign: "right" },
  totals: { alignItems: "flex-end", marginTop: 8 },
  totalRow: { flexDirection: "row", gap: 16, paddingVertical: 3 },
  totalLabel: { fontSize: 10, color: "#6b7280", width: 80, textAlign: "right" },
  totalValue: { fontSize: 10, color: "#111827", width: 80, textAlign: "right" },
  grandTotal: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#059669" },
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
      select: { name: true, plan: true, logo: true, address: true, email: true, phone: true },
    }),
  ])

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const fmt = (n: unknown) => fmtCurrency(n, invoice.currency)

  const isPro = org?.plan !== "free"

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
            <Text style={styles.orgName}>{org?.name ?? "Your Business"}</Text>
            {org?.address && <Text style={{ ...styles.value, color: "#6b7280", marginTop: 4 }}>{org.address}</Text>}
            {org?.email && <Text style={{ ...styles.value, color: "#6b7280" }}>{org.email}</Text>}
            {org?.phone && <Text style={{ ...styles.value, color: "#6b7280" }}>{org.phone}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
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
            <Text style={{ ...styles.td, ...styles.descCol }}>{item.description}</Text>
            <Text style={{ ...styles.td, ...styles.numCol }}>{Number(item.quantity)}</Text>
            <Text style={{ ...styles.td, ...styles.numCol }}>{fmt(item.unitPrice)}</Text>
            <Text style={{ ...styles.td, ...styles.numCol }}>
              {(item as { taxName?: string | null }).taxName && (item as { taxName?: string | null }).taxName !== "None"
                ? `${(item as { taxName?: string | null }).taxName} ${Number(item.taxRate)}%`
                : `${Number(item.taxRate)}%`}
            </Text>
            <Text style={{ ...styles.td, ...styles.numCol }}>{fmt(item.total)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(invoice.subtotal)}</Text>
          </View>
          {Number(invoice.taxAmount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>{fmt(invoice.taxAmount)}</Text>
            </View>
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
