"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient, updateClient } from "@/app/actions/client"
import { INDIAN_STATES } from "@/lib/utils"

const COUNTRIES = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "JP", name: "Japan" },
  { code: "NZ", name: "New Zealand" },
]


interface ClientData {
  id?: string
  name?: string
  email?: string
  phone?: string
  company?: string
  gstin?: string
  pan?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  notes?: string
}

interface Props {
  mode: "create" | "edit"
  initial?: ClientData
  onClose: () => void
  onLimitReached?: (current: number, limit: number) => void
  onCreated?: (clientId: string, clientName: string) => void
}

export default function ClientFormModal({ mode, initial = {}, onClose, onLimitReached, onCreated }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState(initial.name ?? "")
  const [email, setEmail] = useState(initial.email ?? "")
  const [phone, setPhone] = useState(initial.phone ?? "")
  const [company, setCompany] = useState(initial.company ?? "")
  const [gstin, setGstin] = useState(initial.gstin ?? "")
  const [pan, setPan] = useState(initial.pan ?? "")
  const [address, setAddress] = useState(initial.address ?? "")
  const [city, setCity] = useState(initial.city ?? "")
  const [state, setState] = useState(initial.state ?? "")
  const [pincode, setPincode] = useState(initial.pincode ?? "")
  const [country, setCountry] = useState(initial.country ?? "IN")
  const [notes, setNotes] = useState(initial.notes ?? "")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError("")

    const data = {
      name, email: email || undefined, phone: phone || undefined,
      company: company || undefined, gstin: gstin || undefined,
      pan: pan || undefined, address: address || undefined,
      city: city || undefined, state: state || undefined,
      country: country || "IN", pincode: pincode || undefined, notes: notes || undefined,
    }

    if (mode === "create") {
      const result = await createClient(data)
      setLoading(false)
      if ("error" in result) {
        if (result.error === "LIMIT_REACHED" && "current" in result) {
          onClose()
          onLimitReached?.(result.current as number, result.limit as number)
          return
        }
        setError(result.error ?? "Failed")
        return
      }
      onClose()
      router.refresh()
      if (onCreated) {
        onCreated(result.client.id, name)
      } else {
        router.push(`/clients/${result.client.id}`)
      }
    } else {
      const result = await updateClient(initial.id!, data)
      setLoading(false)
      if ("error" in result) { setError(result.error ?? "Failed"); return }
      onClose()
      router.refresh()
    }
  }

  const input = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
  const label = "block text-xs font-medium text-gray-500 mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{mode === "create" ? "New client" : "Edit client"}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Fields marked with * are required</p>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Basic */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={label}>Contact name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ravi Kumar" required className={input} />
            </div>
            <div>
              <label className={label}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="ravi@company.com" className={input} />
            </div>
            <div>
              <label className={label}>Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder={country === "IN" ? "+91 98765 43210" : "+1 555 000 0000"} className={input} />
            </div>
            <div className="col-span-2">
              <label className={label}>Company / Business name</label>
              <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Pvt Ltd" className={input} />
            </div>
          </div>

          {/* GST details — India only */}
          {country === "IN" && <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">GST Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>GSTIN</label>
                <input
                  value={gstin}
                  onChange={e => setGstin(e.target.value.toUpperCase())}
                  placeholder="27AAAAA0000A1Z5"
                  maxLength={15}
                  className={input + " font-mono"}
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Required for B2B invoices & GSTR-1</p>
              </div>
              <div>
                <label className={label}>PAN</label>
                <input
                  value={pan}
                  onChange={e => setPan(e.target.value.toUpperCase())}
                  placeholder="AAAAA0000A"
                  maxLength={10}
                  className={input + " font-mono"}
                />
              </div>
            </div>
          </div>}

          {/* Address */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Billing Address</p>
            <div className="space-y-3">
              <div>
                <label className={label}>Country</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className={input}>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Street address</label>
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="123, MG Road" className={input} />
              </div>
              {country === "IN" ? (
                <div>
                  <label className={label}>State</label>
                  <select value={state} onChange={e => setState(e.target.value)} className={input}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-0.5">Used to determine CGST+SGST vs IGST</p>
                </div>
              ) : (
                <div>
                  <label className={label}>State / Province</label>
                  <input value={state} onChange={e => setState(e.target.value)} placeholder="State / Province" className={input} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>City</label>
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="Mumbai" className={input} />
                </div>
                <div>
                  <label className={label}>{country === "IN" ? "Pincode" : "ZIP / Postal Code"}</label>
                  <input value={pincode} onChange={e => setPincode(e.target.value)} placeholder={country === "IN" ? "400001" : ""} maxLength={country === "IN" ? 6 : 20} className={input} />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={label}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, preferences…" rows={2} className={input + " resize-none"} />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 text-sm text-gray-600 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit as never}
            disabled={loading || !name.trim()}
            className="flex-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl disabled:opacity-60 transition-colors"
          >
            {loading ? (mode === "create" ? "Creating…" : "Saving…") : (mode === "create" ? "Create client" : "Save changes")}
          </button>
        </div>
      </div>
    </div>
  )
}
