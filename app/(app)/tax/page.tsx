import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import { Download, AlertCircle } from "lucide-react"
import Link from "next/link"

export const metadata = { ...privateMetadata, title: "GST Assistant" }
export const dynamic = "force-dynamic"

function getQuarterRange() {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const qStart = new Date(year, Math.floor(month / 3) * 3, 1)
  const qEnd = new Date(year, Math.floor(month / 3) * 3 + 3, 0, 23, 59, 59)
  return { qStart, qEnd }
}

function getFilingDeadline() {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  // GSTR-1: 11th of next month; GSTR-3B: 20th of next month (for quarterly it's different)
  const nextMonth = new Date(year, Math.floor(month / 3) * 3 + 3, 20)
  return nextMonth.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}

export default async function TaxPage() {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { qStart, qEnd } = getQuarterRange()

  // Quarter invoices with items (for GST breakdown)
  const invoices = await prisma.invoice.findMany({
    where: { orgId, status: { in: ["PAID", "UNPAID", "OVERDUE"] }, issueDate: { gte: qStart, lte: qEnd } },
    include: {
      items: true,
      client: { select: { name: true, gstin: true } },
    },
  })

  // GST breakdown by rate
  const gstBreakdown: Record<number, { taxable: number; gst: number }> = {}
  let totalTaxable = 0
  let totalGst = 0

  for (const inv of invoices) {
    for (const item of inv.items) {
      const taxRate = Number(item.taxRate)
      if (!gstBreakdown[taxRate]) gstBreakdown[taxRate] = { taxable: 0, gst: 0 }
      const taxable = Number(item.quantity) * Number(item.unitPrice)
      const gst = Number(item.taxAmount)
      gstBreakdown[taxRate].taxable += taxable
      gstBreakdown[taxRate].gst += gst
      totalTaxable += taxable
      totalGst += gst
    }
  }

  // Clients missing GSTIN
  const allClients = await prisma.client.findMany({
    where: { orgId },
    select: { id: true, name: true, gstin: true },
  })
  const missingGstin = allClients.filter((c) => !c.gstin)

  const filingDeadline = getFilingDeadline()
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const qLabel = (() => {
    const m = qStart.getMonth()
    const y = qStart.getFullYear()
    const quarters: Record<number, string> = { 0: "Jan–Mar", 3: "Apr–Jun", 6: "Jul–Sep", 9: "Oct–Dec" }
    return `${quarters[m]} ${y}`
  })()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Topbar title="GST Assistant" />
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GST Assistant</h1>
            <p className="text-gray-500 text-sm mt-0.5">Quarter: {qLabel}</p>
          </div>
          <a
            href="/api/tax/export-csv"
            className="inline-flex items-center gap-2 text-sm font-semibold border border-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export GST CSV
          </a>
        </div>

        {/* GST Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">GST Summary — {qLabel}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Taxable Amount</p>
              <p className="text-xl font-bold text-gray-900">{fmt(totalTaxable)}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Total GST Collected</p>
              <p className="text-xl font-bold text-emerald-700">{fmt(totalGst)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Invoices this quarter</p>
              <p className="text-xl font-bold text-blue-700">{invoices.length}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Filing Deadline</p>
              <p className="text-sm font-bold text-amber-700">{filingDeadline}</p>
            </div>
          </div>

          {/* By rate */}
          {Object.keys(gstBreakdown).length > 0 ? (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">GST Rate</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Taxable Amount</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">GST Collected</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">CGST</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">SGST</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(gstBreakdown)
                    .filter(([, v]) => v.gst > 0)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([rate, { taxable, gst }]) => (
                      <tr key={rate} className="border-b border-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{rate}%</td>
                        <td className="px-4 py-3 text-right text-gray-700">{fmt(taxable)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmt(gst)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{fmt(gst / 2)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{fmt(gst / 2)}</td>
                      </tr>
                    ))}
                  <tr className="bg-gray-50 font-bold">
                    <td className="px-4 py-3 text-gray-900">Total</td>
                    <td className="px-4 py-3 text-right text-gray-900">{fmt(totalTaxable)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{fmt(totalGst)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(totalGst / 2)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(totalGst / 2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No taxable invoices this quarter</p>
          )}
        </div>

        {/* Missing GSTIN alert */}
        {missingGstin.length > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {missingGstin.length} client{missingGstin.length !== 1 ? "s" : ""} missing GSTIN
              </p>
              <p className="text-xs text-amber-700 mt-0.5 mb-2">
                Add GSTINs for B2B compliance and accurate GSTR-1 filing.
              </p>
              <div className="flex flex-wrap gap-2">
                {missingGstin.slice(0, 5).map((c) => (
                  <Link
                    key={c.id}
                    href={`/clients/${c.id}`}
                    className="text-xs bg-amber-100 text-amber-800 font-medium px-2.5 py-1 rounded-lg hover:bg-amber-200"
                  >
                    {c.name} →
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
