"use client"

import Link from "next/link"

interface GenerateCTAProps {
  type?: "invoice" | "quote" | "proposal" | "contract"
  template?: string
  profession?: string
  label?: string
  source?: string
  className?: string
}

export default function GenerateCTA({
  type = "invoice",
  template,
  profession,
  label = "Create free invoice →",
  source,
  className,
}: GenerateCTAProps) {
  const params = new URLSearchParams({ type })
  if (template) params.set("template", template)
  if (profession) params.set("profession", profession)
  if (source) params.set("from", source)
  if (source) params.set("utm_source", "seo")
  if (source) params.set("utm_campaign", source)

  return (
    <Link
      href={`/generate?${params.toString()}`}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
      }
    >
      {label}
    </Link>
  )
}
