import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import { format } from "date-fns"
import { Plus, FileText } from "lucide-react"
import { fmtCurrency } from "@/lib/currency"
import InvoiceRowActions from "./InvoiceRowActions"
import OpenCopilotButton from "@/components/ai/OpenCopilotButton"

export const metadata = { ...privateMetadata, title: "Invoices" }
export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ status?: string; search?: string }>
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  UNPAID: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
}

export default async function InvoicesPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { status, search } = await searchParams

  const where: Record<string, unknown> = { orgId }
  if (status) where.status = status
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { client: { name: { contains: search, mode: "insensitive" } } },
    ]
  }

  const [invoices, org] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { client: { select: { name: true, email: true } } },
      orderBy: { issueDate: "desc" },
      take: 100,
    }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { currency: true } }),
  ])
  const orgCurrency = org?.currency ?? "INR"
  const total = invoices.reduce((s, i) => s + Number(i.total), 0)
  const fmt = (n: number) => fmtCurrency(n, orgCurrency)

  const statuses = ["DRAFT", "UNPAID", "PAID", "OVERDUE"]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Invoices" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-500">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} · {fmt(total)} total
          </p>
          <Link
            href="/invoices/new"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New invoice
          </Link>
        </div>

        {/* Filters */}
        <form method="GET" className="flex gap-2 flex-wrap">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search invoices…"
            className="flex-1 min-w-48 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <select
            name="status"
            defaultValue={status ?? ""}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            type="submit"
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
          >
            Filter
          </button>
          {(status || search) && (
            <a href="/invoices" className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2">
              Clear
            </a>
          )}
        </form>

        {/* Table */}
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No invoices yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">Your AI assistant can create one for you in seconds</p>
            <OpenCopilotButton />
            <p className="text-xs text-gray-400 mt-3">
              Try: <em>&quot;Invoice Acme Corp ₹10,000 for design work&quot;</em>
            </p>
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
                    <th className="py-3 px-4 text-right text-xs text-gray-400 font-medium hidden md:table-cell">Due</th>
                    <th className="py-3 px-4 text-right text-xs text-gray-400 font-medium hidden lg:table-cell">Issued</th>
                    <th className="py-3 px-4 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-mono text-xs text-emerald-700 hover:underline font-medium"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {invoice.client.name}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {fmtCurrency(Number(invoice.total), invoice.currency)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[invoice.status] ?? "bg-gray-100 text-gray-600"}`}>
                            {invoice.status}
                          </span>
                          {invoice.isRecurring && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700" title="Recurring invoice">
                              ↻
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500 hidden md:table-cell">
                        {invoice.dueDate ? format(invoice.dueDate, "d MMM yyyy") : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-400 hidden lg:table-cell">
                        {format(invoice.issueDate, "d MMM yyyy")}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <InvoiceRowActions
                          invoiceId={invoice.id}
                          invoiceNumber={invoice.invoiceNumber}
                          status={invoice.status}
                          clientEmail={invoice.client.email ?? null}
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
