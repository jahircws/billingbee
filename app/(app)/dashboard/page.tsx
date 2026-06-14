import { redirect } from "next/navigation"
import { privateMetadata } from "@/lib/metadata"
import { getOrgId } from "@/lib/session"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import TrialBanner from "@/components/dashboard/TrialBanner"
import EmailVerifyBanner from "@/components/dashboard/EmailVerifyBanner"
import GenerateSignupBanner from "@/components/dashboard/GenerateSignupBanner"
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist"
import AlertStrip from "@/components/dashboard/AlertStrip"
import StatCards from "@/components/dashboard/StatCards"
import RevenueChart from "@/components/dashboard/RevenueChart"
import RecentInvoices from "@/components/dashboard/RecentInvoices"
import DashboardCopilot from "@/components/dashboard/DashboardCopilot"
import QuickActions from "@/components/dashboard/QuickActions"
import PendingItems from "@/components/dashboard/PendingItems"
import TopClients from "@/components/dashboard/TopClients"
import ActivityFeed from "@/components/dashboard/ActivityFeed"
import ExpenseSnapshot from "@/components/dashboard/ExpenseSnapshot"
import { getDashboardData } from "./data"
import { auth } from "@/auth"

export const metadata = { ...privateMetadata, title: "Dashboard" }
export const dynamic = "force-dynamic"

interface DashboardProps {
  searchParams: Promise<{ upgraded?: string; verified?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  let orgId: string
  try {
    orgId = await getOrgId()
  } catch {
    redirect("/login")
  }

  const { upgraded, verified } = await searchParams

  const session = await auth()
  const userId = session?.user?.userId

  const [org, data, userRecord, onboarding] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { currency: true, plan: true, planExpiry: true },
    }),
    getDashboardData(orgId),
    userId
      ? prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } })
      : Promise.resolve(null),
    (async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const [orgRow, clients, sentInvoice, draftInvoice, gateway] = await Promise.all([
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
      const isNewEnough = orgRow ? orgRow.createdAt >= thirtyDaysAgo : false
      return {
        show: isNewEnough,
        steps: {
          account: true,
          business: !!(orgRow?.gstin || orgRow?.address || orgRow?.logo),
          client: clients > 0,
          invoiceSent: !!sentInvoice,
          gateway: !!gateway,
        },
        draftInvoiceId: draftInvoice?.id ?? null,
      }
    })(),
  ])

  const currency = org?.currency ?? "INR"
  const isTrial = org?.plan === "pro" && org?.planExpiry != null
  const trialDaysLeft = isTrial && org?.planExpiry
    ? Math.max(0, Math.ceil((org.planExpiry.getTime() - Date.now()) / 86400000))
    : 0
  const emailUnverified = !userRecord?.emailVerified

  const banners = (
    <>
      {isTrial && trialDaysLeft > 0 && (
        <TrialBanner daysLeft={trialDaysLeft} planExpiry={org!.planExpiry!.toISOString()} />
      )}
      {emailUnverified && <EmailVerifyBanner />}
      <GenerateSignupBanner draftInvoiceId={onboarding.draftInvoiceId} />
      {upgraded === "true" && (
        <div className="mx-4 mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">🎉</span>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Welcome to Pro! You&apos;re all set.</p>
            <p className="text-xs text-emerald-600">Unlimited invoices, AI collections, and payment links are now active.</p>
          </div>
        </div>
      )}
      {verified === "success" && (
        <div className="mx-4 mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Email verified!</p>
            <p className="text-xs text-emerald-600">Your account is fully active.</p>
          </div>
        </div>
      )}
      {(verified === "invalid" || verified === "expired") && (
        <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {verified === "expired" ? "Verification link expired" : "Verification link invalid"}
            </p>
            <p className="text-xs text-amber-700">Please request a new verification email.</p>
          </div>
        </div>
      )}
    </>
  )

  if (data.isNewUser) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar title="Dashboard" />
        {banners}
        {onboarding.show && (
          <OnboardingChecklist
            steps={onboarding.steps}
            draftInvoiceId={onboarding.draftInvoiceId}
            orgId={orgId}
          />
        )}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Dashboard" />
      {banners}
      {onboarding.show && (
        <OnboardingChecklist
          steps={onboarding.steps}
          draftInvoiceId={onboarding.draftInvoiceId}
          orgId={orgId}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-20 md:pb-6">
        <AlertStrip data={data.alertStrip} currency={currency} />
        <StatCards data={data.statCards} currency={currency} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          <div className="space-y-5">
            <RevenueChart months={data.revenueChart} currency={currency} />
            <RecentInvoices invoices={data.recentInvoices} currency={currency} />
          </div>
          <div className="space-y-4">
            <DashboardCopilot
              recentClientName={data.recentInvoices[0]?.client?.name}
            />
            <QuickActions />
            <PendingItems
              proposals={data.pendingProposals}
              contracts={data.pendingContracts}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <TopClients clients={data.topClients} />
          <ActivityFeed events={data.recentActivity} />
          <ExpenseSnapshot
            thisMonth={data.expenseSnapshot.thisMonth}
            lastMonth={data.expenseSnapshot.lastMonth}
            topCategory={data.expenseSnapshot.topCategory}
            currency={currency}
          />
        </div>
      </div>
    </div>
  )
}
