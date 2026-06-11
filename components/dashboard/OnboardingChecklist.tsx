"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Check, Star, ChevronDown, ChevronUp, X } from "lucide-react"

interface Steps {
  account: boolean
  business: boolean
  client: boolean
  invoiceSent: boolean
  gateway: boolean
}

interface Props {
  steps: Steps
  draftInvoiceId: string | null
}

const DISMISSED_KEY = "bb_onboarding_dismissed"

export default function OnboardingChecklist({ steps, draftInvoiceId }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY) === "1") setDismissed(true)
    } catch { /* ignore */ }
  }, [])

  const allCoreComplete = steps.account && steps.business && steps.client && steps.invoiceSent
  const allComplete = allCoreComplete && steps.gateway

  // Auto-dismiss once everything including gateway is done
  useEffect(() => {
    if (allComplete) {
      const t = setTimeout(() => {
        try { localStorage.setItem(DISMISSED_KEY, "1") } catch { /* ignore */ }
        setDismissed(true)
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [allComplete])

  function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, "1") } catch { /* ignore */ }
    setDismissed(true)
  }

  if (dismissed) return null

  const coreSteps = [steps.account, steps.business, steps.client, steps.invoiceSent]
  const doneCoreCount = coreSteps.filter(Boolean).length
  const totalCore = coreSteps.length
  const progressPct = Math.round((doneCoreCount / totalCore) * 100)

  const invoiceHref = draftInvoiceId ? `/invoices/${draftInvoiceId}` : "/invoices/new"

  const stepDefs = [
    {
      key: "account",
      done: steps.account,
      label: "Create your account",
      desc: "You're in — account created.",
      href: null,
      bonus: false,
    },
    {
      key: "business",
      done: steps.business,
      label: "Set up your business",
      desc: "Add your logo, address or GSTIN to look professional.",
      href: "/settings",
      bonus: false,
    },
    {
      key: "client",
      done: steps.client,
      label: "Add your first client",
      desc: "Save client details to reuse across invoices.",
      href: "/clients",
      bonus: false,
    },
    {
      key: "invoiceSent",
      done: steps.invoiceSent,
      label: "Send your first invoice",
      desc: "Send with a payment link — clients pay online instantly.",
      href: invoiceHref,
      bonus: false,
    },
    {
      key: "gateway",
      done: steps.gateway,
      label: "Connect a payment gateway",
      desc: "Connect Razorpay or Stripe so clients can pay online.",
      href: "/settings/gateways",
      bonus: true,
    },
  ]

  return (
    <div className="mx-4 mt-3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-gray-900">
                {allCoreComplete ? "You're all set! 🎉" : "Get set up in minutes"}
              </p>
              <span className="text-xs text-gray-400 shrink-0 ml-2">{doneCoreCount}/{totalCore} done</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setCollapsed(v => !v)}
            className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
          <button
            onClick={dismiss}
            className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {stepDefs.map((step) => {
            const row = (
              <div
                className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                  !step.done && step.href ? "hover:bg-gray-50 cursor-pointer" : ""
                }`}
              >
                {/* Icon */}
                <div className="mt-0.5 shrink-0">
                  {step.done ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check size={12} className="text-emerald-600" />
                    </div>
                  ) : step.bonus ? (
                    <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                      <Star size={11} className="text-amber-500 fill-amber-400" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-tight ${step.done ? "text-gray-400 line-through" : "text-gray-900"}`}>
                    {step.label}
                    {step.bonus && !step.done && (
                      <span className="ml-1.5 text-xs font-normal text-amber-600 no-underline" style={{ textDecoration: "none" }}>
                        bonus
                      </span>
                    )}
                  </p>
                  {!step.done && (
                    <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                  )}
                </div>

                {/* Arrow */}
                {!step.done && step.href && (
                  <span className="text-xs text-emerald-600 font-semibold shrink-0 mt-0.5">Go →</span>
                )}
              </div>
            )

            if (!step.done && step.href) {
              return (
                <Link key={step.key} href={step.href} className="block">
                  {row}
                </Link>
              )
            }
            return <div key={step.key}>{row}</div>
          })}
        </div>
      )}
    </div>
  )
}
