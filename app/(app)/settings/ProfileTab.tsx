"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string | null
  email: string
}

export default function ProfileTab({ user }: { user: User }) {
  const router = useRouter()
  const [name, setName] = useState(user.name ?? "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage("")
    const res = await fetch("/api/settings/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    setSaving(false)
    if (res.ok) {
      setMessage("Saved")
      router.refresh()
      setTimeout(() => setMessage(""), 3000)
    } else {
      setMessage("Failed to save")
      setTimeout(() => setMessage(""), 4000)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Profile</h2>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Email</label>
        <input
          value={user.email}
          disabled
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 text-gray-400"
        />
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
