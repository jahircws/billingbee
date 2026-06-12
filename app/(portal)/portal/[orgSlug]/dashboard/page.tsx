import { redirect } from "next/navigation"
import { fmtCurrency } from "@/lib/currency"
import { paymentMethodLabel } from "@/lib/payment"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import Link from "next/link"
import { format } from "date-fns"

interface Props {
  params: Promise<{ orgSlug: string }>
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  UNPAID: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  SIGNED: "bg-purple-100 text-purple-700",
}

export const dynamic = "force-dynamic"

export default async function PortalDashboardPage({ params }: Props) {
  const { orgSlug } = await params
  const session = await auth()

  if (!session?.user?.clientId || session.user.userType !== "CLIENT") {
    redirect(`/portal/${orgSlug}/login`)
  }

  const clientId = session.user.clientId

  const [client, invoices, quotes, proposals, contracts, payments] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId }, select: { name: true } }),
    prisma.invoice.findMany({
      where: { clientId },
      orderBy: { issueDate: "desc" },
      select: { id: true, invoiceNumber: true, status: true, total: true, amountDue: true, dueDate: true, issueDate: true, currency: true },
    }),
    prisma.quote.findMany({
      where: { clientId },
      orderBy: { issueDate: "desc" },
      select: { id: true, quoteNumber: true, status: true, total: true, expiryDate: true, issueDate: true, currency: true },
    }),
    prisma.proposal.findMany({
      where: { clientId, status: { in: ["SENT", "ACCEPTED", "REJECTED"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, createdAt: true },
    }),
    prisma.contract.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, signedAt: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { invoice: { clientId } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, amount: true, createdAt: true, paidAt: true, method: true, invoice: { select: { invoiceNumber: true, currency: true } } },
    }),
  ])

  const overdueInvoices = invoices.filter((i) => i.status === "UNPAID" || i.status === "OVERDUE")
  const overdueCount = overdueInvoices.length

  return (
    <div className="max-w-3xl mx-auto w-full p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {client?.name}</h1>
        {overdueCount > 0 && (
          <p className="text-sm text-amber-700 mt-1 font-medium">
            {overdueCount} invoice{overdueCount > 1 ? "s" : ""} outstanding
          </p>
        )}
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Invoices</h2>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="py-2.5 px-4 text-left text-xs text-gray-400 font-medium">#</th>
                  <th className="py-2.5 px-4 text-right text-xs text-gray-400 font-medium">Amount</th>
                  <th className="py-2.5 px-4 text-center text-xs text-gray-400 font-medium">Status</th>
                  <th className="py-2.5 px-4 text-right text-xs text-gray-400 font-medium hidden md:table-cell">Due</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-4">
                      <Link href={`/portal/${orgSlug}/invoice/${inv.id}`}
                        className="font-mono text-xs text-emerald-700 hover:underline font-medium">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-900">{fmtCurrency(inv.total, inv.currency)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-400 hidden md:table-cell">
                      {inv.dueDate ? format(inv.dueDate, "d MMM yyyy") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Quotes */}
      {quotes.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Quotes</h2>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="py-2.5 px-4 text-left text-xs text-gray-400 font-medium">#</th>
                  <th className="py-2.5 px-4 text-right text-xs text-gray-400 font-medium">Amount</th>
                  <th className="py-2.5 px-4 text-center text-xs text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-4">
                      <Link href={`/portal/${orgSlug}/quote/${q.id}`}
                        className="font-mono text-xs text-blue-700 hover:underline font-medium">
                        {q.quoteNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-900">{fmtCurrency(q.total, q.currency)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[q.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Proposals */}
      {proposals.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Proposals
            {proposals.some((p) => p.status === "SENT") && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                Action required
              </span>
            )}
          </h2>
          <div className="space-y-2">
            {proposals.map((p) => (
              <Link key={p.id} href={`/portal/${orgSlug}/proposal/${p.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 transition-colors">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{p.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{format(p.createdAt, "d MMM yyyy")}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {p.status === "SENT" ? "Awaiting response" : p.status}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Contracts */}
      {contracts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Contracts</h2>
          <div className="space-y-2">
            {contracts.map((c) => (
              <Link key={c.id} href={`/portal/${orgSlug}/contract/${c.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4 hover:border-emerald-200 transition-colors">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{c.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c.signedAt ? `Signed ${format(c.signedAt, "d MMM yyyy")}` : format(c.createdAt, "d MMM yyyy")}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {c.status}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Transaction History */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Transaction History</h2>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {payments.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="py-2.5 px-4 text-left text-xs text-gray-400 font-medium">Date</th>
                  <th className="py-2.5 px-4 text-left text-xs text-gray-400 font-medium">Invoice</th>
                  <th className="py-2.5 px-4 text-left text-xs text-gray-400 font-medium hidden md:table-cell">Method</th>
                  <th className="py-2.5 px-4 text-right text-xs text-gray-400 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 px-4 text-gray-500">{format(p.paidAt ?? p.createdAt, "d MMM yyyy")}</td>
                    <td className="py-2.5 px-4 font-mono text-xs text-emerald-700 font-medium">{p.invoice.invoiceNumber}</td>
                    <td className="py-2.5 px-4 text-gray-500 hidden md:table-cell">{paymentMethodLabel(p.method)}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-emerald-700">
                      {fmtCurrency(p.amount, p.invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-8 px-4 text-center text-sm text-gray-400">No payments yet.</p>
          )}
        </div>
      </section>

      {invoices.length === 0 && quotes.length === 0 && proposals.length === 0 && contracts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">No documents yet.</p>
        </div>
      )}
    </div>
  )
}
