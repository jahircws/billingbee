"use server"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"

interface ExpenseInput {
  title: string
  amount: number
  date: string
  categoryId?: string
  vendor?: string
  receiptUrl?: string
  notes?: string
  isBillable?: boolean
  currency?: string
}

export async function getExpenses(filters?: {
  categoryId?: string
  from?: string
  to?: string
  search?: string
}) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const where: Record<string, unknown> = { orgId }
  if (filters?.categoryId) where.categoryId = filters.categoryId
  if (filters?.from || filters?.to) {
    where.date = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    }
  }
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { vendor: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { category: { select: { id: true, name: true, color: true } } },
    orderBy: { date: "desc" },
  })
  return expenses
}

export async function createExpense(data: ExpenseInput) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  if (!data.title?.trim()) return { error: "Title is required" }
  if (!data.amount || data.amount <= 0) return { error: "Valid amount is required" }

  const expense = await prisma.expense.create({
    data: {
      orgId,
      title: data.title.trim(),
      amount: data.amount,
      currency: (data.currency ?? "INR") as never,
      date: new Date(data.date),
      categoryId: data.categoryId || null,
      vendor: data.vendor || null,
      receiptUrl: data.receiptUrl || null,
      notes: data.notes || null,
      isBillable: data.isBillable ?? false,
    },
  })
  return { expense }
}

export async function updateExpense(expenseId: string, data: Partial<ExpenseInput>) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const existing = await prisma.expense.findUnique({ where: { id: expenseId, orgId } })
  if (!existing) return { error: "Not found" }

  const expense = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      ...(data.title ? { title: data.title.trim() } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.date ? { date: new Date(data.date) } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId || null } : {}),
      ...(data.vendor !== undefined ? { vendor: data.vendor || null } : {}),
      ...(data.receiptUrl !== undefined ? { receiptUrl: data.receiptUrl || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      ...(data.isBillable !== undefined ? { isBillable: data.isBillable } : {}),
    },
  })
  return { expense }
}

export async function deleteExpense(expenseId: string) {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  const existing = await prisma.expense.findUnique({ where: { id: expenseId, orgId } })
  if (!existing) return { error: "Not found" }

  await prisma.expense.delete({ where: { id: expenseId } })
  return { success: true }
}

export async function getExpenseCategories() {
  const session = await auth()
  const orgId = session?.user?.orgId
  if (!orgId) redirect("/login")

  return prisma.category.findMany({
    where: { orgId, isActive: true },
    orderBy: { name: "asc" },
  })
}
