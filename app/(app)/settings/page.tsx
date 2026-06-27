import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { serialize } from "@/lib/serialize"
import { getGeoDefaults } from "@/lib/geo"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import ProfileTab from "./ProfileTab"
import OrgTab from "./OrgTab"
import UpiQrSection from "./UpiQrSection"
import TaxesTab from "./TaxesTab"
import ItemsTab from "./ItemsTab"
import PlanTab from "./PlanTab"
import Link from "next/link"

export const metadata = { ...privateMetadata, title: "Settings" }
export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ tab?: string }>
}

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "org", label: "Organization" },
  { id: "taxes", label: "Taxes" },
  { id: "items", label: "Items" },
  { id: "gateways", label: "Gateways" },
  { id: "plan", label: "Plan" },
]

export default async function SettingsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { tab = "profile" } = await searchParams

  const [[org, user, taxes, items], geo] = await Promise.all([
    prisma.$transaction([
      prisma.organization.findUnique({ where: { id: orgId } }),
      prisma.user.findUnique({ where: { id: session.user.userId! } }),
      prisma.tax.findMany({ where: { orgId, isActive: true }, orderBy: { name: "asc" } }),
      prisma.item.findMany({ where: { orgId, isActive: true }, orderBy: { name: "asc" } }),
    ]).then(serialize),
    getGeoDefaults(),
  ])
  const isIndia = geo.country === "IN"

  if (!org || !user) redirect("/login")

  // Usage counts for plan tab
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const [invoiceCount, clientCount] = await Promise.all([
    prisma.invoice.count({ where: { orgId, createdAt: { gte: startOfMonth } } }),
    prisma.client.count({ where: { orgId } }),
  ])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Settings" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-100 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            t.id === "gateways" ? (
              <a
                key={t.id}
                href="/settings/gateways"
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                  tab === t.id
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </a>
            ) : (
              <a
                key={t.id}
                href={`?tab=${t.id}`}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                  tab === t.id
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </a>
            )
          ))}
        </div>

        <div className="max-w-2xl">
          {tab === "profile" && <ProfileTab user={user} />}
          {tab === "org" && (
            <div className="space-y-8">
              <OrgTab org={org} />
              <div className="border-t border-gray-100 pt-6">
                <UpiQrSection initialUrl={org.upiQrUrl ?? null} initialUpiId={org.upiId ?? null} />
              </div>
            </div>
          )}
          {tab === "taxes" && <TaxesTab taxes={taxes} orgId={orgId} />}
          {tab === "items" && <ItemsTab items={items} orgId={orgId} currency={org.currency ?? "INR"} />}
          {tab === "plan" && (
            <PlanTab
              org={org}
              invoiceCount={invoiceCount}
              clientCount={clientCount}
              isIndia={isIndia}
            />
          )}
        </div>
      </div>
    </div>
  )
}
