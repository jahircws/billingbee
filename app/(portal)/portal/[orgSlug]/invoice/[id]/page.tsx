import { notFound, redirect } from "next/navigation"
import { fmtCurrency } from "@/lib/currency"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import Link from "next/link"
import { format } from "date-fns"
import { generatePaymentToken } from "@/lib/payment-token"

interface Props {
  params: Promise<{ orgSlug: string; id: string }>
}

export const dynamic = "force-dynamic"

export default async function PortalInvoicePage({ params }: Props) {
  const { orgSlug, id } = await params
  const session = await auth()

  if (!session?.user?.clientId || session.user.userType !== "CLIENT") {
    redirect(`/portal/${orgSlug}/login`)
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id, clientId: session.user.clientId },
    include: { client: true, items: { orderBy: { sortOrder: "asc" } } },
  })

  if (!invoice) notFound()

  const fmt = (n: unknown) => fmtCurrency(n, invoice.currency)

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://billingbee.co"
  const paymentToken = generatePaymentToken(invoice.id, (invoice as { orgId: string }).orgId)
  const paymentLink = `${base}/pay/${paymentToken}`
  const pdfUrl = `/api/invoice/${invoice.id}/pdf`

  return (
    <div className="max-w-2xl mx-auto w-full p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href={`/portal/${orgSlug}/dashboard`} className="text-xs text-gray-400 hover:text-gray-600 mb-2 block">
            ← Back to portal
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-gray-900">{fmt(invoice.total)}</p>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mt-1 inline-block ${
            invoice.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
            invoice.status === "OVERDUE" ? "bg-red-100 text-red-700" :
            "bg-amber-100 text-amber-700"
          }`}>{invoice.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Issue date</p>
          <p className="font-medium">{format(invoice.issueDate, "d MMM yyyy")}</p>
        </div>
        {invoice.dueDate && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Due date</p>
            <p className="font-medium">{format(invoice.dueDate, "d MMM yyyy")}</p>
          </div>
        )}
        {Number(invoice.amountDue) > 0 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Amount due</p>
            <p className="font-semibold text-red-600">{fmt(invoice.amountDue)}</p>
          </div>
        )}
      </div>

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
                <td className="py-2.5 px-4 text-right font-medium text-gray-900">{fmt(item.total)}</td>
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

      {/* Actions */}
      <div className="flex gap-3">
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors text-sm"
        >
          Download PDF
        </a>
        {(invoice.status === "UNPAID" || invoice.status === "OVERDUE") && (
          <a
            href={paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            Pay {fmt(invoice.amountDue)} now
          </a>
        )}
      </div>
    </div>
  )
}
