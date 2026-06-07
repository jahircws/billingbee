"use client"

import { useState } from "react"
import { CheckCircle, XCircle, Loader2, Eye, EyeOff } from "lucide-react"

interface Props {
  gateway: string
  label: string
  status?: { isActive: boolean; keyId?: string }
  fields: string[]
  labels: string[]
}

export default function GatewayForm({ gateway, label, status, fields, labels }: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f, ""]))
  )
  const [show, setShow] = useState<Record<string, boolean>>(
    Object.fromEntries(fields.map((f) => [f, false]))
  )
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const isConfigured = status?.isActive

  async function save() {
    if (fields.some((f) => !values[f])) return
    setSaving(true)
    setResult(null)
    try {
      const res = await fetch("/api/settings/gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway, config: values }),
      })
      const data = await res.json()
      setResult({ ok: res.ok, message: data.message ?? (res.ok ? "Saved successfully" : data.error ?? "Failed") })
      if (res.ok) setValues(Object.fromEntries(fields.map((f) => [f, ""])))
    } catch {
      setResult({ ok: false, message: "Network error" })
    }
    setSaving(false)
  }

  async function testConnection() {
    setTesting(true)
    setResult(null)
    try {
      const res = await fetch("/api/settings/gateways/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway }),
      })
      const data = await res.json()
      setResult({ ok: res.ok, message: data.message ?? (res.ok ? "Connection successful" : data.error ?? "Test failed") })
    } catch {
      setResult({ ok: false, message: "Network error" })
    }
    setTesting(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{label}</h3>
          {status?.keyId && (
            <p className="text-xs text-gray-400 mt-0.5">Key: {status.keyId.slice(0, 8)}••••</p>
          )}
        </div>
        {isConfigured ? (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <CheckCircle size={11} /> Connected
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
            <XCircle size={11} /> Not configured
          </span>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {fields.map((field, i) => {
          const isSecret = field.toLowerCase().includes("secret") || field.toLowerCase().includes("key_secret")
          return (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{labels[i]}</label>
              <div className="relative">
                <input
                  type={isSecret && !show[field] ? "password" : "text"}
                  value={values[field]}
                  onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
                  placeholder={isConfigured ? "Enter to update" : `Your ${labels[i]}`}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {isSecret && (
                  <button
                    type="button"
                    onClick={() => setShow((s) => ({ ...s, [field]: !s[field] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {show[field] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Result message */}
      {result && (
        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${result.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {result.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
          {result.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving || fields.some((f) => !values[f])}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-200 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : null}
          {isConfigured ? "Update keys" : "Save"}
        </button>
        {isConfigured && (
          <button
            onClick={testConnection}
            disabled={testing}
            className="px-4 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl flex items-center gap-1.5 transition-colors"
          >
            {testing ? <Loader2 size={13} className="animate-spin" /> : null}
            Test
          </button>
        )}
      </div>
    </div>
  )
}
