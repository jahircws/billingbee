import { NextRequest, NextResponse } from "next/server"
import { fmtCurrency } from "@/lib/currency"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer"
import { format } from "date-fns"
import path from "path"

// DejaVu covers the currency glyphs (₹/€/£) that built-in Helvetica lacks.
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
  orgName: { fontSize: 18, fontWeight: "bold", color: "#2563eb" },
  docTitle: { fontSize: 22, fontWeight: "bold", color: "#2563eb", textAlign: "right" },
  docNumber: { fontSize: 11, color: "#6b7280", textAlign: "right", marginTop: 4 },
  label: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  value: { fontSize: 10, color: "#111827" },
  bold: { fontWeight: "bold" },
  grid: { flexDirection: "row", gap: 24 },
  col: { flex: 1 },
  colRight: { flex: 1, alignItems: "flex-end" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e5e7eb", marginVertical: 16 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f9fafb", borderRadius: 6, padding: "8 12", marginBottom: 2 },
  tableRow: { flexDirection: "row", padding: "8 12", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  th: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "bold" },
  td: { fontSize: 10, color: "#374151" },
  descCol: { flex: 3 },
  numCol: { flex: 1, textAlign: "right" },
  totals: { alignItems: "flex-end", marginTop: 8 },
  totalRow: { flexDirection: "row", gap: 16, paddingVertical: 3 },
  totalLabel: { fontSize: 10, color: "#6b7280", width: 80, textAlign: "right" },
  totalValue: { fontSize: 10, color: "#111827", width: 80, textAlign: "right" },
  grandTotal: { fontSize: 13, fontWeight: "bold", color: "#2563eb" },
  watermark: { position: "absolute", top: "40%", left: "15%", fontSize: 48, color: "#e5e7eb", opacity: 0.6, transform: "rotate(-30deg)" },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48 },
  footerText: { fontSize: 8, color: "#9ca3af", textAlign: "center" },
})

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

  const [quote, org] = await Promise.all([
    prisma.quote.findUnique({
      where: { id, orgId },
      include: { client: true, items: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, plan: true, logo: true, address: true, city: true, state: true, pincode: true, email: true, phone: true, gstin: true },
    }),
  ])

  if (!quote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const fmt = (n: unknown) => fmtCurrency(n, quote.currency)
  const isPro = org?.plan !== "free"
  const taxAmount = Number(quote.taxAmount)
  const discountAmount = Number(quote.discountAmount)

  const cityStateLine = (city?: string | null, state?: string | null, pincode?: string | null) => {
    const locality = [city, state].filter(Boolean).join(", ")
    return [locality, pincode].filter(Boolean).join(" - ") || null
  }
  const supplierCityState = cityStateLine(org?.city, org?.state, org?.pincode)
  const clientCityState = cityStateLine(
    (quote.client as { city?: string | null }).city,
    (quote.client as { state?: string | null }).state,
    (quote.client as { pincode?: string | null }).pincode,
  )

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {!isPro && <Text style={styles.watermark}>Created with BillingBee</Text>}

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
          </View>
          <View>
            <Text style={styles.docTitle}>QUOTE</Text>
            <Text style={styles.docNumber}>{quote.quoteNumber}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.label}>Prepared for</Text>
            <Text style={{ ...styles.value, ...styles.bold }}>{quote.client.name}</Text>
            {quote.client.email && <Text style={styles.value}>{quote.client.email}</Text>}
            {quote.client.phone && <Text style={styles.value}>{quote.client.phone}</Text>}
            {quote.client.address && <Text style={styles.value}>{quote.client.address}</Text>}
            {clientCityState && <Text style={styles.value}>{clientCityState}</Text>}
          </View>
          <View style={styles.colRight}>
            <View style={{ marginBottom: 8, alignItems: "flex-end" }}>
              <Text style={styles.label}>Issue date</Text>
              <Text style={styles.value}>{format(quote.issueDate, "d MMMM yyyy")}</Text>
            </View>
            {quote.expiryDate && (
              <View style={{ marginBottom: 8, alignItems: "flex-end" }}>
                <Text style={styles.label}>Valid until</Text>
                <Text style={{ ...styles.value, ...styles.bold }}>{format(quote.expiryDate, "d MMMM yyyy")}</Text>
              </View>
            )}
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>{quote.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.tableHeader}>
          <Text style={{ ...styles.th, ...styles.descCol }}>Description</Text>
          <Text style={{ ...styles.th, ...styles.numCol }}>Qty</Text>
          <Text style={{ ...styles.th, ...styles.numCol }}>Rate</Text>
          <Text style={{ ...styles.th, ...styles.numCol }}>Tax</Text>
          <Text style={{ ...styles.th, ...styles.numCol }}>Amount</Text>
        </View>
        {quote.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <View style={styles.descCol}>
              <Text style={styles.td}>{item.description}</Text>
            </View>
            <Text style={{ ...styles.td, ...styles.numCol }}>{Number(item.quantity)}</Text>
            <Text style={{ ...styles.td, ...styles.numCol }}>{fmt(item.unitPrice)}</Text>
            <Text style={{ ...styles.td, ...styles.numCol }}>{Number(item.taxRate) > 0 ? `${Number(item.taxRate)}%` : "—"}</Text>
            <Text style={{ ...styles.td, ...styles.numCol }}>{fmt(item.total)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(quote.subtotal)}</Text>
          </View>
          {taxAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>{fmt(taxAmount)}</Text>
            </View>
          )}
          {discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalValue}>- {fmt(discountAmount)}</Text>
            </View>
          )}
          <View style={{ ...styles.divider, width: 176, marginVertical: 6 }} />
          <View style={styles.totalRow}>
            <Text style={{ ...styles.totalLabel, ...styles.grandTotal }}>Total</Text>
            <Text style={{ ...styles.totalValue, ...styles.grandTotal }}>{fmt(quote.total)}</Text>
          </View>
        </View>

        {quote.notes && (
          <>
            <View style={styles.divider} />
            <View>
              <Text style={styles.label}>Notes</Text>
              <Text style={{ ...styles.value, color: "#6b7280" }}>{quote.notes}</Text>
            </View>
          </>
        )}
        {quote.terms && (
          <>
            <View style={styles.divider} />
            <View>
              <Text style={styles.label}>Terms</Text>
              <Text style={{ ...styles.value, color: "#6b7280" }}>{quote.terms}</Text>
            </View>
          </>
        )}

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
      "Content-Disposition": `inline; filename="${quote.quoteNumber}.pdf"`,
    },
  })
}
