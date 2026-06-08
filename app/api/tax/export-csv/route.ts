import { NextResponse } from "next/server"
import { getOrgId } from "@/lib/session"
import prisma from "@/lib/db"

export const dynamic = "force-dynamic"

function getQuarterRange() {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const qStart = new Date(year, Math.floor(month / 3) * 3, 1)
  const qEnd = new Date(year, Math.floor(month / 3) * 3 + 3, 0, 23, 59, 59)
  return { qStart, qEnd }
}

export async function GET() {
  let orgId: string
  try {
    orgId = await getOrgId()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { qStart, qEnd } = getQuarterRange()

  const invoices = await prisma.invoice.findMany({
    where: { orgId, issueDate: { gte: qStart, lte: qEnd } },
    include: {
      client: { select: { name: true, gstin: true } },
      items: true,
    },
    orderBy: { issueDate: "asc" },
  })

  const rows: string[][] = [
    ["Invoice #", "Date", "Client", "Client GSTIN", "Description", "HSN/SAC", "Taxable Amount", "GST Rate %", "GST Amount", "CGST", "SGST", "Total"],
  ]

  for (const inv of invoices) {
    for (const item of inv.items) {
      const taxable = Number(item.quantity) * Number(item.unitPrice)
      const gst = Number(item.taxAmount)
      rows.push([
        inv.invoiceNumber,
        inv.issueDate.toLocaleDateString("en-IN"),
        inv.client.name,
        inv.client.gstin ?? "",
        item.description,
        "",
        taxable.toFixed(2),
        String(item.taxRate),
        gst.toFixed(2),
        (gst / 2).toFixed(2),
        (gst / 2).toFixed(2),
        Number(item.total).toFixed(2),
      ])
    }
  }

  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="gst-export-${qStart.toISOString().slice(0, 7)}.csv"`,
    },
  })
}
