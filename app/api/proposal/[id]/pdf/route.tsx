import { NextRequest, NextResponse } from "next/server"
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
  sectionTitle: { fontSize: 11, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  sectionContent: { fontSize: 9, color: "#4b5563", lineHeight: 1.5 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e5e7eb", marginVertical: 14 },
  footer: { position: "absolute", bottom: 20, left: 28, right: 28 },
  footerText: { fontSize: 8, color: "#9ca3af", textAlign: "center" },
})

interface Section { title: string; content: string }

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

  const [proposal, org] = await Promise.all([
    prisma.proposal.findUnique({
      where: { id, orgId },
      include: { client: true },
    }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, plan: true, logo: true, address: true, city: true, state: true, pincode: true, gstin: true, currency: true },
    }),
  ])

  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const isPro = org?.plan !== "free"
  const isIndia = org?.currency === "INR"
  const sections = (proposal.sections as unknown as Section[]) ?? []
  const pricing = proposal.pricing as { description?: string; total?: number; currency?: string } | null

  const cityLine = (city?: string | null, state?: string | null, pincode?: string | null) => {
    const loc = [city, state].filter(Boolean).join(", ")
    return [loc, pincode].filter(Boolean).join(" - ") || null
  }
  const supplierCityState = cityLine(org?.city, org?.state, org?.pincode)
  const orgAddrLine = [org?.address, supplierCityState].filter(Boolean).join(", ")
  const supplierGstin = org?.gstin?.trim() || null

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

  const refNum = `PRO-${proposal.id.slice(-6).toUpperCase()}`

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
            <Text style={styles.badgeText}>PROPOSAL</Text>
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Prepared for</Text>
            <Text style={styles.metaValue}>{proposal.client.name}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Ref</Text>
            <Text style={styles.metaValue}>{refNum}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{format(proposal.createdAt, "d MMM yyyy")}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "#111827", marginBottom: 4 }}>{proposal.title}</Text>
          {proposal.timeline && (
            <Text style={{ fontSize: 9, color: "#6b7280", marginBottom: 14 }}>Timeline: {proposal.timeline}</Text>
          )}

          {sections.map((section, idx) => (
            <View key={idx}>
              {idx > 0 && <View style={styles.divider} />}
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}

          {pricing && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Pricing</Text>
              {pricing.description && <Text style={styles.sectionContent}>{pricing.description}</Text>}
              {pricing.total != null && (
                <Text style={{ fontSize: 13, fontWeight: "bold", color: EMERALD, marginTop: 6 }}>
                  Total: {pricing.currency ?? ""} {Number(pricing.total).toLocaleString()}
                </Text>
              )}
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
      "Content-Disposition": `inline; filename="proposal-${refNum}.pdf"`,
    },
  })
}
