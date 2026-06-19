import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { generatePaymentToken } from "@/lib/payment-token"

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
    select: { id: true, orgId: true },
  })
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const token = generatePaymentToken(invoice.id, invoice.orgId)
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://billingbee.co"
  return NextResponse.json({ url: `${base}/pay/${token}` })
}
