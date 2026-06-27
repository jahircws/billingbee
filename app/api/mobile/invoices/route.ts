import { NextRequest, NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import db from "@/lib/db"
import { addDays } from "date-fns"

async function nextInvoiceNumber(orgId: string): Promise<string> {
  const invoices = await db.invoice.findMany({ where: { orgId }, select: { invoiceNumber: true } })
  const maxNum = invoices.reduce((max, inv) => {
    const m = inv.invoiceNumber.match(/(\d+)$/)
    return m ? Math.max(max, parseInt(m[1], 10)) : max
  }, 0)
  return `INV-${String(maxNum + 1).padStart(3, "0")}`
}

export async function GET(req: NextRequest) {
  try {
    const session = await getMobileSession(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { orgId } = session
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") ?? undefined
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)))
    const skip = (page - 1) * limit

    const where = {
      orgId,
      ...(status ? { status: status as never } : {}),
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { client: { select: { name: true } } },
      }),
      db.invoice.count({ where }),
    ])

    return NextResponse.json({
      invoices: invoices.map((inv) => ({
        id: inv.id,
        number: inv.invoiceNumber,
        clientName: inv.client.name,
        amount: Number(inv.amountDue),
        currency: inv.currency,
        status: inv.status,
        dueDate: inv.dueDate,
        createdAt: inv.createdAt,
      })),
      total,
      page,
      hasMore: skip + limit < total,
    })
  } catch (err) {
    console.error("[mobile/invoices GET]", err)
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getMobileSession(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { orgId } = session
    const body = await req.json()
    const { clientId, items, dueDate, currency, notes } = body

    if (!clientId || typeof clientId !== "string") {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 })
    }

    const client = await db.client.findUnique({ where: { id: clientId, orgId } })
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 400 })
    }

    const org = await db.organization.findUnique({ where: { id: orgId }, select: { currency: true } })
    const invoiceCurrency = (currency ?? org?.currency ?? "INR") as never

    const issueDate = new Date()
    const parsedDueDate = dueDate ? new Date(dueDate) : addDays(issueDate, 30)

    let subtotal = 0
    const lineItems = items.map((item: { description: string; quantity: number; unitPrice: number }, idx: number) => {
      const lineTotal = Number(item.quantity) * Number(item.unitPrice)
      subtotal += lineTotal
      return {
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRate: 0,
        taxName: "GST",
        taxType: "PERCENTAGE",
        taxAmount: 0,
        discount: 0,
        total: lineTotal,
        sortOrder: idx,
      }
    })

    const invoiceNumber = await nextInvoiceNumber(orgId)

    const invoice = await db.invoice.create({
      data: {
        orgId,
        clientId,
        invoiceNumber,
        status: "DRAFT",
        issueDate,
        dueDate: parsedDueDate,
        currency: invoiceCurrency,
        fxRate: 1,
        subtotal,
        taxAmount: 0,
        discountAmount: 0,
        total: subtotal,
        amountDue: subtotal,
        amountPaid: 0,
        notes: notes ?? null,
        items: { create: lineItems },
      },
      include: { client: { select: { name: true } } },
    })

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        number: invoice.invoiceNumber,
        clientName: invoice.client.name,
        amount: Number(invoice.amountDue),
        currency: invoice.currency,
        status: invoice.status,
        dueDate: invoice.dueDate,
        createdAt: invoice.createdAt,
      },
    })
  } catch (err) {
    console.error("[mobile/invoices POST]", err)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
