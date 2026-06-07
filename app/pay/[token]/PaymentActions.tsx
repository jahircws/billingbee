"use client"

import { useState } from "react"
import { CheckCircle, Copy, Loader2 } from "lucide-react"
import Image from "next/image"

interface Props {
  token: string
  invoiceId: string
  amount: number
  currency: string
  gateways: string[]
  qrDataUrl: string
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

export default function PaymentActions({ token, invoiceId, amount, currency, gateways, qrDataUrl }: Props) {
  const [selected, setSelected] = useState<string>(gateways[0] ?? "")
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)
  const [copied, setCopied] = useState(false)

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
  const pageUrl = typeof window !== "undefined" ? window.location.href : ""

  async function handlePay() {
    setLoading(true)
    try {
      if (selected === "RAZORPAY") {
        await payRazorpay()
      } else if (selected === "STRIPE") {
        await payStripe()
      } else if (selected === "PAYPAL") {
        await payPaypal()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Payment failed. Please try again.")
    }
    setLoading(false)
  }

  async function payRazorpay() {
    const res = await fetch("/api/payments/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, token }),
    })
    const { orderId, amount: amountPaise, currency: cur, keyId, error } = await res.json()
    if (error) throw new Error(error)

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Razorpay"))
      document.head.appendChild(script)
    })

    await new Promise<void>((resolve, reject) => {
      const rz = new window.Razorpay({
        key: keyId,
        amount: amountPaise,
        currency: cur,
        order_id: orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const vRes = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              invoiceId,
              token,
            }),
          })
          const v = await vRes.json()
          if (v.success) { setPaid(true); resolve() }
          else reject(new Error("Payment verification failed"))
        },
        modal: { ondismiss: () => reject(new Error("cancelled")) },
      })
      rz.open()
    })
  }

  async function payStripe() {
    const res = await fetch("/api/payments/stripe/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, token }),
    })
    const { sessionUrl, error } = await res.json()
    if (error) throw new Error(error)
    window.location.href = sessionUrl
  }

  async function payPaypal() {
    const res = await fetch("/api/payments/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, token }),
    })
    const { id, error } = await res.json()
    if (error) throw new Error(error)
    // PayPal JS SDK handles the UI — for now redirect to approval URL
    const approveRes = await fetch("/api/payments/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, token }),
    })
    void approveRes // PayPal button SDK handles redirect; this is a placeholder
    alert(`PayPal order ${id} created. Complete payment in the PayPal window.`)
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(pageUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const whatsappText = encodeURIComponent(
    `Your invoice for ${fmt(amount)} is ready. Pay securely here: ${pageUrl}`
  )

  if (paid) {
    return (
      <div className="text-center py-6 space-y-2">
        <CheckCircle size={40} className="text-emerald-600 mx-auto" />
        <p className="font-semibold text-gray-900">Payment successful!</p>
        <p className="text-sm text-gray-500">Thank you — a receipt has been recorded.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-gray-800">Pay {fmt(amount)}</h3>

      {/* Gateway selector */}
      {gateways.length > 1 && (
        <div className="flex gap-2">
          {gateways.map((gw) => (
            <button
              key={gw}
              onClick={() => setSelected(gw)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                selected === gw
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {gw === "RAZORPAY" ? "Razorpay" : gw === "STRIPE" ? "Card / Stripe" : "PayPal"}
            </button>
          ))}
        </div>
      )}

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {loading ? "Processing..." : `Pay ${fmt(amount)} via ${selected === "RAZORPAY" ? "Razorpay" : selected === "STRIPE" ? "Card" : "PayPal"}`}
      </button>

      {/* Share row */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        {/* QR code */}
        <div className="shrink-0">
          <Image src={qrDataUrl} alt="QR code" width={72} height={72} className="rounded-lg border border-gray-100" />
        </div>

        <div className="flex-1 space-y-2">
          <button
            onClick={copyUrl}
            className="w-full flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium py-2 rounded-lg transition-colors"
          >
            {copied ? <CheckCircle size={13} className="text-emerald-600" /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy payment link"}
          </button>

          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-medium py-2 rounded-lg transition-colors"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Share via WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
