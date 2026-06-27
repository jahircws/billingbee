import { NextRequest, NextResponse } from "next/server"
import { getOrgId } from "@/lib/session"
import prisma from "@/lib/db"

export const dynamic = "force-dynamic"

function currentQuarterRange() {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const start = new Date(year, Math.floor(month / 3) * 3, 1)
  const end = new Date(year, Math.floor(month / 3) * 3 + 3, 0, 23, 59, 59)
  return { start, end }
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function csvRow(cells: (string | number)[]) {
  return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
}

export async function GET(req: NextRequest) {
  let orgId: string
  try {
    orgId = await getOrgId()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const type = searchParams.get("type") ?? "gstr"
  const defaultRange = currentQuarterRange()
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")
  const from = fromParam ? new Date(fromParam) : defaultRange.start
  const to = toParam ? new Date(toParam + "T23:59:59") : defaultRange.end

  if (type === "gstr") {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { currency: true, plan: true },
    })
    if (!org || org.currency !== "INR") {
      return NextResponse.json({ error: "GSTR export is only available for INR organisations" }, { status: 403 })
    }
    if (org.plan !== "pro") {
      return NextResponse.json({ error: "GSTR export requires a Pro plan" }, { status: 403 })
    }

    const invoices = await prisma.invoice.findMany({
      where: { orgId, issueDate: { gte: from, lte: to }, status: { not: "DRAFT" } },
      include: {
        client: { select: { name: true, gstin: true } },
        items: true,
      },
      orderBy: { issueDate: "asc" },
    })

    const rows: string[] = [
      csvRow(["Invoice #", "Date", "Client", "Client GSTIN", "Description", "HSN/SAC", "Taxable Amount", "GST Rate %", "GST Amount", "CGST", "SGST", "IGST", "Total"]),
    ]

    for (const inv of invoices) {
      for (const item of inv.items) {
        const taxable = Number(item.quantity) * Number(item.unitPrice)
        const gst = Number(item.taxAmount)
        rows.push(
          csvRow([
            inv.invoiceNumber,
            isoDate(inv.issueDate),
            inv.client.name,
            inv.client.gstin ?? "",
            item.description,
            item.hsn ?? "",
            taxable.toFixed(2),
            Number(item.taxRate).toFixed(2),
            gst.toFixed(2),
            (gst / 2).toFixed(2),
            (gst / 2).toFixed(2),
            "0.00",
            Number(item.total).toFixed(2),
          ])
        )
      }
    }

    const csv = rows.join("\n")
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="gstr-${isoDate(from)}-to-${isoDate(to)}.csv"`,
      },
    })
  }

  // P&L mode — available to all orgs
  const [paidInvoices, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { orgId, status: "PAID", issueDate: { gte: from, lte: to } },
      select: { issueDate: true, total: true },
    }),
    prisma.expense.findMany({
      where: { orgId, date: { gte: from, lte: to } },
      select: { date: true, amount: true },
    }),
  ])

  const months: Record<string, { revenue: number; expenses: number }> = {}
  for (const inv of paidInvoices) {
    const key = inv.issueDate.toISOString().slice(0, 7)
    if (!months[key]) months[key] = { revenue: 0, expenses: 0 }
    months[key].revenue += Number(inv.total)
  }
  for (const exp of expenses) {
    const key = exp.date.toISOString().slice(0, 7)
    if (!months[key]) months[key] = { revenue: 0, expenses: 0 }
    months[key].expenses += Number(exp.amount)
  }

  const rows: string[] = [csvRow(["Period", "Total Revenue", "Total Expenses", "Net Profit"])]
  let totalRevenue = 0
  let totalExpenses = 0
  for (const key of Object.keys(months).sort()) {
    const { revenue, expenses: exp } = months[key]
    totalRevenue += revenue
    totalExpenses += exp
    rows.push(csvRow([key, revenue.toFixed(2), exp.toFixed(2), (revenue - exp).toFixed(2)]))
  }
  rows.push(csvRow(["Total", totalRevenue.toFixed(2), totalExpenses.toFixed(2), (totalRevenue - totalExpenses).toFixed(2)]))

  const csv = rows.join("\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="pl-${isoDate(from)}-to-${isoDate(to)}.csv"`,
    },
  })
}
