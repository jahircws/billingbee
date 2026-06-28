"use client"

import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"

interface Props {
  clientId: string
  clientName: string
}

export default function ActivationNudgeBanner({ clientId, clientName }: Props) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 flex items-center justify-between gap-4">
      <p className="text-sm font-medium">
        You&apos;ve added <span className="font-semibold">{clientName}</span> — ready to send your first invoice?
      </p>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href={`/invoices/new?clientId=${clientId}`}
          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors active:scale-95"
        >
          Create invoice →
        </Link>
        <button
          onClick={() => setVisible(false)}
          className="text-amber-500 hover:text-amber-700 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
