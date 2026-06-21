import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { Topbar } from "@/components/layout/Topbar"
import { privateMetadata } from "@/lib/metadata"
import { Users } from "lucide-react"
import NewClientButton from "./NewClientButton"
import ClientRowActions from "./ClientRowActions"

export const metadata = { ...privateMetadata, title: "Clients" }
export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ search?: string }>
}

export default async function ClientsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.orgId) redirect("/login")
  const orgId = session.user.orgId

  const { search } = await searchParams

  const where: Record<string, unknown> = { orgId }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }

  const clients = await prisma.client.findMany({
    where,
    include: { _count: { select: { invoices: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Clients" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-20 md:pb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-gray-500">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
          <NewClientButton />
        </div>

        {clients.length > 0 && (
          <form method="GET" className="flex gap-2">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search clients…"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button type="submit" className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg">
              Search
            </button>
            {search && <a href="/clients" className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2">Clear</a>}
          </form>
        )}

        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No clients yet</p>
            <div className="mt-5">
              <NewClientButton />
            </div>
            <p className="text-sm text-gray-400 mt-3">or upload a chat screenshot or email to extract client details</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium">Name</th>
                  <th className="py-3 px-4 text-left text-xs text-gray-400 font-medium hidden md:table-cell">Email</th>
                  <th className="py-3 px-4 text-center text-xs text-gray-400 font-medium">Invoices</th>
                  <th className="py-3 px-4 w-10" />
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/clients/${client.id}`} className="font-medium text-gray-800 hover:text-emerald-700">
                        {client.name}
                      </Link>
                      {client.phone && <p className="text-xs text-gray-400">{client.phone}</p>}
                    </td>
                    <td className="py-3 px-4 text-gray-500 hidden md:table-cell">{client.email ?? "—"}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{client._count.invoices}</td>
                    <td className="py-3 px-2 text-right">
                      <ClientRowActions clientId={client.id} clientName={client.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
