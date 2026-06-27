'use client'
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface FieldHintProps {
  steps: string[]
}

export function FieldHint({ steps }: FieldHintProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        How to get this →
      </button>

      {open && (
        <ol className="mt-2 mb-1 pl-4 space-y-1 text-xs text-slate-600 list-decimal bg-slate-50 border border-slate-200 rounded-lg p-3">
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  )
}
