"use client"

import { useState } from "react"

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("sending")
    setError("")

    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.")
        setStatus("error")
        return
      }
      setStatus("sent")
      form.reset()
    } catch {
      setError("Network error. Please try again or email us directly.")
      setStatus("error")
    }
  }

  if (status === "sent") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-emerald-800 mb-2">Message sent ✅</h2>
        <p className="text-sm text-emerald-700">
          Thanks for reaching out — we typically respond within 24 hours on business days.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Send us a message</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2.5 rounded-lg">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Name</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Your name"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Subject</label>
          <input
            type="text"
            name="subject"
            placeholder="How can we help?"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Message</label>
          <textarea
            name="message"
            rows={5}
            required
            placeholder="Describe your question or issue..."
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all active:scale-95 text-sm disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  )
}
