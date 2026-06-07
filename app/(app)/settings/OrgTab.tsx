"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Org {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string
  pincode: string | null
  gstin: string | null
  pan: string | null
  currency: string
}

export default function OrgTab({ org }: { org: Org }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: org.name,
    email: org.email ?? "",
    phone: org.phone ?? "",
    address: org.address ?? "",
    city: org.city ?? "",
    state: org.state ?? "",
    country: org.country,
    pincode: org.pincode ?? "",
    gstin: org.gstin ?? "",
    pan: org.pan ?? "",
    currency: org.currency,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage("")
    const res = await fetch("/api/settings/org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      setMessage("Saved")
      router.refresh()
    } else {
      setMessage("Failed to save")
    }
  }

  const field = (label: string, key: keyof typeof form, type = "text") => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  )

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Organization</h2>

      {field("Business name", "name")}

      <div className="grid grid-cols-2 gap-3">
        {field("Email", "email", "email")}
        {field("Phone", "phone", "tel")}
      </div>

      {field("Address", "address")}

      <div className="grid grid-cols-3 gap-3">
        {field("City", "city")}
        {field("State", "state")}
        {field("Pincode", "pincode")}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {field("GSTIN", "gstin")}
        {field("PAN", "pan")}
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Default currency</label>
        <select
          value={form.currency}
          onChange={(e) => set("currency", e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        >
          <option value="INR">INR — Indian Rupee</option>
          <option value="USD">USD — US Dollar</option>
          <option value="EUR">EUR — Euro</option>
          <option value="GBP">GBP — British Pound</option>
          <option value="AED">AED — UAE Dirham</option>
          <option value="SGD">SGD — Singapore Dollar</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg disabled:opacity-60 transition-colors"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {message && (
          <span className={`text-sm ${message === "Saved" ? "text-emerald-600" : "text-red-500"}`}>
            {message}
          </span>
        )}
      </div>
    </form>
  )
}
