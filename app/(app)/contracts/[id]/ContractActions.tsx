"use client"

import { useState } from "react"
import { Printer, Copy, Check } from "lucide-react"

export default function ContractActions({ content, title }: { content: string; title: string }) {
  const [copied, setCopied] = useState(false)

  function handlePrint() {
    window.print()
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium px-3 py-1.5 rounded-lg transition-colors print:hidden"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copied!" : "Copy text"}
      </button>
      <button
        onClick={handlePrint}
        className="flex items-center gap-1.5 text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium px-3 py-1.5 rounded-lg transition-colors print:hidden"
      >
        <Printer className="w-4 h-4" />
        Print / Save PDF
      </button>
    </>
  )
}
