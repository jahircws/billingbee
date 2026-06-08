import { Suspense } from "react"
import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import Copilot from "@/components/ai/Copilot"
import { privateMetadata } from "@/lib/metadata"
import HealthCard from "@/components/dashboard/HealthCard"
import { calculateHealthScore } from "@/lib/health"
import TrialBanner from "@/components/dashboard/TrialBanner"
import {
  AlertCircle,
  Clock,
  FileText,
  CheckCircle,
  Plus,
  Paperclip,
  Users,
  BarChart3,
  Sparkles,
} from "lucide-react"
import { format, addDays } from "date-fns"
import { fmtCurrencyShort } from "@/lib/currency"

export const metadata = { ...privateMetadata, title: "Dashboard" }
export const dynamic = "force-dynamic"

// ── Attention cards data ───────────────────────────────────────────────────────

async function getAttentionData(orgId: string) {
  const now = new Date()
  const soon = addDays(now, 7)

  const [overdueInvoices, dueSoonInvoices, draftInvoices, lastPayment] = await Promise.all([
    prisma.invoice.findMany({
      where: { orgId, status: "OVERDUE" },
      select: { amountDue: true },
    }),
    prisma.invoice.findMany({
      where: { orgId, status: "UNPAID", dueDate: { gte: now, lte: soon } },
      select: { amountDue: true },
    }),
    prisma.invoice.count({ where: { orgId, status: "DRAFT" } }),
    prisma.payment.findFirst({
      where: { invoice: { orgId } },
      orderBy: { createdAt: "desc" },
      include: { invoice: { include: { client: { select: { name: true } } } } },
    }),
  ])

  const overdueAmount = overdueInvoices.reduce((s, i) => s + Number(i.amountDue), 0)
  const dueSoonAmount = dueSoonInvoices.reduce((s, i) => s + Number(i.amountDue), 0)

  return {
    overdue: { count: overdueInvoices.length, amount: overdueAmount },
    dueSoon: { count: dueSoonInvoices.length, amount: dueSoonAmount },
    drafts: draftInvoices,
    lastPayment: lastPayment
      ? {
          client: lastPayment.invoice.client.name,
          amount: Number(lastPayment.amount),
          date: format(lastPayment.createdAt, "d MMM"),
        }
      : null,
  }
}

async function getLastClientUsed(orgId: string) {
  const inv = await prisma.invoice.findFirst({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    include: { client: { select: { name: true } } },
  })
  return inv?.client?.name ?? null
}

// ── Attention card component ───────────────────────────────────────────────────

function AttentionCard({
  icon: Icon,
  label,
  value,
  sub,
  colorClass,
  href,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  colorClass: string
  href?: string
}) {
  const content = (
    <div className={`bg-white rounded-xl border-l-4 ${colorClass} p-4 space-y-1 hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
        <Icon size={13} />
        {label}
      </div>
      <div className="text-base font-bold text-gray-900 leading-tight">{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : <div>{content}</div>
}

// ── Page ───────────────────────────────────────────────────────────────────────

interface DashboardProps {
  searchParams: Promise<{ upgraded?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")

  const orgId = session.user.orgId
  const { upgraded } = await searchParams

  const [attention, lastClient, healthScore, org] = await Promise.all([
    getAttentionData(orgId),
    getLastClientUsed(orgId),
    calculateHealthScore(orgId),
    prisma.organization.findUnique({ where: { id: orgId }, select: { currency: true, plan: true, planExpiry: true } }),
  ])

  const currency = org?.currency ?? "INR"
  const fmt = (n: number) => fmtCurrencyShort(n, currency)

  // Trial banner data
  const isTrial = org?.plan === "pro" && org?.planExpiry != null
  const trialDaysLeft = isTrial && org.planExpiry
    ? Math.max(0, Math.ceil((org.planExpiry.getTime() - Date.now()) / 86400000))
    : 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Dashboard" />
      {isTrial && trialDaysLeft > 0 && (
        <TrialBanner daysLeft={trialDaysLeft} planExpiry={org!.planExpiry!.toISOString()} />
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-20 md:pb-6">
        {/* Pro upgrade success banner */}
        {upgraded === "true" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Welcome to Pro! You&apos;re all set.</p>
              <p className="text-xs text-emerald-600">Unlimited invoices, AI collections, and payment links are now active.</p>
            </div>
          </div>
        )}

        {/* Attention cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:col-span-4">
          <AttentionCard
            icon={AlertCircle}
            label="Overdue"
            value={attention.overdue.count > 0 ? `${attention.overdue.count} invoice${attention.overdue.count !== 1 ? "s" : ""} · ${fmt(attention.overdue.amount)}` : "All clear"}
            colorClass={attention.overdue.count > 0 ? "border-red-400" : "border-gray-200"}
            href="/dashboard/invoices?filter=overdue"
          />
          <AttentionCard
            icon={Clock}
            label="Due soon"
            value={attention.dueSoon.count > 0 ? `${attention.dueSoon.count} due this week · ${fmt(attention.dueSoon.amount)}` : "Nothing due soon"}
            colorClass={attention.dueSoon.count > 0 ? "border-amber-400" : "border-gray-200"}
            href="/dashboard/invoices?filter=due-soon"
          />
          <AttentionCard
            icon={FileText}
            label="Unsent drafts"
            value={attention.drafts > 0 ? `${attention.drafts} draft${attention.drafts !== 1 ? "s" : ""} ready to send` : "No drafts"}
            colorClass={attention.drafts > 0 ? "border-blue-400" : "border-gray-200"}
            href="/dashboard/invoices?filter=draft"
          />
          <AttentionCard
            icon={CheckCircle}
            label="Last payment"
            value={attention.lastPayment ? `${attention.lastPayment.client} paid ${fmt(attention.lastPayment.amount)}` : "No payments yet"}
            sub={attention.lastPayment ? attention.lastPayment.date : undefined}
            colorClass={attention.lastPayment ? "border-emerald-400" : "border-gray-200"}
            href="/dashboard/invoices?filter=paid"
          />
        </div>


        {/* Copilot — dominant center feature */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: "460px" }}>
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <Sparkles size={15} className="text-emerald-600" />
            <span className="text-sm font-semibold text-gray-800">AI Revenue Copilot</span>
            <span className="ml-auto text-xs text-gray-400">Powered by Claude</span>
          </div>
          <div className="h-[calc(100%-49px)]">
            <Suspense fallback={<div className="p-6 text-sm text-gray-400">Loading copilot...</div>}>
              <Copilot lastClientUsed={lastClient ?? undefined} />
            </Suspense>
          </div>
        </div>

        {/* Business Health */}
        <HealthCard score={healthScore} />

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/dashboard/invoices/new", icon: Plus, label: "New Invoice", cls: "bg-emerald-600 hover:bg-emerald-700 text-white" },
            { href: "/generate", icon: Paperclip, label: "From Upload", cls: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
            { href: "/dashboard/clients/new", icon: Users, label: "New Client", cls: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
            { href: "/dashboard/reports", icon: BarChart3, label: "Reports", cls: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
          ].map(({ href, icon: Icon, label, cls }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${cls}`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

