import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import { format } from "date-fns"
import { Receipt } from "lucide-react"
import NewExpenseButton from "./NewExpenseButton"
import ExpenseRowActions from "./ExpenseRowActions"
import { fmtCurrency } from "@/lib/currency"

export const metadata = { ...privateMetadata, title: "Expenses" }
export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ categoryId?: string; search?: string }>
}

export default async function ExpensesPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { categoryId, search } = await searchParams

  const where: Record<string, unknown> = { orgId }
  if (categoryId) where.categoryId = categoryId
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { vendor: { contains: search, mode: "insensitive" } },
    ]
  }

  const [expenses, categories] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.category.findMany({ where: { orgId, isActive: true }, orderBy: { name: "asc" } }),
  ])

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { currency: true } })
  const currency = org?.currency ?? "INR"
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const fmt = (n: number) => fmtCurrency(n, currency)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Expenses" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-20 md:pb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-500">
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""} · {fmt(total)} total
          </p>
          <NewExpenseButton categories={categories} />
        </div>

        <form method="GET" className="flex gap-2 flex-wrap">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search expenses…"
            className="flex-1 min-w-48 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <select
            name="categoryId"
            defaultValue={categoryId ?? ""}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button type="submit" className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg">
            Filter
          </button>
          {(categoryId || search) && (
            <a href="/expenses" className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2">Clear</a>
          )}
        </form>

        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Receipt className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No expenses yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium">Title</th>
                    <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium hidden md:table-cell">Category</th>
                    <th className="py-3 px-4 text-right text-xs text-gray-400 font-medium">Amount</th>
                    <th className="py-3 px-4 text-center text-xs text-gray-400 font-medium hidden md:table-cell">Status</th>
                    <th className="py-3 px-4 text-right text-xs text-gray-400 font-medium hidden md:table-cell">Date</th>
                    <th className="py-3 px-4 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800">{expense.title}</p>
                        {expense.vendor && <p className="text-xs text-gray-400">{expense.vendor}</p>}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        {expense.category ? (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: expense.category.color ? `${expense.category.color}20` : "#f3f4f6",
                              color: expense.category.color ?? "#6b7280",
                            }}
                          >
                            {expense.category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {fmt(Number(expense.amount))}
                      </td>
                      <td className="py-3 px-4 text-center hidden md:table-cell">
                        {expense.isBillable ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">Unbilled</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-400 hidden md:table-cell">
                        {format(expense.date, "d MMM yyyy")}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <ExpenseRowActions
                          expenseId={expense.id}
                          title={expense.title}
                          amount={Number(expense.amount)}
                          currency={expense.currency}
                          date={format(expense.date, "yyyy-MM-dd")}
                          vendor={expense.vendor}
                          categoryId={expense.categoryId}
                          notes={expense.notes}
                          categories={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
