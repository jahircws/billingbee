import { NextRequest, NextResponse } from "next/server"
import { fmtCurrency } from "@/lib/currency"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer"
import { format } from "date-fns"
import path from "path"

Font.register({
  family: "DejaVu",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/DejaVuSans.ttf") },
    { src: path.join(process.cwd(), "public/fonts/DejaVuSans-Bold.ttf"), fontWeight: "bold" },
  ],
})

const EMERALD = "#10b981"
const EMERALD_LIGHT = "#f0fdf4"

const styles = StyleSheet.create({
  page: { fontSize: 10, fontFamily: "DejaVu", color: "#1a1a1a" },
  header: { backgroundColor: EMERALD, padding: "20 28", flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerLeft: { flex: 1 },
  orgNameWhite: { fontSize: 18, fontWeight: "bold", color: "#ffffff" },
  orgAddrWhite: { fontSize: 8, color: "#d1fae5", marginTop: 3 },
  badge: { backgroundColor: "#ffffff", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, alignSelf: "flex-start" },
  badgeText: { fontSize: 13, fontWeight: "bold", color: EMERALD },
  metaRow: { backgroundColor: "#f8fafc", flexDirection: "row", paddingHorizontal: 28, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  metaPill: { flex: 1, paddingHorizontal: 6 },
  metaLabel: { fontSize: 7, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  metaValue: { fontSize: 9, color: "#111827", fontWeight: "bold" },
  body: { padding: "20 28" },
  sectionLabel: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e5e7eb", marginVertical: 14 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f1f5f9", borderRadius: 4, padding: "7 10", marginBottom: 2 },
  tableRow: { flexDirection: "row", padding: "7 10", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  th: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "bold" },
  td: { fontSize: 10, color: "#374151" },
  descCol: { flex: 3 },
  numCol: { flex: 1, textAlign: "right" },
  totals: { alignItems: "flex-end", marginTop: 8 },
  totalRow: { flexDirection: "row", gap: 16, paddingVertical: 3 },
  totalLabel: { fontSize: 10, color: "#6b7280", width: 110, textAlign: "right" },
  totalValue: { fontSize: 10, color: "#111827", width: 110, textAlign: "right" },
  grandTotalRow: { flexDirection: "row", gap: 16, paddingVertical: 4, backgroundColor: EMERALD_LIGHT, borderRadius: 4, paddingHorizontal: 8 },
  grandTotalLabel: { fontSize: 12, fontWeight: "bold", color: EMERALD, width: 102, textAlign: "right" },
  grandTotalValue: { fontSize: 12, fontWeight: "bold", color: EMERALD, width: 110, textAlign: "right" },
  footer: { position: "absolute", bottom: 20, left: 28, right: 28 },
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
      select: { name: true, plan: true, logo: true, address: true, city: true, state: true, pincode: true, gstin: true, currency: true },
    }),
  ])

  if (!quote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const fmt = (n: unknown) => fmtCurrency(n, quote.currency)
  const isPro = org?.plan !== "free"
  const isIndia = org?.currency === "INR"
  const taxAmount = Number(quote.taxAmount)
  const discountAmount = Number(quote.discountAmount)

  // GST type determination
  const supplierGstin = org?.gstin?.trim() || null
  const recipientGstin = (quote.client as { gstin?: string | null }).gstin?.trim() || null
  const supplierStateCode = supplierGstin?.slice(0, 2) || null
  const posStateCode = recipientGstin?.slice(0, 2) || null
  const isGstDoc = !!supplierGstin && isIndia
  const isInterState = !!supplierStateCode && !!posStateCode && supplierStateCode !== posStateCode
  const gstRate = quote.items.reduce((m, i) => Math.max(m, Number(i.taxRate)), 0)
  const halfRate = gstRate / 2

  const cityLine = (city?: string | null, state?: string | null, pincode?: string | null) => {
    const loc = [city, state].filter(Boolean).join(", ")
    return [loc, pincode].filter(Boolean).join(" - ") || null
  }
  const supplierCityState = cityLine(org?.city, org?.state, org?.pincode)
  const clientCityState = cityLine(
    (quote.client as { city?: string | null }).city,
    (quote.client as { state?: string | null }).state,
    (quote.client as { pincode?: string | null }).pincode,
  )

  // Fetch logo as base64 if it's a remote URL (react-pdf can't fetch remote images server-side reliably)
  let logoSrc: string | null = null
  if (org?.logo) {
    try {
      const res = await fetch(org.logo)
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        const ct = res.headers.get("content-type") ?? "image/png"
        logoSrc = `data:${ct};base64,${buf.toString("base64")}`
      }
    } catch {
      // fall through — show org name text
    }
  }

  const orgAddrLine = [org?.address, supplierCityState].filter(Boolean).join(", ")

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Emerald header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoSrc ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={logoSrc} style={{ maxHeight: 44, maxWidth: 160, marginBottom: 6, objectFit: "contain" }} />
            ) : (
              <Text style={styles.orgNameWhite}>{org?.name ?? "Your Business"}</Text>
            )}
            {orgAddrLine ? <Text style={styles.orgAddrWhite}>{orgAddrLine}</Text> : null}
            {isIndia && supplierGstin ? <Text style={{ ...styles.orgAddrWhite, marginTop: 2 }}>GSTIN: {supplierGstin}</Text> : null}
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>QUOTE</Text>
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Prepared for</Text>
            <Text style={styles.metaValue}>{quote.client.name}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Ref</Text>
            <Text style={styles.metaValue}>{quote.quoteNumber}</Text>
          </View>
          {quote.expiryDate && (
            <View style={styles.metaPill}>
              <Text style={styles.metaLabel}>Valid till</Text>
              <Text style={styles.metaValue}>{format(quote.expiryDate, "d MMM yyyy")}</Text>
            </View>
          )}
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Client details */}
          {(quote.client.email || quote.client.address || clientCityState) && (
            <>
              <Text style={styles.sectionLabel}>Bill to</Text>
              {quote.client.email && <Text style={{ fontSize: 9, color: "#6b7280" }}>{quote.client.email}</Text>}
              {quote.client.address && <Text style={{ fontSize: 9, color: "#6b7280" }}>{quote.client.address}</Text>}
              {clientCityState && <Text style={{ fontSize: 9, color: "#6b7280" }}>{clientCityState}</Text>}
              <View style={styles.divider} />
            </>
          )}

          {/* Line items */}
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

          {/* Totals */}
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{isGstDoc ? "Taxable value" : "Subtotal"}</Text>
              <Text style={styles.totalValue}>{fmt(quote.subtotal)}</Text>
            </View>
            {taxAmount > 0 && (
              isGstDoc ? (
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
            {discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalValue}>- {fmt(discountAmount)}</Text>
              </View>
            )}
            <View style={{ ...styles.divider, width: 236, marginVertical: 6 }} />
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{fmt(quote.total)}</Text>
            </View>
          </View>

          {quote.notes && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Notes</Text>
              <Text style={{ fontSize: 9, color: "#6b7280" }}>{quote.notes}</Text>
            </>
          )}
          {quote.terms && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Terms</Text>
              <Text style={{ fontSize: 9, color: "#6b7280" }}>{quote.terms}</Text>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {!isPro && (
            <Text style={styles.footerText}>Powered by BillingBee | billingbee.co</Text>
          )}
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
