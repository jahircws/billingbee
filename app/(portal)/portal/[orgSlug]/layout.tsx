import { notFound } from "next/navigation"
import prisma from "@/lib/db"
import type { Metadata } from "next"

interface Props {
  children: React.ReactNode
  params: Promise<Record<string, string>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orgSlug } = await params
  const org = await prisma.organization.findUnique({ where: { slug: orgSlug }, select: { name: true } })
  return { title: org ? `${org.name} — Client Portal` : "Client Portal" }
}

export default async function PortalLayout({ children, params }: Props) {
  const { orgSlug } = await params

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { name: true, logo: true, plan: true },
  })

  if (!org) notFound()

  const isPro = org.plan === "pro"

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        {org.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={org.logo} alt={org.name} className="h-8 w-auto object-contain" />
        ) : (
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">{org.name[0]}</span>
          </div>
        )}
        <span className="font-semibold text-gray-900">{org.name}</span>
        {!isPro && (
          <span className="ml-auto text-xs text-gray-400">Powered by BillingBee</span>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
