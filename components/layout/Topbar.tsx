"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Plus, Bell } from "lucide-react"

interface Props {
  title: string
}

export function Topbar({ title }: Props) {
  const [query, setQuery] = useState("")
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center gap-4 px-4 shrink-0">
      {/* Page title */}
      <h1 className="text-sm font-semibold text-gray-900 shrink-0">{title}</h1>

      {/* Global search — center */}
      <form onSubmit={handleSearch} className="flex-1 max-w-sm mx-auto">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients, invoices, amounts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
          />
        </div>
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">New Invoice</span>
        </Link>
        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Notifications">
          <Bell size={16} />
        </button>
        {/* Avatar placeholder — real one would come from session */}
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs cursor-pointer select-none">
          B
        </div>
      </div>
    </header>
  )
}
