import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Sidebar, MobileNav } from "@/components/layout/Sidebar"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session || session.user?.userType !== "STAFF") {
    redirect("/login")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
      <MobileNav />
    </div>
  )
}
