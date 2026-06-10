"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import ClientFormModal from "../ClientFormModal"

interface Props {
  client: {
    id: string
    name: string
    email?: string | null
    phone?: string | null
    company?: string | null
    gstin?: string | null
    pan?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    country?: string | null
    pincode?: string | null
    notes?: string | null
  }
}

export default function EditClientButton({ client }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 font-medium px-3 py-2 rounded-lg transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit
      </button>
      {open && (
        <ClientFormModal
          mode="edit"
          initial={{
            id: client.id,
            name: client.name,
            email: client.email ?? "",
            phone: client.phone ?? "",
            company: client.company ?? "",
            gstin: client.gstin ?? "",
            pan: client.pan ?? "",
            address: client.address ?? "",
            city: client.city ?? "",
            state: client.state ?? "",
            country: client.country ?? "",
            pincode: client.pincode ?? "",
            notes: client.notes ?? "",
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
