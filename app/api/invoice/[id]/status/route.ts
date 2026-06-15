import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const orgId = session.user.orgId
  const { id } = await params

  const invoice = await prisma.invoice.findUnique({
    where: { id, orgId },
    select: { status: true, paidAt: true },
  })
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ status: invoice.status, paidAt: invoice.paidAt })
}
