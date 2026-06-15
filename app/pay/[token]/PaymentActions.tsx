"use client"

import { useState } from "react"
import { CheckCircle, Copy, Loader2 } from "lucide-react"
import { fmtCurrency } from "@/lib/currency"
import Image from "next/image"

type Gateway = {
  id: 'razorpay' | 'stripe' | 'paypal' | 'upi'
  label: string
  fee: string
  badge?: string
  disabled?: boolean
  disabledLabel?: string
}

interface Props {
  token: string
  invoiceId: string
  amount: number
  currency: string
  gateways: Gateway[]
  qrDataUrl: string
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

function GatewayLogo({ id }: { id: Gateway['id'] }) {
  const configs: Record<Gateway['id'], { letter: string; bg: string; text: string }> = {
    razorpay: { letter: 'R', bg: 'bg-blue-600',   text: 'text-white' },
    stripe:   { letter: 'S', bg: 'bg-purple-600', text: 'text-white' },
    paypal:   { letter: 'P', bg: 'bg-blue-500',   text: 'text-white' },
    upi:      { letter: 'UPI', bg: 'bg-orange-500', text: 'text-white' },
  }
  const { letter, bg, text } = configs[id]
  return (
    <div className={`w-9 h-9 rounded-lg ${bg} ${text} flex items-center justify-center font-bold text-xs shrink-0`}>
      {letter}
    </div>
  )
}

function BadgePill({ label }: { label: string }) {
  const styles: Record<string, string> = {
    'Recommended for India': 'bg-emerald-100 text-emerald-700',
    'Instant':               'bg-blue-100 text-blue-700',
    'Coming Soon':           'bg-slate-100 text-slate-500',
  }
  const cls = styles[label] ?? 'bg-slate-100 text-slate-500'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}

export default function PaymentActions({ token, invoiceId, amount, currency, gateways, qrDataUrl }: Props) {
  const firstActive = gateways.find((g) => !g.disabled)
  const [selected, setSelected] = useState<Gateway['id']>(firstActive?.id ?? 'razorpay')
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)
  const [copied, setCopied] = useState(false)

  const fmt = (n: number) => fmtCurrency(n, currency)
  const pageUrl = typeof window !== "undefined" ? window.location.href : ""

  const selectedGateway = gateways.find((g) => g.id === selected)

  async function handlePay() {
    if (selectedGateway?.disabled) return
    setLoading(true)
    try {
      if (selected === "razorpay") {
        await payRazorpay()
      } else if (selected === "upi") {
        await payRazorpay({ method: "upi" })
      } else if (selected === "stripe") {
        await payStripe()
      } else if (selected === "paypal") {
        await payPaypal()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Payment failed. Please try again.")
    }
    setLoading(false)
  }

  async function payRazorpay(extraOptions: Record<string, string> = {}) {
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
        ...extraOptions,
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

      {/* Gateway cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {gateways.map((gw) => {
          const isSelected = selected === gw.id && !gw.disabled
          return (
            <button
              key={gw.id}
              disabled={gw.disabled}
              onClick={() => !gw.disabled && setSelected(gw.id)}
              className={[
                "rounded-xl p-4 text-left transition-all duration-150",
                gw.disabled
                  ? "bg-slate-50 border border-slate-200 opacity-60 cursor-not-allowed"
                  : isSelected
                    ? "border-2 border-emerald-500 bg-emerald-50"
                    : "bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <GatewayLogo id={gw.id} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900">{gw.label}</span>
                    <span className="text-xs text-slate-500 shrink-0">{gw.fee}</span>
                  </div>
                  {(gw.badge || gw.disabledLabel) && (
                    <div className="mt-1">
                      <BadgePill label={gw.disabledLabel ?? gw.badge!} />
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={loading || !!selectedGateway?.disabled}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {loading
          ? "Processing..."
          : `Pay ${fmt(amount)} via ${selectedGateway?.label ?? ""}`}
      </button>

      {/* Share row */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        {/* QR code — hidden on mobile (users can't scan their own screen) */}
        <div className="hidden sm:block shrink-0">
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
