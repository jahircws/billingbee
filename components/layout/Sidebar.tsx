"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Quote,
  Users,
  Receipt,
  BarChart3,
  Settings,
  Sparkles,
  Calculator,
} from "lucide-react"

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/invoices", icon: FileText, label: "Invoices" },
  { href: "/quotes", icon: Quote, label: "Quotes" },
  { href: "/proposals", icon: Sparkles, label: "Proposals" },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/expenses", icon: Receipt, label: "Expenses" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/tax", icon: Calculator, label: "GST" },
]

const BOTTOM = [
  { href: "/settings", icon: Settings, label: "Settings" },
]

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      title={label}
      className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
        active ? "bg-emerald-50 text-emerald-600" : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-500 rounded-r-full -ml-1" />}
      {/* Tooltip */}
      <span className="absolute left-14 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
        {label}
      </span>
    </Link>
  )
}

// Desktop sidebar — 64px icon rail
export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-16 shrink-0 bg-white border-r border-gray-100 py-4 items-center">
      {/* Logo mark */}
      <Link href="/dashboard" className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center mb-6 shrink-0" title="BillingBee">
        <span className="text-white font-black text-sm leading-none">B</span>
      </Link>

      {/* Main nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
          />
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col gap-1">
        {BOTTOM.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </div>
    </aside>
  )
}

// Mobile bottom bar — 4 primary icons with labels
export function MobileNav() {
  const pathname = usePathname()
  const items = NAV.slice(0, 4)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-40">
      {items.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors ${
              active ? "text-emerald-600" : "text-gray-400"
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
