import { NextRequest, NextResponse } from "next/server"
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { auth } from "@/auth"
import prisma from "@/lib/db"

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.AWS_S3_BUCKET ?? "billingbee-uploads"

function s3KeyFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // e.g. https://billingbee-uploads.s3.ap-south-1.amazonaws.com/upi-qr/...
    return u.pathname.slice(1) // strip leading /
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const orgId = session.user.orgId

  const form = await req.formData()
  const file = form.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 })
  }

  const allowed = ["image/jpeg", "image/png", "image/webp"]
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG or WebP allowed" }, { status: 400 })
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Max file size is 2MB" }, { status: 400 })
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
  const key = `upi-qr/${orgId}/${Date.now()}.${ext}`

  // Delete old QR image from S3 if present
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { upiQrUrl: true } })
  if (org?.upiQrUrl) {
    const oldKey = s3KeyFromUrl(org.upiQrUrl)
    if (oldKey) {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: oldKey })).catch(() => null)
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  }))

  const url = `https://${BUCKET}.s3.${process.env.AWS_REGION ?? "ap-south-1"}.amazonaws.com/${key}`

  await prisma.organization.update({ where: { id: orgId }, data: { upiQrUrl: url } })

  return NextResponse.json({ url })
}

export async function DELETE(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const orgId = session.user.orgId

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { upiQrUrl: true } })
  if (org?.upiQrUrl) {
    const oldKey = s3KeyFromUrl(org.upiQrUrl)
    if (oldKey) {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: oldKey })).catch(() => null)
    }
  }

  await prisma.organization.update({ where: { id: orgId }, data: { upiQrUrl: null } })

  return NextResponse.json({ ok: true })
}
