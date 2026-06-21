import Link from "next/link"
import { Plus, FileText, PenLine, UserPlus } from "lucide-react"

const actions = [
  {
    href: "/invoices/new",
    label: "New Invoice",
    icon: Plus,
    wrapperClass: "bg-emerald-500",
    iconClass: "bg-white/20",
    labelClass: "text-white",
  },
  {
    href: "/proposals/new",
    label: "New Proposal",
    icon: FileText,
    wrapperClass: "bg-violet-50 border border-violet-200",
    iconClass: "bg-violet-100",
    labelClass: "text-violet-700",
  },
  {
    href: "/contracts/new",
    label: "New Contract",
    icon: PenLine,
    wrapperClass: "bg-blue-50 border border-blue-200",
    iconClass: "bg-blue-100",
    labelClass: "text-blue-700",
  },
  {
    href: "/clients",
    label: "New Client",
    icon: UserPlus,
    wrapperClass: "bg-amber-50 border border-amber-200",
    iconClass: "bg-amber-100",
    labelClass: "text-amber-700",
  },
] as const

export default function QuickActions() {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Quick actions</p>
      <div className="grid grid-cols-4 gap-2">
        {actions.map(({ href, label, icon: Icon, wrapperClass, iconClass, labelClass }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-xl py-3 px-2 min-h-0 flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-150 hover:shadow-sm ${wrapperClass}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>
              <Icon size={15} />
            </div>
            <span className={`text-xs font-medium text-center leading-tight ${labelClass}`}>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
