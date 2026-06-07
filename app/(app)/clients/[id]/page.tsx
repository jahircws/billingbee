import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import { format } from "date-fns"
import InviteClientButton from "./InviteClientButton"
import PipelineTimeline from "./PipelineTimeline"
import { fmtCurrency } from "@/lib/currency"

export const metadata = { ...privateMetadata, title: "Client" }
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  UNPAID: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
}

export default async function ClientPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { id } = await params

  const client = await prisma.client.findUnique({
    where: { id, orgId },
    include: {
      invoices: {
        orderBy: { issueDate: "desc" },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          total: true,
          amountDue: true,
          amountPaid: true,
          issueDate: true,
          dueDate: true,
        },
      },
      proposals: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, createdAt: true },
        take: 1,
      },
      contracts: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, signedAt: true },
        take: 1,
      },
    },
  })

  if (!client) notFound()

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { currency: true } })
  const currency = org?.currency ?? "INR"
  const fmt = (n: unknown) => fmtCurrency(Number(n), currency)

  const totalBilled = client.invoices.reduce((s, i) => s + Number(i.total), 0)
  const totalPaid = client.invoices.reduce((s, i) => s + Number(i.amountPaid), 0)
  const totalOutstanding = client.invoices.reduce((s, i) => s + Number(i.amountDue), 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={client.name} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-20 md:pb-6">
        {/* Client info */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
              {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
              {client.phone && <p className="text-sm text-gray-500">{client.phone}</p>}
              {client.address && <p className="text-sm text-gray-400 mt-1">{client.address}</p>}
            </div>
            <div className="flex gap-2 flex-wrap">
            {client.email && <InviteClientButton clientId={client.id} />}
            <Link
              href={`/invoices/new?clientId=${client.id}`}
              className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              + Invoice
            </Link>
            </div>
          </div>
        </div>

        {/* Pipeline timeline */}
        <PipelineTimeline
          proposal={client.proposals[0] ?? null}
          contract={client.contracts[0] ?? null}
          invoices={client.invoices}
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Billed</p>
            <p className="text-sm font-bold text-gray-900">{fmt(totalBilled)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Paid</p>
            <p className="text-sm font-bold text-emerald-600">{fmt(totalPaid)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Outstanding</p>
            <p className="text-sm font-bold text-red-500">{fmt(totalOutstanding)}</p>
          </div>
        </div>

        {/* Invoice history */}
        {client.invoices.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Invoice history</h3>
            </div>
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
                {client.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-4">
                      <Link href={`/invoices/${invoice.id}`} className="font-mono text-xs text-emerald-700 hover:underline font-medium">
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-900">{fmt(invoice.total)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[invoice.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-500 hidden md:table-cell">
                      {invoice.dueDate ? format(invoice.dueDate, "d MMM yyyy") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
