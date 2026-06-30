import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import NewProposalForm from "./NewProposalForm"
import Link from "next/link"
import { Info } from "lucide-react"

export const metadata = { ...privateMetadata, title: "New Proposal" }
export const dynamic = "force-dynamic"

export default async function NewProposalPage() {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const [clients, org] = await Promise.all([
    prisma.client.findMany({
      where: { orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { logo: true, currency: true },
    }),
  ])

  const isIndia = org?.currency === "INR"
  const hasLogo = !!org?.logo

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="New Proposal" showBack backHref="/proposals" />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {!hasLogo && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
              <Info size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <span className="flex-1">
                Your proposals will show your business name instead of a logo.{" "}
                <Link href="/settings?tab=org" className="underline font-medium">Upload logo in Settings →</Link>
              </span>
            </div>
          )}
          <NewProposalForm clients={clients} isIndia={isIndia} />
        </div>
      </div>
    </div>
  )
}
