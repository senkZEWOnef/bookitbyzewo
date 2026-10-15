import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import { BillingConfigError, appOrigin, ensureBillingColumns, getStripe } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST -> { url } to Stripe's hosted page where the customer updates their card, switches plan or cancels
export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 })

  try {
    await ensureBillingColumns()
    const result = await query('SELECT stripe_customer_id FROM users WHERE id = $1', [userId])
    const customerId = result.rows[0]?.stripe_customer_id
    if (!customerId) {
      return NextResponse.json({ error: 'No subscription found yet. Choose a plan first.' }, { status: 400 })
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appOrigin(request)}/dashboard/settings`
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    if (error instanceof BillingConfigError) {
      return NextResponse.json({ error: 'Payments are not set up yet. Please try again later.' }, { status: 503 })
    }
    console.error('Billing portal error:', error)
    return NextResponse.json({ error: 'Could not open billing. Please try again.' }, { status: 500 })
  }
}
