import { notFound, redirect } from "next/navigation"
import { fmtCurrency } from "@/lib/currency"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import Link from "next/link"
import { format } from "date-fns"
import QuoteActions from "./QuoteActions"

interface Props {
  params: Promise<{ orgSlug: string; id: string }>
}

export const dynamic = "force-dynamic"

export default async function PortalQuotePage({ params }: Props) {
  const { orgSlug, id } = await params
  const session = await auth()

  if (!session?.user?.clientId || session.user.userType !== "CLIENT") {
    redirect(`/portal/${orgSlug}/login`)
  }

  const quote = await prisma.quote.findUnique({
    where: { id, clientId: session.user.clientId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  })

  if (!quote) notFound()

  const fmt = (n: unknown) => fmtCurrency(n, quote.currency)

  return (
    <div className="max-w-2xl mx-auto w-full p-4 md:p-8 space-y-6">
      <div>
        <Link href={`/portal/${orgSlug}/dashboard`} className="text-xs text-gray-400 hover:text-gray-600 mb-2 block">
          ← Back to portal
        </Link>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{quote.quoteNumber}</h1>
          <p className="text-2xl font-black text-gray-900">{fmt(quote.total)}</p>
        </div>
      </div>

      {quote.expiryDate && (
        <p className="text-sm text-gray-500">Expires {format(quote.expiryDate, "d MMM yyyy")}</p>
      )}

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
                <td className="py-2.5 px-4 text-right font-medium">{fmt(item.total)}</td>
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

      {quote.status === "SENT" && (
        <QuoteActions quoteId={quote.id} orgSlug={orgSlug} />
      )}

      {quote.status === "ACCEPTED" && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-lg font-medium">
          You accepted this quote.
        </div>
      )}
      {quote.status === "REJECTED" && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg font-medium">
          You declined this quote.
        </div>
      )}
    </div>
  )
}
