"use client"

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
        <UpgradeModal
          current={limitReached.current}
          limit={limitReached.limit}
          type="client"
          onClose={() => setLimitReached(null)}
        />
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
