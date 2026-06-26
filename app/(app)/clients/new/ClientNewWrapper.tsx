"use client"

import { useRouter } from "next/navigation"
import ClientFormModal from "@/app/(app)/clients/ClientFormModal"

export default function ClientNewWrapper({ onboarding }: { onboarding: boolean }) {
  const router = useRouter()

  return (
    <ClientFormModal
      mode="create"
      onClose={() => router.push("/clients")}
      onCreated={(clientId, clientName) => {
        if (onboarding) {
          router.push(`/invoices/new?clientId=${clientId}&onboarding=true&clientName=${encodeURIComponent(clientName)}`)
        } else {
          router.push(`/clients/${clientId}`)
        }
      }}
    />
  )
}
