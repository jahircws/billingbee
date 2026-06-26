"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Send, Loader2, CheckCircle, X, User } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  type?: "text" | "action"
  action?: ActionPayload
  streaming?: boolean
}

interface ActionPayload {
  action: "CREATE_INVOICE" | "DUPLICATE_INVOICE" | "SEND_REMINDER"
  data: Record<string, unknown>
  message: string
}

const SUGGESTIONS = [
  "Who owes me money?",
  "How much did I earn this month?",
  "Show overdue invoices",
  "How's my cash flow?",
]

// ── Action card ───────────────────────────────────────────────────────────────

function ActionCard({ payload, onConfirm, onCancel }: { payload: ActionPayload; onConfirm: () => void; onCancel: () => void }) {
  const labels: Record<string, string> = {
    CREATE_INVOICE: "Create Invoice",
    DUPLICATE_INVOICE: "Duplicate Invoice",
    SEND_REMINDER: "Send Reminders",
  }

  return (
    <div className="mt-2 border border-emerald-200 rounded-xl p-4 bg-emerald-50/60 space-y-3">
      <p className="text-sm text-gray-700">{payload.message}</p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          <CheckCircle size={13} />
          {labels[payload.action] ?? "Confirm"}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 bg-white text-gray-500 hover:text-gray-700 border border-gray-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          <X size={13} />
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────

function Message({
  msg,
  onActionConfirm,
  onActionCancel,
}: {
  msg: ChatMessage
  onActionConfirm: (payload: ActionPayload) => void
  onActionCancel: (id: string) => void
}) {
  const isUser = msg.role === "user"

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
        isUser ? "bg-emerald-600" : "bg-gray-900"
      }`}>
        {isUser ? <User size={13} className="text-white" /> : <Sparkles size={13} className="text-white" />}
      </div>

      <div className={`max-w-[80%] space-y-1 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-emerald-600 text-white rounded-tr-sm"
            : "bg-gray-100 text-gray-800 rounded-tl-sm"
        }`}>
          {msg.content}
          {msg.streaming && <span className="inline-block w-1.5 h-3.5 bg-gray-400 rounded-sm ml-1 animate-pulse" />}
        </div>

        {msg.type === "action" && msg.action && (
          <ActionCard
            payload={msg.action}
            onConfirm={() => onActionConfirm(msg.action!)}
            onCancel={() => onActionCancel(msg.id)}
          />
        )}
      </div>
    </div>
  )
}

// ── Main Copilot component ────────────────────────────────────────────────────

const ONBOARDING_MESSAGE =
  "Hi! I'm your BillingBee AI assistant.\n\nTell me about your first client and I'll create your first invoice — or just say:\n\n\"Invoice Acme Corp ₹10,000 for design work\""

const DEFAULT_WELCOME =
  "Hi! I'm your BillingBee Copilot. Ask me anything about your invoices, clients, or revenue — or just say \"create invoice\" to get started."

export default function Copilot({
  lastClientUsed,
  initialMessage,
  isOnboarding = false,
  apiEndpoint = "/api/ai/copilot",
  suggestions: suggestionsProp,
}: {
  lastClientUsed?: string
  initialMessage?: string
  isOnboarding?: boolean
  apiEndpoint?: string
  suggestions?: string[]
}) {
  const welcomeContent = initialMessage ?? (isOnboarding ? ONBOARDING_MESSAGE : DEFAULT_WELCOME)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: welcomeContent,
      type: "text",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  useEffect(() => {
    function handleSetInput(e: CustomEvent) {
      setInput(e.detail?.text ?? "")
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
    window.addEventListener("bb:copilot-set-input", handleSetInput as EventListener)
    return () => window.removeEventListener("bb:copilot-set-input", handleSetInput as EventListener)
  }, [])

  const historyForAPI = useCallback(() => {
    return messages
      .filter((m) => m.type !== "action")
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }))
  }, [messages])

  async function send(text: string) {
    if (!text.trim() || loading) return
    setInput("")

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text.trim(), type: "text" }
    const assistantId = crypto.randomUUID()

    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history: historyForAPI() }),
      })

      if (!res.ok) {
        let errMsg = "Something went wrong. Please try again."
        try {
          const errData = await res.json()
          if (errData?.error) errMsg = errData.error
        } catch { /* ignore */ }
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: errMsg, type: "text" },
        ])
        return
      }

      const contentType = res.headers.get("Content-Type") ?? ""

      // JSON → action response
      if (contentType.includes("application/json")) {
        const data = await res.json()
        if (data.type === "ACTION") {
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              role: "assistant",
              content: data.message,
              type: "action",
              action: { action: data.action, data: data.data, message: data.message },
            },
          ])
          return
        }
        // Fallback
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: data.message ?? "Done!", type: "text" },
        ])
        return
      }

      // Streaming text response
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", type: "text", streaming: true },
      ])

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

      // Mark done
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
      )
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "Network error — check your connection.", type: "text" },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleActionConfirm(payload: ActionPayload) {
    if (payload.action === "CREATE_INVOICE") {
      const d = payload.data
      const params = new URLSearchParams()
      if (d.clientName) params.set("clientName", String(d.clientName))
      if (d.clientId) params.set("clientId", String(d.clientId))
      if (d.amount) params.set("amount", String(d.amount))
      if (d.description) params.set("description", String(d.description))
      if (d.dueDate) params.set("dueDate", String(d.dueDate))
      if (d.currency) params.set("currency", String(d.currency))
      router.push(`/invoices/new?${params.toString()}&source=copilot`)
    } else if (payload.action === "DUPLICATE_INVOICE") {
      router.push(`/invoices/${String(payload.data.invoiceId)}/duplicate`)
    } else if (payload.action === "SEND_REMINDER") {
      router.push("/invoices?filter=overdue&action=remind")
    }
  }

  function handleActionCancel(id: string) {
    setMessages((prev) =>
      prev.map((m) => m.id === id ? { ...m, type: "text", action: undefined } : m)
    )
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const suggestions = suggestionsProp ?? (isOnboarding
    ? [
        "Invoice Acme Corp ₹10,000 for design work",
        "Invoice TechCorp ₹25,000 for consulting",
        "Invoice my client ₹5,000 for content writing",
      ]
    : [
        "Who owes me money?",
        lastClientUsed ? `Create invoice for ${lastClientUsed}` : "Create invoice for new client",
        "How much did I earn this month?",
        "Show overdue invoices",
      ])

  const showSuggestions = messages.length <= 1

  return (
    <div className="flex flex-col h-full">
      {/* Message area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 overscroll-contain">
        {messages.map((msg) => (
          <Message
            key={msg.id}
            msg={msg}
            onActionConfirm={handleActionConfirm}
            onActionCancel={handleActionCancel}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips — shown when chat is empty */}
      {showSuggestions && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-gray-600 px-3 py-1.5 rounded-full border border-gray-200 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 shrink-0">
        <div className="flex gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-1.5 focus-within:border-emerald-400 focus-within:bg-white transition-colors">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = "36px"
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... (Enter to send, Shift+Enter for new line)"
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none px-2 py-1.5 leading-relaxed"
            style={{ height: "36px" }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="w-9 h-9 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl shrink-0 self-end transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}
