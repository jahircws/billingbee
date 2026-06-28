"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ClientFormModal from "@/app/(app)/clients/ClientFormModal"
import UpgradeModal from "@/components/billing/UpgradeModal"

export default function ClientNewWrapper({ onboarding, isIndia }: { onboarding: boolean; isIndia?: boolean }) {
  const router = useRouter()
  const [limitReached, setLimitReached] = useState<{ current: number; limit: number } | null>(null)

  return (
    <>
      {limitReached && (
        <UpgradeModal
          current={limitReached.current}
          limit={limitReached.limit}
          type="client"
          onClose={() => router.push("/clients")}
          isIndia={isIndia}
        />
      )}
      <ClientFormModal
        mode="create"
        onClose={() => router.push("/clients")}
        onLimitReached={(current, limit) => setLimitReached({ current, limit })}
        onCreated={(clientId, clientName) => {
          if (onboarding) {
            router.push(`/invoices/new?clientId=${clientId}&onboarding=true&clientName=${encodeURIComponent(clientName)}`)
          } else {
            router.push(`/clients/${clientId}`)
          }
        }}
      />
    </>
  )
}
