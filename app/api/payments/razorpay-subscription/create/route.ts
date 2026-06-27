import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import db from '@/lib/db'
import Razorpay from 'razorpay'

export async function POST() {
  const session = await auth()
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const orgId = session.user.orgId

  const org = await db.organization.findUnique({ where: { id: orgId } })
  if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })
  if (org.plan === 'pro') {
    return NextResponse.json({ error: 'Already on Pro plan' }, { status: 400 })
  }

  const keyId = process.env.RAZORPAY_PLATFORM_KEY_ID
  const keySecret = process.env.RAZORPAY_PLATFORM_KEY_SECRET
  const planId = process.env.RAZORPAY_PLAN_ID_PRO
  if (!keyId || !keySecret || !planId) {
    console.error('Missing Razorpay platform env vars')
    return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 })
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 120,
      quantity: 1,
      notes: {
        orgId,
        orgName: org.name,
        plan: 'pro',
      },
    })

    return NextResponse.json({
      subscriptionId: subscription.id,
      key: keyId,
    })
  } catch (error) {
    console.error('Razorpay subscription create error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
