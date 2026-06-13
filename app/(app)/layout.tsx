import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Sidebar, MobileNav } from "@/components/layout/Sidebar"
import { privateMetadata } from "@/lib/metadata"
import CopilotWidget from "@/components/ai/CopilotWidget"
import BugReportButton from "@/components/bug-report/BugReportButton"

export const metadata: Metadata = privateMetadata

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session || session.user?.userType !== "STAFF") {
    redirect("/login")
  }

  const isImpersonating = !!(session.user as { impersonatedBy?: string }).impersonatedBy

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isImpersonating && (
          <div className="bg-amber-500 text-black text-xs font-medium px-4 py-2 flex items-center justify-between shrink-0">
            <span>Impersonating <strong>{session.user?.name || session.user?.email}</strong> ({session.user?.orgName})</span>
            <a href="/admin" className="underline font-semibold">← Back to Admin</a>
          </div>
        )}
        {children}
      </div>
      <MobileNav />
      <CopilotWidget username={session.user?.name ?? undefined} />
      <BugReportButton />
    </div>
  )
}
