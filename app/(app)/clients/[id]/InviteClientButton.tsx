"use client"

import { useState } from "react"
import { inviteClient } from "@/app/actions/portal"
import { Mail, Check } from "lucide-react"

export default function InviteClientButton({ clientId }: { clientId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [msg, setMsg] = useState("")

  async function handle() {
    if (state === "done") return
    setState("loading")
    const result = await inviteClient(clientId)
    if ("error" in result) {
      setMsg(result.error ?? "Failed to send invite")
      setState("error")
    } else {
      setState("done")
    }
  }

  if (state === "error") {
    return <span className="text-xs text-red-500">{msg}</span>
  }

  return (
    <button
      onClick={handle}
      disabled={state === "loading" || state === "done"}
      className="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
    >
      {state === "done" ? (
        <><Check className="w-3.5 h-3.5 text-emerald-500" /> Invited</>
      ) : state === "loading" ? (
        <><span className="animate-spin inline-block w-3.5 h-3.5">⟳</span> Sending…</>
      ) : (
        <><Mail className="w-3.5 h-3.5" /> Invite to portal</>
      )}
    </button>
  )
}
