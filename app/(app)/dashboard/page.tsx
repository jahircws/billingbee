import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import HealthCard from "@/components/dashboard/HealthCard"
import { calculateHealthScore } from "@/lib/health"
import TrialBanner from "@/components/dashboard/TrialBanner"
import EmailVerifyBanner from "@/components/dashboard/EmailVerifyBanner"
import GenerateSignupBanner from "@/components/dashboard/GenerateSignupBanner"
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist"
import {
  AlertCircle,
  Clock,
  FileText,
  CheckCircle,
  Plus,
  Paperclip,
  Users,
  BarChart3,
} from "lucide-react"
import { format, addDays, startOfDay } from "date-fns"
import { fmtCurrencyShort } from "@/lib/currency"

export const metadata = { ...privateMetadata, title: "Dashboard" }
export const dynamic = "force-dynamic"

// ── Attention cards data ───────────────────────────────────────────────────────

async function getAttentionData(orgId: string, orgCurrency: string) {
  const now = new Date()
  const soon = addDays(now, 7)

  const todayStart = startOfDay(now)

  const [overdueInvoices, dueSoonInvoices, draftInvoices, lastPayment] = await Promise.all([
    prisma.invoice.findMany({
      where: { orgId, OR: [{ status: "OVERDUE" }, { status: "UNPAID", dueDate: { lt: todayStart } }] },
      select: { amountDue: true, currency: true },
    }),
    prisma.invoice.findMany({
      where: { orgId, status: "UNPAID", dueDate: { gte: todayStart, lte: soon } },
      select: { amountDue: true, currency: true },
    }),
    prisma.invoice.findMany({
      where: { orgId, status: "DRAFT" },
      select: { currency: true },
    }),
    prisma.payment.findFirst({
      where: { invoice: { orgId } },
      orderBy: { createdAt: "desc" },
      include: { invoice: { include: { client: { select: { name: true } } } } },
    }),
  ])

  const othersByCurrency = (invoices: { currency: string }[]) => {
    const counts: Record<string, number> = {}
    for (const i of invoices) {
      if (i.currency !== orgCurrency) counts[i.currency] = (counts[i.currency] ?? 0) + 1
    }
    return Object.entries(counts).map(([currency, count]) => ({ currency, count }))
  }

  const sumInOrgCurrency = (invoices: { amountDue: unknown; currency: string }[]) => ({
    amount: invoices.filter((i) => i.currency === orgCurrency).reduce((s, i) => s + Number(i.amountDue), 0),
    count: invoices.filter((i) => i.currency === orgCurrency).length,
    others: othersByCurrency(invoices),
  })

  const overdue = sumInOrgCurrency(overdueInvoices)
  const dueSoon = sumInOrgCurrency(dueSoonInvoices)
  const draftsInOrg = draftInvoices.filter((i) => i.currency === orgCurrency).length
  const draftOthers = othersByCurrency(draftInvoices)

  return {
    overdue,
    dueSoon,
    drafts: { count: draftsInOrg, others: draftOthers },
    lastPayment: lastPayment
      ? {
          client: lastPayment.invoice.client.name,
          amount: Number(lastPayment.amount),
          currency: lastPayment.currency,
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

async function getOnboardingState(orgId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [org, clients, sentInvoice, draftInvoice, gateway] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { gstin: true, address: true, logo: true, createdAt: true },
    }),
    prisma.client.count({ where: { orgId } }),
    prisma.invoice.findFirst({
      where: { orgId, OR: [{ sentAt: { not: null } }, { status: { in: ["UNPAID", "PAID", "OVERDUE"] } }] },
      select: { id: true },
    }),
    prisma.invoice.findFirst({
      where: { orgId, status: "DRAFT" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
    prisma.paymentGatewayConfig.findFirst({ where: { orgId, isActive: true }, select: { id: true } }),
  ])

  const isNewEnough = org ? org.createdAt >= thirtyDaysAgo : false

  return {
    show: isNewEnough,
    steps: {
      account: true,
      business: !!(org?.gstin || org?.address || org?.logo),
      client: clients > 0,
      invoiceSent: !!sentInvoice,
      gateway: !!gateway,
    },
    draftInvoiceId: draftInvoice?.id ?? null,
  }
}

// ── Attention card component ───────────────────────────────────────────────────

function AttentionCard({
  icon: Icon,
  label,
  amount,
  amountColor,
  sub,
  colorClass,
  href,
}: {
  icon: React.ElementType
  label: string
  amount: string
  amountColor?: string
  sub?: string
  colorClass: string
  href?: string
}) {
  const content = (
    <div className={`bg-white rounded-xl border-l-4 ${colorClass} p-4 space-y-1.5 hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
        <Icon size={13} />
        {label}
      </div>
      <div className={`text-xl font-semibold leading-tight ${amountColor ?? "text-gray-900"}`}>{amount}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : <div>{content}</div>
}

// ── Page ───────────────────────────────────────────────────────────────────────

interface DashboardProps {
  searchParams: Promise<{ upgraded?: string; verified?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")

  const orgId = session.user.orgId
  const { upgraded, verified } = await searchParams

  const userId = session.user.userId

  const orgCurrencyPre = (await prisma.organization.findUnique({ where: { id: orgId }, select: { currency: true } }))?.currency ?? "INR"

  const [attention, lastClient, healthScore, org, invoiceCount, clientCount, userRecord, onboarding] = await Promise.all([
    getAttentionData(orgId, orgCurrencyPre),
    getLastClientUsed(orgId),
    calculateHealthScore(orgId),
    prisma.organization.findUnique({ where: { id: orgId }, select: { currency: true, plan: true, planExpiry: true } }),
    prisma.invoice.count({ where: { orgId } }),
    prisma.client.count({ where: { orgId } }),
    userId ? prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } }) : Promise.resolve(null),
    getOnboardingState(orgId),
  ])

  const currency = org?.currency ?? "INR"
  const fmt = (n: number) => fmtCurrencyShort(n, currency)

  // Trial banner data
  const isTrial = org?.plan === "pro" && org?.planExpiry != null
  const trialDaysLeft = isTrial && org.planExpiry
    ? Math.max(0, Math.ceil((org.planExpiry.getTime() - Date.now()) / 86400000))
    : 0

  // Onboarding: new user with no data yet
  const isNewUser = invoiceCount === 0 && clientCount === 0
  // Email unverified
  const emailUnverified = !userRecord?.emailVerified

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Dashboard" />
      {isTrial && trialDaysLeft > 0 && (
        <TrialBanner daysLeft={trialDaysLeft} planExpiry={org!.planExpiry!.toISOString()} />
      )}
      {emailUnverified && <EmailVerifyBanner />}
      <GenerateSignupBanner draftInvoiceId={onboarding.draftInvoiceId} />
      {onboarding.show && (
        <OnboardingChecklist steps={onboarding.steps} draftInvoiceId={onboarding.draftInvoiceId} orgId={orgId} />
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

        {/* Email verification result */}
        {verified === "success" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl">✅</span>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Email verified!</p>
              <p className="text-xs text-emerald-600">Your account is fully active. Thanks for confirming your email.</p>
            </div>
          </div>
        )}
        {(verified === "invalid" || verified === "expired") && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {verified === "expired" ? "Verification link expired" : "Verification link invalid"}
              </p>
              <p className="text-xs text-amber-700">Please request a new verification email to confirm your address.</p>
            </div>
          </div>
        )}


        {/* Attention cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:col-span-4">
          <AttentionCard
            icon={AlertCircle}
            label="Overdue"
            amount={attention.overdue.count > 0 ? fmt(attention.overdue.amount) : "All clear"}
            amountColor={attention.overdue.count > 0 ? "text-red-600" : undefined}
            sub={attention.overdue.count > 0
              ? `${attention.overdue.count} invoice${attention.overdue.count !== 1 ? "s" : ""}${attention.overdue.others.length > 0 ? ` · ${attention.overdue.others.map((o) => `+${o.count} in ${o.currency}`).join(" + ")}` : ""}`
              : undefined}
            colorClass={attention.overdue.count > 0 ? "border-red-400" : "border-gray-200"}
            href="/invoices?status=OVERDUE"
          />
          <AttentionCard
            icon={Clock}
            label="Due soon"
            amount={attention.dueSoon.count > 0 ? fmt(attention.dueSoon.amount) : "Nothing due soon"}
            amountColor={attention.dueSoon.count > 0 ? "text-amber-600" : undefined}
            sub={attention.dueSoon.count > 0
              ? `${attention.dueSoon.count} invoice${attention.dueSoon.count !== 1 ? "s" : ""} this week${attention.dueSoon.others.length > 0 ? ` · ${attention.dueSoon.others.map((o) => `+${o.count} in ${o.currency}`).join(" + ")}` : ""}`
              : undefined}
            colorClass={attention.dueSoon.count > 0 ? "border-amber-400" : "border-gray-200"}
            href="/invoices?status=UNPAID"
          />
          <AttentionCard
            icon={FileText}
            label="Unsent drafts"
            amount={attention.drafts.count + attention.drafts.others.reduce((s, o) => s + o.count, 0) > 0
              ? `${attention.drafts.count + attention.drafts.others.reduce((s, o) => s + o.count, 0)}`
              : "No drafts"}
            sub={attention.drafts.count + attention.drafts.others.reduce((s, o) => s + o.count, 0) > 0
              ? `ready to send${attention.drafts.others.length > 0 ? ` · ${attention.drafts.others.map((o) => `+${o.count} in ${o.currency}`).join(" + ")}` : ""}`
              : undefined}
            colorClass={attention.drafts.count + attention.drafts.others.reduce((s, o) => s + o.count, 0) > 0 ? "border-blue-400" : "border-gray-200"}
            href="/invoices?status=DRAFT"
          />
          <AttentionCard
            icon={CheckCircle}
            label="Last payment"
            amount={attention.lastPayment ? fmtCurrencyShort(attention.lastPayment.amount, attention.lastPayment.currency) : "No payments yet"}
            amountColor={attention.lastPayment ? "text-emerald-600" : undefined}
            sub={attention.lastPayment ? `${attention.lastPayment.client} · ${attention.lastPayment.date}` : undefined}
            colorClass={attention.lastPayment ? "border-emerald-400" : "border-gray-200"}
            href="/invoices?status=PAID"
          />
        </div>

        {/* Business Health */}
        <HealthCard score={healthScore} />

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/invoices/new", icon: Plus, label: "New Invoice", cls: "bg-emerald-600 hover:bg-emerald-700 text-white" },
            { href: "/invoices/new?mode=upload", icon: Paperclip, label: "From Upload", cls: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
            { href: "/clients", icon: Users, label: "New Client", cls: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
            { href: "/reports", icon: BarChart3, label: "Reports", cls: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
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

