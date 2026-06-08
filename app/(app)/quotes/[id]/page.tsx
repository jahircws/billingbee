import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { serialize } from "@/lib/serialize"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import { format } from "date-fns"
import ConvertQuoteButton from "./ConvertQuoteButton"
import { fmtCurrency } from "@/lib/currency"

export const metadata = { ...privateMetadata, title: "Quote" }
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
  CONVERTED: "bg-purple-100 text-purple-700",
}

export default async function QuotePage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { id } = await params

  const quote = serialize(await prisma.quote.findUnique({
    where: { id, orgId },
    include: {
      client: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  }))

  if (!quote) notFound()

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { currency: true } })
  const currency = org?.currency ?? "INR"
  const fmt = (n: unknown) => fmtCurrency(Number(n), currency)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={quote.quoteNumber} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-20 md:pb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{quote.quoteNumber}</h2>
            <p className="text-sm text-gray-500">{quote.client.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[quote.status] ?? "bg-gray-100 text-gray-600"}`}>
              {quote.status}
            </span>
            <span className="text-lg font-bold text-gray-900">{fmt(quote.total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <a
            href={`/api/invoice/${quote.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
          >
            Download PDF
          </a>
          {(quote.status as string) !== "CONVERTED" && (
            <ConvertQuoteButton quoteId={quote.id} />
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Issue date</p>
            <p className="font-medium text-gray-800">{format(quote.issueDate, "d MMM yyyy")}</p>
          </div>
          {quote.expiryDate && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Expires</p>
              <p className="font-medium text-gray-800">{format(quote.expiryDate, "d MMM yyyy")}</p>
            </div>
          )}
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
              {quote.items.map((item) => (
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
                <td className="py-2.5 px-4 text-right font-bold text-emerald-600">{fmt(quote.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {quote.notes && (
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <span className="font-medium text-gray-700">Notes: </span>{quote.notes}
          </div>
        )}
      </div>
    </div>
  )
}
