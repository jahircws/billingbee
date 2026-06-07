import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin-auth"
import AdminSidebar from "@/app/(admin)/AdminSidebar"

export default async function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      <AdminSidebar adminName={session.name ?? session.email} adminRole={session.role} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
