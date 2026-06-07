import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { privateMetadata } from "@/lib/metadata"
import { Topbar } from "@/components/layout/Topbar"
import CollectionsTab from "./CollectionsTab"
import { format } from "date-fns"

export const metadata = { ...privateMetadata, title: "Invoice" }
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function InvoicePage({ params, searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { id } = await params
  const { tab = "details" } = await searchParams

  const invoice = await prisma.invoice.findUnique({
    where: { id, orgId },
    include: {
      client: true,
      items: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      collectionEvents: { orderBy: { scheduledAt: "asc" } },
    },
  })

  if (!invoice) notFound()

  const fmt = (n: unknown) =>
    `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`

  const statusColor: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    UNPAID: "bg-amber-100 text-amber-700",
    PAID: "bg-emerald-100 text-emerald-700",
    OVERDUE: "bg-red-100 text-red-700",
  }

  const tabs = [
    { id: "details", label: "Details" },
    { id: "collections", label: `Follow-ups (${invoice.collectionEvents.length})` },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={invoice.invoiceNumber} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-20 md:pb-6">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</h2>
            <p className="text-sm text-gray-500">{invoice.client.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[invoice.status] ?? "bg-gray-100 text-gray-600"}`}>
              {invoice.status}
            </span>
            <span className="text-lg font-bold text-gray-900">{fmt(invoice.total)}</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-100">
          {tabs.map((t) => (
            <a
              key={t.id}
              href={`?tab=${t.id}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.id
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </a>
          ))}
        </div>

        {/* Details tab */}
        {tab === "details" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Issue date</p>
                <p className="font-medium text-gray-800">{format(invoice.issueDate, "d MMM yyyy")}</p>
              </div>
              {invoice.dueDate && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Due date</p>
                  <p className="font-medium text-gray-800">{format(invoice.dueDate, "d MMM yyyy")}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Amount due</p>
                <p className="font-semibold text-red-600">{fmt(invoice.amountDue)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Auto follow-up</p>
                <p className={`font-medium ${invoice.autoFollowUp ? "text-emerald-600" : "text-gray-400"}`}>
                  {invoice.autoFollowUp ? "Active" : "Off"}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="py-2.5 px-4 text-left text-xs text-gray-400 font-medium">Description</th>
                    <th className="py-2.5 px-4 text-center text-xs text-gray-400 font-medium">Qty</th>
                    <th className="py-2.5 px-4 text-right text-xs text-gray-400 font-medium">Rate</th>
                    <th className="py-2.5 px-4 text-right text-xs text-gray-400 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 px-4 text-gray-800">{item.description}</td>
                      <td className="py-2.5 px-4 text-center text-gray-600">{Number(item.quantity)}</td>
                      <td className="py-2.5 px-4 text-right text-gray-600">{fmt(item.unitPrice)}</td>
                      <td className="py-2.5 px-4 text-right text-gray-800">{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td colSpan={3} className="py-2.5 px-4 text-right text-xs text-gray-400 font-medium">Total</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-600">{fmt(invoice.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {invoice.notes && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <span className="font-medium text-gray-700">Notes: </span>{invoice.notes}
              </div>
            )}
          </div>
        )}

        {/* Collections tab */}
        {tab === "collections" && (
          <CollectionsTab
            invoiceId={invoice.id}
            orgId={orgId}
            events={invoice.collectionEvents.map((e) => ({
              id: e.id,
              dayNumber: e.dayNumber,
              tone: e.tone,
              status: e.status,
              scheduledAt: e.scheduledAt.toISOString(),
              sentAt: e.sentAt?.toISOString() ?? null,
              subject: e.subject,
              textBody: e.textBody,
              autoFollowUp: invoice.autoFollowUp,
            }))}
          />
        )}
      </div>
    </div>
  )
}
