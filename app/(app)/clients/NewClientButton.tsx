"use client"

import Link from "next/link"
import { useState } from "react"
import { Plus } from "lucide-react"
import ClientFormModal from "./ClientFormModal"
import UpgradeModal from "@/components/billing/UpgradeModal"

export default function NewClientButton() {
  const [open, setOpen] = useState(false)
  const [limitReached, setLimitReached] = useState<{ current: number; limit: number } | null>(null)

  return (
    <>
      {limitReached && (
        <>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-2.5 rounded-lg">
            <span>
              You&apos;ve reached the {limitReached.limit} client limit on Free plan.{" "}
              <Link href="/plans-price" className="font-semibold underline underline-offset-2 hover:text-amber-800">
                Upgrade to Pro
              </Link>{" "}
              for unlimited clients.
            </span>
          </div>
          <UpgradeModal
            current={limitReached.current}
            limit={limitReached.limit}
            type="client"
            onClose={() => setLimitReached(null)}
          />
        </>
      )}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        New client
      </button>
      {open && (
        <ClientFormModal
          mode="create"
          onClose={() => setOpen(false)}
          onLimitReached={(current, limit) => setLimitReached({ current, limit })}
        />
      )}
    </>
  )
}
