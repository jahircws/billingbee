"use client"

import { useRef, useState } from "react"
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
  logo: string | null
}

// Resize an image file to a square-bounded PNG data URL (max `max` px on the
// longest side) so we can store it directly in the org record. Keeps logos to a
// few KB and renders in both the client portal (<img>) and the invoice PDF.
function fileToResizedDataUrl(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Could not read file"))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("Invalid image"))
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject(new Error("Canvas unavailable"))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/png"))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function OrgTab({ org }: { org: Org }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
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
    logo: org.logo ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [logoError, setLogoError] = useState("")

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLogoError("")
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-selecting the same file
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setLogoError("Please choose an image file")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("Image must be under 5MB")
      return
    }
    try {
      const dataUrl = await fileToResizedDataUrl(file)
      set("logo", dataUrl)
    } catch {
      setLogoError("Could not process that image")
    }
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

      {/* Logo */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Logo</label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
            {form.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logo} alt="Logo preview" className="w-full h-full object-contain" />
            ) : (
              <span className="text-gray-300 text-2xl font-black">{form.name?.[0] ?? "B"}</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                {form.logo ? "Replace" : "Upload logo"}
              </button>
              {form.logo && (
                <button
                  type="button"
                  onClick={() => set("logo", "")}
                  className="text-sm text-red-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">PNG, JPG or SVG · appears on invoices &amp; your client portal</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleLogoChange}
        />
        {logoError && <p className="text-xs text-red-500 mt-1.5">{logoError}</p>}
      </div>

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
