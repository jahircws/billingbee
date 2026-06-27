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
      setTimeout(() => setMessage(""), 3000)
    } else {
      setMessage("Failed to save")
    }
  }

  const field = (label: string, key: keyof typeof form, type = "text", placeholder?: string) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
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

      <div>
        <label className="block text-xs text-gray-500 mb-1">Country</label>
        <select
          value={form.country}
          onChange={(e) => set("country", e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        >
          <option value="">— Select country —</option>
          <option value="IN">India</option>
          <option value="US">United States</option>
          <option value="GB">United Kingdom</option>
          <option value="CA">Canada</option>
          <option value="AU">Australia</option>
          <option value="SG">Singapore</option>
          <option value="AE">UAE</option>
          <option value="DE">Germany</option>
          <option value="FR">France</option>
          <option value="NL">Netherlands</option>
          <option value="JP">Japan</option>
          <option value="NZ">New Zealand</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {field("City", "city")}
        {field(form.country === "IN" ? "State" : "State / Province", "state")}
        {field(form.country === "IN" ? "Pincode" : "ZIP / Postal Code", "pincode")}
      </div>

      {form.country === "IN" ? (
        <div className="grid grid-cols-2 gap-3">
          {field("GSTIN", "gstin", "text", "22AAAAA0000A1Z5")}
          {field("PAN", "pan")}
        </div>
      ) : (
        <div>
          {field("Tax ID", "gstin", "text", "Enter your Tax ID")}
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-500 mb-1">Default currency</label>
        <select
          value={form.currency}
          onChange={(e) => set("currency", e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        >
          <optgroup label="South Asia">
            <option value="INR">INR — Indian Rupee</option>
            <option value="PKR">PKR — Pakistani Rupee</option>
            <option value="BDT">BDT — Bangladeshi Taka</option>
            <option value="LKR">LKR — Sri Lankan Rupee</option>
            <option value="NPR">NPR — Nepalese Rupee</option>
            <option value="MVR">MVR — Maldivian Rufiyaa</option>
          </optgroup>
          <optgroup label="North America">
            <option value="USD">USD — US Dollar</option>
            <option value="CAD">CAD — Canadian Dollar</option>
            <option value="MXN">MXN — Mexican Peso</option>
          </optgroup>
          <optgroup label="Europe">
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="CHF">CHF — Swiss Franc</option>
            <option value="SEK">SEK — Swedish Krona</option>
            <option value="NOK">NOK — Norwegian Krone</option>
            <option value="DKK">DKK — Danish Krone</option>
            <option value="PLN">PLN — Polish Złoty</option>
            <option value="CZK">CZK — Czech Koruna</option>
            <option value="HUF">HUF — Hungarian Forint</option>
            <option value="RON">RON — Romanian Leu</option>
            <option value="BGN">BGN — Bulgarian Lev</option>
            <option value="ISK">ISK — Icelandic Króna</option>
            <option value="UAH">UAH — Ukrainian Hryvnia</option>
            <option value="RSD">RSD — Serbian Dinar</option>
            <option value="BAM">BAM — Bosnia-Herzegovina Mark</option>
            <option value="MKD">MKD — Macedonian Denar</option>
            <option value="MDL">MDL — Moldovan Leu</option>
          </optgroup>
          <optgroup label="East Asia">
            <option value="JPY">JPY — Japanese Yen</option>
            <option value="CNY">CNY — Chinese Yuan</option>
            <option value="KRW">KRW — South Korean Won</option>
            <option value="TWD">TWD — Taiwan Dollar</option>
            <option value="HKD">HKD — Hong Kong Dollar</option>
            <option value="MNT">MNT — Mongolian Tögrög</option>
          </optgroup>
          <optgroup label="Southeast Asia">
            <option value="SGD">SGD — Singapore Dollar</option>
            <option value="MYR">MYR — Malaysian Ringgit</option>
            <option value="THB">THB — Thai Baht</option>
            <option value="PHP">PHP — Philippine Peso</option>
            <option value="IDR">IDR — Indonesian Rupiah</option>
            <option value="VND">VND — Vietnamese Dong</option>
            <option value="KHR">KHR — Cambodian Riel</option>
            <option value="BND">BND — Brunei Dollar</option>
            <option value="MOP">MOP — Macanese Pataca</option>
            <option value="LAK">LAK — Lao Kip</option>
          </optgroup>
          <optgroup label="Central Asia">
            <option value="KZT">KZT — Kazakhstani Tenge</option>
            <option value="UZS">UZS — Uzbekistani Som</option>
            <option value="AZN">AZN — Azerbaijani Manat</option>
            <option value="GEL">GEL — Georgian Lari</option>
            <option value="AMD">AMD — Armenian Dram</option>
            <option value="KGS">KGS — Kyrgystani Som</option>
            <option value="TJS">TJS — Tajikistani Somoni</option>
            <option value="TMT">TMT — Turkmenistani Manat</option>
          </optgroup>
          <optgroup label="Middle East &amp; North Africa">
            <option value="AED">AED — UAE Dirham</option>
            <option value="SAR">SAR — Saudi Riyal</option>
            <option value="QAR">QAR — Qatari Riyal</option>
            <option value="KWD">KWD — Kuwaiti Dinar</option>
            <option value="BHD">BHD — Bahraini Dinar</option>
            <option value="OMR">OMR — Omani Rial</option>
            <option value="JOD">JOD — Jordanian Dinar</option>
            <option value="ILS">ILS — Israeli Shekel</option>
            <option value="IQD">IQD — Iraqi Dinar</option>
            <option value="EGP">EGP — Egyptian Pound</option>
            <option value="MAD">MAD — Moroccan Dirham</option>
            <option value="TND">TND — Tunisian Dinar</option>
            <option value="DZD">DZD — Algerian Dinar</option>
          </optgroup>
          <optgroup label="Sub-Saharan Africa">
            <option value="ZAR">ZAR — South African Rand</option>
            <option value="NGN">NGN — Nigerian Naira</option>
            <option value="KES">KES — Kenyan Shilling</option>
            <option value="GHS">GHS — Ghanaian Cedi</option>
            <option value="ETB">ETB — Ethiopian Birr</option>
            <option value="TZS">TZS — Tanzanian Shilling</option>
            <option value="UGX">UGX — Ugandan Shilling</option>
            <option value="RWF">RWF — Rwandan Franc</option>
            <option value="MUR">MUR — Mauritian Rupee</option>
            <option value="XAF">XAF — Central African CFA Franc</option>
            <option value="XOF">XOF — West African CFA Franc</option>
            <option value="ZMW">ZMW — Zambian Kwacha</option>
            <option value="BWP">BWP — Botswana Pula</option>
            <option value="SCR">SCR — Seychellois Rupee</option>
            <option value="MZN">MZN — Mozambican Metical</option>
            <option value="AOA">AOA — Angolan Kwanza</option>
            <option value="MGA">MGA — Malagasy Ariary</option>
            <option value="CDF">CDF — Congolese Franc</option>
            <option value="MWK">MWK — Malawian Kwacha</option>
            <option value="CVE">CVE — Cape Verdean Escudo</option>
          </optgroup>
          <optgroup label="Latin America">
            <option value="BRL">BRL — Brazilian Real</option>
            <option value="ARS">ARS — Argentine Peso</option>
            <option value="CLP">CLP — Chilean Peso</option>
            <option value="COP">COP — Colombian Peso</option>
            <option value="PEN">PEN — Peruvian Sol</option>
            <option value="UYU">UYU — Uruguayan Peso</option>
            <option value="BOB">BOB — Bolivian Boliviano</option>
            <option value="GTQ">GTQ — Guatemalan Quetzal</option>
            <option value="HNL">HNL — Honduran Lempira</option>
            <option value="DOP">DOP — Dominican Peso</option>
            <option value="TTD">TTD — Trinidad &amp; Tobago Dollar</option>
            <option value="JMD">JMD — Jamaican Dollar</option>
            <option value="CRC">CRC — Costa Rican Colón</option>
            <option value="PYG">PYG — Paraguayan Guaraní</option>
            <option value="NIO">NIO — Nicaraguan Córdoba</option>
            <option value="GYD">GYD — Guyanese Dollar</option>
            <option value="SRD">SRD — Surinamese Dollar</option>
          </optgroup>
          <optgroup label="Pacific">
            <option value="AUD">AUD — Australian Dollar</option>
            <option value="NZD">NZD — New Zealand Dollar</option>
            <option value="FJD">FJD — Fijian Dollar</option>
            <option value="PGK">PGK — Papua New Guinean Kina</option>
            <option value="XPF">XPF — CFP Franc</option>
          </optgroup>
          <optgroup label="Caribbean">
            <option value="XCD">XCD — East Caribbean Dollar</option>
          </optgroup>
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
