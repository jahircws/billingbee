"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function UpiQrSection({
  initialUrl,
  initialUpiId,
}: {
  initialUrl: string | null
  initialUpiId: string | null
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(initialUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")

  // UPI ID state
  const [upiId, setUpiId] = useState(initialUpiId ?? "")
  const [upiIdSaving, setUpiIdSaving] = useState(false)
  const [upiIdError, setUpiIdError] = useState("")

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  async function handleSaveUpiId() {
    setUpiIdError("")
    const trimmed = upiId.trim()
    if (!trimmed || !trimmed.includes("@")) {
      setUpiIdError("Enter a valid UPI ID (e.g. yourname@okicici)")
      return
    }
    setUpiIdSaving(true)
    const res = await fetch("/api/settings/upi-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upiId: trimmed }),
    })
    setUpiIdSaving(false)
    if (res.ok) {
      router.refresh()
      showToast("UPI ID saved")
    } else {
      const data = await res.json().catch(() => ({}))
      setUpiIdError(data.error ?? "Failed to save")
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError("")
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    const allowed = ["image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      setError("Only JPG, PNG or WebP allowed")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Max file size is 2MB")
      return
    }

    setLoading(true)
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/upload/upi-qr", { method: "POST", body: form })
    setLoading(false)

    if (res.ok) {
      const data = await res.json()
      setUrl(data.url)
      router.refresh()
      showToast("QR code saved")
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Upload failed")
    }
  }

  async function handleRemove() {
    setLoading(true)
    await fetch("/api/upload/upi-qr", { method: "DELETE" })
    setLoading(false)
    setUrl(null)
    router.refresh()
    showToast("QR code removed")
  }

  return (
    <div className="space-y-6">
      {/* UPI ID (VPA) input */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">UPI ID (VPA)</h3>
          <p className="text-xs text-gray-400 mt-0.5">e.g. amit@okicici, 9876543210@ybl</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={upiId}
              onChange={(e) => { setUpiId(e.target.value); setUpiIdError("") }}
              placeholder="yourname@okicici"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {upiIdError && <p className="text-xs text-red-500 mt-1">{upiIdError}</p>}
          </div>
          <button
            type="button"
            disabled={upiIdSaving}
            onClick={handleSaveUpiId}
            className="text-sm border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-60 shrink-0"
          >
            {upiIdSaving ? "Saving…" : "Save UPI ID"}
          </button>
        </div>
        {toast && <p className="text-xs text-emerald-600 font-medium">{toast}</p>}
      </div>

      {/* UPI QR Code upload */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">UPI Payment QR Code</h3>
          <p className="text-xs text-gray-400 mt-0.5">Clients will see this QR on your invoice and payment page</p>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-[120px] h-[120px] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
            {url ? (
              <Image src={url} alt="UPI QR Code" width={120} height={120} className="object-contain" unoptimized />
            ) : (
              <span className="text-3xl text-gray-300">⬛</span>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => inputRef.current?.click()}
                className="text-sm border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {loading ? "Uploading…" : url ? "Replace" : "Upload QR"}
              </button>
              {url && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleRemove}
                  className="text-sm text-red-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">JPG, PNG or WebP · max 2MB</p>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  )
}
