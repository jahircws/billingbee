"use server"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { scheduleCollections } from "@/app/actions/collections"
import { format, addDays } from "date-fns"

interface LineItemInput {
  description: string
  quantity: number
  unitPrice: number
  taxRate?: number
}

interface CreateInvoiceInput {
  clientId: string
  dueDate?: string
  currency?: string
  notes?: string
  terms?: string
  items: LineItemInput[]
  autoFollowUp?: boolean
}

export async function createInvoice(input: CreateInvoiceInput) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  // Sequential invoice number
  const count = await prisma.invoice.count({ where: { orgId } })
  const invoiceNumber = `INV-${String(count + 1).padStart(3, "0")}`

  const dueDate = input.dueDate
    ? new Date(input.dueDate)
    : addDays(new Date(), 30)

  // Compute totals
  const lineItems = input.items.map((item) => {
    const subtotal = item.quantity * item.unitPrice
    const taxAmount = subtotal * ((item.taxRate ?? 0) / 100)
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate ?? 0,
      taxAmount,
      discount: 0,
      total: subtotal + taxAmount,
      sortOrder: 0,
    }
  })

  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const taxAmount = lineItems.reduce((s, i) => s + i.taxAmount, 0)
  const total = subtotal + taxAmount

  // Auto follow-up: Pro orgs get it on by default, free orgs get false
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true } })
  const isPro = org?.plan !== "free"
  const autoFollowUp = input.autoFollowUp ?? isPro

  const invoice = await prisma.invoice.create({
    data: {
      orgId,
      clientId: input.clientId,
      invoiceNumber,
      status: "UNPAID",
      issueDate: new Date(),
      dueDate,
      currency: (input.currency ?? "INR") as never,
      subtotal,
      taxAmount,
      discountAmount: 0,
      total,
      amountPaid: 0,
      amountDue: total,
      notes: input.notes,
      terms: input.terms,
      autoFollowUp,
      items: { create: lineItems },
    },
  })

  if (autoFollowUp && dueDate) {
    await scheduleCollections(orgId, invoice.id, dueDate)
  }

  return { invoiceId: invoice.id, invoiceNumber }
}
