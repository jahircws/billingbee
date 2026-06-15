"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Building2, Cpu, LogOut, DollarSign, Bug } from "lucide-react"

const NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/orgs", icon: Building2, label: "Organizations" },
  { href: "/admin/revenue", icon: DollarSign, label: "Revenue" },
  { href: "/admin/ai", icon: Cpu, label: "AI Usage" },
  { href: "/admin/bugs", icon: Bug, label: "Bug Reports" },
]

export default function AdminSidebar({ adminName, adminRole }: { adminName: string; adminRole: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center">
          <Image src="/logo.png" alt="BillingBee" width={140} height={28} className="brightness-0 invert" />
        </div>
        <p className="text-xs text-gray-500 mt-0.5">Admin Panel</p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? "bg-emerald-600/20 text-emerald-400" : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-300 font-medium truncate">{adminName}</p>
        <p className="text-xs text-gray-500 capitalize mb-3">{adminRole.toLowerCase()}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
