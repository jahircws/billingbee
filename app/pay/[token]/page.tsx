import { notFound } from "next/navigation"
import { verifyPaymentToken } from "@/lib/payment-token"
import { getConfiguredGateways } from "@/lib/gateway-config"
import prisma from "@/lib/db"
import { cacheGetOrSet } from "@/lib/redis-cache"
import { generatePageMetadata } from "@/lib/metadata"
import type { Metadata } from "next"
import { format } from "date-fns"
import QRCode from "qrcode"
import PaymentActions from "./PaymentActions"
import { fmtCurrency } from "@/lib/currency"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ token: string }>
  searchParams: Promise<{ paid?: string; session_id?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  try {
    const { invoiceId } = verifyPaymentToken(token)
    const inv = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { invoiceNumber: true, total: true },
    })
    if (!inv) return { robots: { index: false, follow: false } }
    return {
      title: `Pay Invoice ${inv.invoiceNumber} — BillingBee`,
      description: `Securely pay invoice ${inv.invoiceNumber} online.`,
      robots: { index: false, follow: false },
    }
  } catch {
    return { robots: { index: false, follow: false } }
  }
}

export default async function PayPage({ params, searchParams }: Props) {
  const { token } = await params
  const { paid: paidParam, session_id: sessionId } = await searchParams

  let invoiceId: string, orgId: string
  try {
    const payload = verifyPaymentToken(token)
    invoiceId = payload.invoiceId
    orgId = payload.orgId
  } catch {
    notFound()
  }

  // Bypass cache when returning from payment (?paid=true) to get fresh status
  const fetchInvoice = () =>
    prisma.invoice.findUnique({
      where: { id: invoiceId, orgId },
      include: {
        client: true,
        items: true,
        org: { select: { name: true, email: true, address: true, gstin: true } },
      },
    })

  const invoice = paidParam
    ? await fetchInvoice()
    : await cacheGetOrSet(`pay_invoice:${invoiceId}`, fetchInvoice, 300)

  if (!invoice) notFound()

  // Returning from a Stripe Checkout success redirect. The webhook is the source
  // of truth, but it may not have landed yet — so confirm the session read-only
  // and show a success/"confirming" state instead of re-showing the payment form.
  let paymentConfirmed = false
  let confirmingPayment = false
  if (paidParam === "true" && invoice.status !== "PAID") {
    confirmingPayment = true
    if (sessionId) {
      try {
        const { getStripeConfig } = await import("@/lib/gateway-config")
        const Stripe = (await import("stripe")).default
        const { secretKey } = await getStripeConfig(orgId)
        const stripe = new Stripe(secretKey)
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        if (session.payment_status === "paid") paymentConfirmed = true
      } catch {
        // fall back to the confirming state + auto-refresh
      }
    }
  }

  // Fetch gateways + QR in parallel
  const [configuredGatewayIds, qrDataUrl] = await Promise.all([
    getConfiguredGateways(orgId),
    QRCode.toDataURL(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"}/pay/${token}`,
      { width: 160, margin: 1, color: { light: "#ffffff", dark: "#111827" } }
    ),
  ])

  type Gateway = {
    id: 'razorpay' | 'stripe' | 'paypal' | 'upi'
    label: string
    fee: string
    badge?: string
    disabled?: boolean
    disabledLabel?: string
  }

  const razorpayConfigured = configuredGatewayIds.includes("RAZORPAY")
  const stripeConfigured = configuredGatewayIds.includes("STRIPE")

  const gateways: Gateway[] = []

  if (razorpayConfigured) {
    gateways.push({
      id: 'razorpay',
      label: 'Razorpay',
      fee: '2% fee',
      badge: invoice.currency === 'INR' ? 'Recommended for India' : undefined,
    })
    if (invoice.currency === 'INR') {
      gateways.push({ id: 'upi', label: 'UPI', fee: 'Free', badge: 'Instant' })
    }
  }

  if (stripeConfigured) {
    gateways.push({ id: 'stripe', label: 'Card / Stripe', fee: '2.9% + $0.30' })
  }

  gateways.push({
    id: 'paypal',
    label: 'PayPal',
    fee: '2.99% fee',
    disabled: true,
    disabledLabel: 'Coming Soon',
  })

  const fmt = (n: unknown) => fmtCurrency(n, invoice.currency)

  const isPaid = invoice.status === "PAID" || paymentConfirmed
  // While confirming (Stripe redirect landed before the webhook), suppress the
  // payment form and auto-refresh so the user never lands back on "pay now".
  const showForm = !isPaid && !confirmingPayment

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-10 px-4">
      {/* Auto-refresh while waiting for the payment webhook to confirm */}
      {!isPaid && confirmingPayment && <meta httpEquiv="refresh" content="4" />}
      <div className="w-full max-w-2xl space-y-4">
        {/* Header */}
        <div className="text-center">
          <span className="text-2xl font-black text-emerald-600">Billing</span>
          <span className="text-2xl font-black text-gray-900">Bee</span>
        </div>

        {/* Invoice card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Status banner */}
          {isPaid && (
            <div className="bg-emerald-600 text-white text-center py-3 text-sm font-semibold">
              ✓ This invoice has been paid. Thank you!
            </div>
          )}
          {!isPaid && confirmingPayment && (
            <div className="bg-emerald-50 text-emerald-700 text-center py-3 text-sm font-semibold">
              Payment received — confirming with your bank. This page will update automatically…
            </div>
          )}

          <div className="p-6 md:p-8 space-y-6">
            {/* From / To */}
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">From</p>
                <p className="font-semibold text-gray-900">{invoice.org.name}</p>
                {invoice.org.email && <p className="text-sm text-gray-500">{invoice.org.email}</p>}
                {invoice.org.gstin && <p className="text-xs text-gray-400">GSTIN: {invoice.org.gstin}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Invoice</p>
                <p className="font-bold text-gray-900 text-lg">{invoice.invoiceNumber}</p>
                <p className="text-xs text-gray-400">
                  {format(invoice.issueDate, "d MMM yyyy")}
                </p>
                {invoice.dueDate && (
                  <p className="text-xs text-gray-400">
                    Due {format(invoice.dueDate, "d MMM yyyy")}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Bill To</p>
              <p className="font-semibold text-gray-800">{invoice.client.name}</p>
              {invoice.client.company && <p className="text-sm text-gray-500">{invoice.client.company}</p>}
              {invoice.client.email && <p className="text-sm text-gray-500">{invoice.client.email}</p>}
            </div>

            {/* Line items */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50">
                  <th className="py-2 px-2 text-left text-xs text-gray-400 font-medium">Description</th>
                  <th className="py-2 px-2 text-center text-xs text-gray-400 font-medium">Qty</th>
                  <th className="py-2 px-2 text-right text-xs text-gray-400 font-medium">Rate</th>
                  <th className="py-2 px-2 text-right text-xs text-gray-400 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="py-2.5 px-2 text-gray-800">{item.description}</td>
                    <td className="py-2.5 px-2 text-center text-gray-600">{Number(item.quantity)}</td>
                    <td className="py-2.5 px-2 text-right text-gray-600">{fmt(item.unitPrice)}</td>
                    <td className="py-2.5 px-2 text-right text-gray-800">{fmt(Number(item.quantity) * Number(item.unitPrice))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-48 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{fmt(invoice.subtotal)}</span>
                </div>
                {Number(invoice.taxAmount) > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Tax</span>
                    <span>{fmt(invoice.taxAmount)}</span>
                  </div>
                )}
                {Number(invoice.discountAmount) > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Discount</span>
                    <span>-{fmt(invoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-emerald-600">{fmt(invoice.total)}</span>
                </div>
                {!isPaid && Number(invoice.amountDue) > 0 && (
                  <div className="flex justify-between text-sm font-semibold text-red-600">
                    <span>Amount Due</span>
                    <span>{fmt(invoice.amountDue)}</span>
                  </div>
                )}
              </div>
            </div>

            {invoice.notes && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <span className="font-medium text-gray-700">Note: </span>{invoice.notes}
              </div>
            )}
          </div>

          {/* Payment actions — client component */}
          {showForm && gateways.some((g) => !g.disabled) && (
            <div className="border-t border-gray-100 p-6 md:p-8">
              <PaymentActions
                token={token}
                invoiceId={invoiceId}
                amount={Number(invoice.amountDue)}
                currency={invoice.currency}
                gateways={gateways}
                qrDataUrl={qrDataUrl}
              />
            </div>
          )}

          {showForm && !gateways.some((g) => !g.disabled) && (
            <div className="border-t border-gray-100 p-6 text-center text-sm text-gray-400">
              Contact {invoice.org.name} to arrange payment.
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          Secured by BillingBee · billingbee.co
        </p>
      </div>
    </div>
  )
}
