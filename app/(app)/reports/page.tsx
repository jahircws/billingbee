import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { serialize } from "@/lib/serialize"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import { startOfMonth, subMonths, format } from "date-fns"
import RevenueTab from "./RevenueTab"
import OutstandingTab from "./OutstandingTab"
import ExpensesTab from "./ExpensesTab"
import TaxTab from "./TaxTab"
import HealthCard from "@/components/dashboard/HealthCard"
import { calculateHealthScore } from "@/lib/health"

export const metadata = { ...privateMetadata, title: "Reports" }
export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ tab?: string; cur?: string }>
}

const TABS = [
  { id: "revenue", label: "Revenue" },
  { id: "outstanding", label: "Outstanding" },
  { id: "expenses", label: "Expenses" },
  { id: "tax", label: "Tax" },
]

export default async function ReportsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { tab = "revenue", cur } = await searchParams

  const now = new Date()
  const twelveMonthsAgo = startOfMonth(subMonths(now, 11))

  // Revenue by month
  const revenueInvoices = await prisma.invoice.findMany({
    where: { orgId, issueDate: { gte: twelveMonthsAgo }, status: { not: "DRAFT" } },
    select: { issueDate: true, total: true, currency: true, clientId: true, client: { select: { name: true } } },
  })

  // Currencies can't be summed together — pick one (default: most-used) and filter.
  const currencyCounts = new Map<string, number>()
  for (const inv of revenueInvoices) currencyCounts.set(inv.currency, (currencyCounts.get(inv.currency) ?? 0) + 1)
  const availableCurrencies = [...currencyCounts.keys()]
  const mostUsedCurrency = [...currencyCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  const selectedCurrency = cur && availableCurrencies.includes(cur) ? cur : (mostUsedCurrency ?? "INR")
  const filteredInvoices = revenueInvoices.filter((i) => i.currency === selectedCurrency)

  // Monthly buckets
  const monthlyRevenue: Record<string, number> = {}
  for (let i = 11; i >= 0; i--) {
    const m = startOfMonth(subMonths(now, i))
    monthlyRevenue[format(m, "MMM yy")] = 0
  }
  for (const inv of filteredInvoices) {
    const key = format(inv.issueDate, "MMM yy")
    if (key in monthlyRevenue) monthlyRevenue[key] += Number(inv.total)
  }
  const monthlyData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }))

  // Top clients
  const clientMap: Record<string, { name: string; revenue: number }> = {}
  for (const inv of filteredInvoices) {
    if (!clientMap[inv.clientId]) clientMap[inv.clientId] = { name: inv.client.name, revenue: 0 }
    clientMap[inv.clientId].revenue += Number(inv.total)
  }
  const topClients = Object.values(clientMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  // Outstanding invoices
  const outstanding = await prisma.invoice.findMany({
    where: { orgId, status: { in: ["UNPAID", "OVERDUE"] } },
    include: { client: { select: { name: true } } },
    orderBy: { amountDue: "desc" },
  })

  // Expenses by category
  const expenses = await prisma.expense.findMany({
    where: { orgId, date: { gte: twelveMonthsAgo } },
    include: { category: { select: { name: true, color: true } } },
    orderBy: { date: "desc" },
  })

  const catMap: Record<string, { name: string; color: string | null; amount: number }> = {}
  for (const exp of expenses) {
    const key = exp.categoryId ?? "uncategorized"
    const name = exp.category?.name ?? "Uncategorized"
    const color = exp.category?.color ?? null
    if (!catMap[key]) catMap[key] = { name, color, amount: 0 }
    catMap[key].amount += Number(exp.amount)
  }
  const expByCategory = Object.values(catMap).sort((a, b) => b.amount - a.amount)

  const expMonthly: Record<string, number> = {}
  for (const key of Object.keys(monthlyRevenue)) expMonthly[key] = 0
  for (const exp of expenses) {
    const key = format(exp.date, "MMM yy")
    if (key in expMonthly) expMonthly[key] += Number(exp.amount)
  }
  const expMonthlyData = Object.entries(expMonthly).map(([month, amount]) => ({ month, amount }))

  // Tax data
  const taxInvoices = await prisma.invoice.findMany({
    where: { orgId, status: { not: "DRAFT" } },
    include: { items: { select: { taxRate: true, taxAmount: true } } },
  })
  const taxByRate: Record<string, { rate: number; taxAmount: number; baseAmount: number }> = {}
  for (const inv of taxInvoices) {
    for (const item of inv.items) {
      const rate = Number(item.taxRate)
      if (rate === 0) continue
      const key = `${rate}%`
      if (!taxByRate[key]) taxByRate[key] = { rate, taxAmount: 0, baseAmount: 0 }
      taxByRate[key].taxAmount += Number(item.taxAmount)
    }
  }
  const taxData = Object.values(taxByRate).sort((a, b) => a.rate - b.rate)

  const totalRevenue = filteredInvoices.reduce((s, i) => s + Number(i.total), 0)
  const totalOutstanding = outstanding.reduce((s, i) => s + Number(i.amountDue), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)

  const [org, healthScore] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { currency: true } }),
    calculateHealthScore(orgId),
  ])
  const currency = org?.currency ?? "INR"

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Reports" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-100 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`?tab=${t.id}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                tab === t.id
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </a>
          ))}
        </div>

        {tab === "revenue" && (
          <RevenueTab
            monthlyData={monthlyData}
            topClients={topClients}
            totalRevenue={totalRevenue}
            currency={selectedCurrency}
            availableCurrencies={availableCurrencies}
          />
        )}
        {tab === "outstanding" && (
          <OutstandingTab invoices={outstanding.map((i) => ({
            id: i.id,
            invoiceNumber: i.invoiceNumber,
            clientName: i.client.name,
            amountDue: Number(i.amountDue),
            status: i.status,
            dueDate: i.dueDate?.toISOString() ?? null,
          }))} totalOutstanding={totalOutstanding} currency={currency} />
        )}
        {tab === "expenses" && (
          <ExpensesTab
            byCategory={expByCategory}
            monthlyData={expMonthlyData}
            totalExpenses={totalExpenses}
            currency={currency}
          />
        )}
        {tab === "tax" && <TaxTab taxData={taxData} currency={currency} />}

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Business health score</h2>
          <p className="text-xs text-slate-500 mb-4">AI-powered analysis of your billing patterns</p>
          <HealthCard score={healthScore} />
        </div>
      </div>
    </div>
  )
}
