"use server"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"

interface ClientInput {
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  gstin?: string
  currency?: string
  notes?: string
}

export async function getClients(search?: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const where: Record<string, unknown> = { orgId }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }

  const clients = await prisma.client.findMany({
    where,
    include: {
      _count: { select: { invoices: true } },
    },
    orderBy: { name: "asc" },
  })
  return clients
}

export async function getClient(clientId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  return prisma.client.findUnique({
    where: { id: clientId, orgId },
    include: {
      invoices: {
        orderBy: { issueDate: "desc" },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          total: true,
          amountDue: true,
          amountPaid: true,
          issueDate: true,
          dueDate: true,
        },
      },
    },
  })
}

export async function createClient(data: ClientInput) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  if (!data.name?.trim()) return { error: "Name is required" }

  const client = await prisma.client.create({
    data: {
      orgId,
      name: data.name.trim(),
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      ...(data.country ? { country: data.country } : {}),
      company: data.company || null,
      pincode: data.pincode || null,
      gstin: data.gstin || null,
      currency: (data.currency ?? "INR") as never,
      notes: data.notes || null,
    },
  })
  return { client }
}

export async function updateClient(clientId: string, data: Partial<ClientInput>) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const existing = await prisma.client.findUnique({ where: { id: clientId, orgId } })
  if (!existing) return { error: "Not found" }

  const client = await prisma.client.update({
    where: { id: clientId },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.email !== undefined ? { email: data.email || null } : {}),
      ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
      ...(data.address !== undefined ? { address: data.address || null } : {}),
      ...(data.city !== undefined ? { city: data.city || null } : {}),
      ...(data.state !== undefined ? { state: data.state || null } : {}),
      ...(data.country !== undefined && data.country ? { country: data.country } : {}),
      ...(data.company !== undefined ? { company: data.company || null } : {}),
      ...(data.pincode !== undefined ? { pincode: data.pincode || null } : {}),
      ...(data.gstin !== undefined ? { gstin: data.gstin || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
    },
  })
  return { client }
}

export async function deleteClient(clientId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const existing = await prisma.client.findUnique({
    where: { id: clientId, orgId },
    include: { _count: { select: { invoices: { where: { status: { in: ["UNPAID", "OVERDUE"] } } } } } },
  })
  if (!existing) return { error: "Not found" }
  if (existing._count.invoices > 0) return { error: "Client has active invoices" }

  await prisma.client.delete({ where: { id: clientId } })
  return { success: true }
}
