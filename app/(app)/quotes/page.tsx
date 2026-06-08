import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import { format } from "date-fns"
import { Plus, FileText } from "lucide-react"
import { fmtCurrency } from "@/lib/currency"

export const metadata = { ...privateMetadata, title: "Quotes" }
export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ status?: string; search?: string }>
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
  CONVERTED: "bg-purple-100 text-purple-700",
}

export default async function QuotesPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { status, search } = await searchParams

  const where: Record<string, unknown> = { orgId }
  if (status) where.status = status
  if (search) {
    where.OR = [
      { quoteNumber: { contains: search, mode: "insensitive" } },
      { client: { name: { contains: search, mode: "insensitive" } } },
    ]
  }

  const quotes = await prisma.quote.findMany({
    where,
    include: { client: { select: { name: true } } },
    orderBy: { issueDate: "desc" },
    take: 100,
  })

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { currency: true } })
  const currency = org?.currency ?? "INR"
  const total = quotes.reduce((s, q) => s + Number(q.total), 0)
  const fmt = (n: number) => fmtCurrency(n, currency)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Quotes" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-20 md:pb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-500">
            {quotes.length} quote{quotes.length !== 1 ? "s" : ""} · {fmt(total)} total
          </p>
          <Link
            href="/quotes/new"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New quote
          </Link>
        </div>

        <form method="GET" className="flex gap-2 flex-wrap">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search quotes…"
            className="flex-1 min-w-48 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <select
            name="status"
            defaultValue={status ?? ""}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All statuses</option>
            {Object.keys(statusColor).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg">
            Filter
          </button>
          {(status || search) && (
            <a href="/quotes" className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2">Clear</a>
          )}
        </form>

        {quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No quotes yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">Turn a conversation into a quote — paste a chat or email and AI builds it</p>
            <Link
              href="/quotes/new"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-150"
            >
              Turn a conversation into a quote
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium">#</th>
                    <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium">Client</th>
                    <th className="py-3 px-4 text-right text-xs text-gray-400 font-medium">Amount</th>
                    <th className="py-3 px-4 text-center text-xs text-gray-400 font-medium">Status</th>
                    <th className="py-3 px-4 text-right text-xs text-gray-400 font-medium hidden md:table-cell">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/quotes/${quote.id}`} className="font-mono text-xs text-blue-700 hover:underline font-medium">
                          {quote.quoteNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-800 font-medium">{quote.client.name}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">{fmt(Number(quote.total))}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[quote.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500 hidden md:table-cell">
                        {quote.expiryDate ? format(quote.expiryDate, "d MMM yyyy") : "—"}
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
