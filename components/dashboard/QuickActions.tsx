import Link from "next/link"
import { Plus, FileText, PenLine, UserPlus } from "lucide-react"

const actions = [
  {
    href: "/invoices/new",
    label: "New Invoice",
    icon: Plus,
    wrapperClass: "bg-emerald-500 text-white",
    iconClass: "bg-emerald-400/40",
  },
  {
    href: "/proposals",
    label: "New Proposal",
    icon: FileText,
    wrapperClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    iconClass: "bg-emerald-100",
  },
  {
    href: "/contracts/new",
    label: "New Contract",
    icon: PenLine,
    wrapperClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    iconClass: "bg-emerald-100",
  },
  {
    href: "/clients",
    label: "New Client",
    icon: UserPlus,
    wrapperClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    iconClass: "bg-emerald-100",
  },
] as const

export default function QuickActions() {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Quick actions</p>
      <div className="grid grid-cols-4 gap-2">
        {actions.map(({ href, label, icon: Icon, wrapperClass, iconClass }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-all duration-150 hover:shadow-sm ${wrapperClass}`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconClass}`}>
              <Icon size={16} />
            </div>
            <span className="text-xs font-medium text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
