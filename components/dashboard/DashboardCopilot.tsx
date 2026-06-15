"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Send, Loader2 } from "lucide-react"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

interface Props {
  recentClientName?: string
}

export default function DashboardCopilot({ recentClientName }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestions = [
    "What's my outstanding balance?",
    "Who owes me the most?",
    recentClientName ? `Draft an invoice for ${recentClientName}` : "Create a new invoice",
  ]

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    setInput("")

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed }
    const assistantId = crypto.randomUUID()

    setMessages((prev) => [...prev, userMsg])
    setLoading(true)
    setTimeout(scrollToBottom, 50)

    try {
      const history = [...messages, userMsg]
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      })

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "Something went wrong. Please try again." },
        ])
        return
      }

      const contentType = res.headers.get("Content-Type") ?? ""

      if (contentType.includes("application/json")) {
        const data = await res.json()
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: data.message ?? "Done!" },
        ])
        setTimeout(scrollToBottom, 50)

        if (data.type === "ACTION") {
          if (data.action === "CREATE_INVOICE") {
            const p = new URLSearchParams()
            if (data.data?.clientId) p.set("clientId", data.data.clientId)
            if (data.data?.clientName) p.set("clientName", data.data.clientName)
            if (data.data?.amount) p.set("amount", String(data.data.amount))
            if (data.data?.description) p.set("description", data.data.description)
            if (data.data?.dueDate) p.set("dueDate", data.data.dueDate)
            setTimeout(() => router.push(`/invoices/new${p.toString() ? `?${p}` : ""}`), 800)
          } else if (data.action === "DUPLICATE_INVOICE" && data.data?.invoiceId) {
            setTimeout(() => router.push(`/invoices/new?duplicateFrom=${data.data.invoiceId}`), 800)
          }
        }
        return
      }

      // Streaming
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }])
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
        )
      }
      setTimeout(scrollToBottom, 50)
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "Network error — check your connection." },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-emerald-500 px-4 py-2.5 flex items-center gap-2">
        <Sparkles size={16} className="text-white" />
        <p className="text-sm font-medium text-white">AI Copilot</p>
      </div>

      <div className="h-[180px] overflow-y-auto p-3 flex flex-col gap-2">
        {messages.length === 0 ? (
          <>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider pt-1">Try asking</p>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-600 cursor-pointer hover:bg-slate-100 transition-all duration-150 text-left"
              >
                {s}
              </button>
            ))}
          </>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`px-3 py-2 text-xs rounded-2xl max-w-[85%] whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-emerald-500 text-white rounded-br-sm self-end"
                    : "bg-slate-100 text-slate-800 rounded-bl-sm self-start"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3 py-2 self-start flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "100ms" }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t border-slate-100 p-2 flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything…"
          disabled={loading}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none transition-all duration-150 disabled:opacity-60"
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-full w-7 h-7 flex items-center justify-center transition-all duration-150 active:scale-95 shrink-0"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        </button>
      </div>
    </div>
  )
}
