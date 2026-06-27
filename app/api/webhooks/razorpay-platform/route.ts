import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('x-razorpay-signature') ?? ''
  const secret = process.env.RAZORPAY_PLATFORM_WEBHOOK_SECRET

  if (!secret) {
    console.error('RAZORPAY_PLATFORM_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const expected = createHmac('sha256', secret).update(body).digest('hex')
  const expectedBuf = Buffer.from(expected, 'hex')
  const actualBuf = Buffer.from(sig, 'hex')
  if (
    expectedBuf.length !== actualBuf.length ||
    !timingSafeEqual(expectedBuf, actualBuf)
  ) {
    console.error('Razorpay platform webhook signature mismatch')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)
  const eventType: string = event.event

  const subscription = event.payload?.subscription?.entity
  if (!subscription) {
    return NextResponse.json({ received: true })
  }

  const orgId: string | undefined = subscription.notes?.orgId
  if (!orgId) {
    console.error('Razorpay platform webhook: missing orgId in notes')
    return NextResponse.json({ received: true })
  }

  try {
    if (eventType === 'subscription.charged') {
      await db.organization.update({
        where: { id: orgId },
        data: {
          plan: 'pro',
          razorpaySubscriptionId: subscription.id,
        },
      })
      console.log(`BillingBee Pro activated via Razorpay for org ${orgId}`)
    }

    if (eventType === 'subscription.cancelled' || eventType === 'subscription.completed') {
      await db.organization.update({
        where: { id: orgId },
        data: {
          plan: 'free',
          razorpaySubscriptionId: null,
        },
      })
      console.log(`BillingBee plan downgraded for org ${orgId} — event: ${eventType}`)
    }
  } catch (error) {
    console.error('Razorpay platform webhook DB error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
