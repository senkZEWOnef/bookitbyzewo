import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import { ensureModerationColumns } from '@/lib/moderation'
import {
  BillingConfigError, appOrigin, ensureBillingColumns, getStripe, isBillingPlan, subscriptionLineItem
} from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MIN_TRIAL_REMAINING_MS = 2 * 24 * 60 * 60 * 1000 // Stripe needs a trial end at least ~48h away

// POST { plan: 'solo' | 'pro' } -> { url } to redirect the browser to Stripe Checkout
export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 })

  try {
    const { plan } = await request.json()
    if (!isBillingPlan(plan)) return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 })

    await ensureBillingColumns()
    await ensureModerationColumns()
    const result = await query(
      'SELECT id, email, full_name, plan_status, trial_ends_at, subscription_id, stripe_customer_id, banned_at FROM users WHERE id = $1',
      [userId]
    )
    const user = result.rows[0]
    if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
    if (user.banned_at) return NextResponse.json({ error: 'This account has been suspended.' }, { status: 403 })

    if (user.plan_status === 'active' && user.subscription_id) {
      return NextResponse.json(
        { error: 'You already have an active subscription. Use "Manage billing" to change it.' },
        { status: 400 }
      )
    }

    const stripe = getStripe()

    let customerId: string | null = user.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name || undefined,
        metadata: { user_id: user.id }
      })
      customerId = customer.id
      await query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, user.id])
    }

    // Someone still inside a free trial / trial code keeps it: the first charge happens when it ends
    const trialEndsAt = user.plan_status === 'trial' && user.trial_ends_at ? new Date(user.trial_ends_at) : null
    const keepTrial = trialEndsAt && trialEndsAt.getTime() - Date.now() > MIN_TRIAL_REMAINING_MS

    const origin = appOrigin(request)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [subscriptionLineItem(plan)],
      allow_promotion_codes: true,
      metadata: { user_id: user.id, plan },
      subscription_data: {
        metadata: { user_id: user.id, plan },
        ...(keepTrial ? { trial_end: Math.floor(trialEndsAt!.getTime() / 1000) } : {})
      },
      success_url: `${origin}/dashboard?subscribed=1`,
      cancel_url: `${origin}/upgrade-plan?canceled=1`
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    if (error instanceof BillingConfigError) {
      console.error(error.message)
      return NextResponse.json({ error: 'Payments are not set up yet. Please try again later.' }, { status: 503 })
    }
    console.error('Billing checkout error:', error)
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 })
  }
}
