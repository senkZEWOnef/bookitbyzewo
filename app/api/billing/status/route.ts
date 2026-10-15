import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import { ensureBillingColumns } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Current plan state, always read from the database (the copy in localStorage can be stale)
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureBillingColumns()
  const result = await query(
    'SELECT plan, plan_status, trial_ends_at, subscription_id, stripe_customer_id FROM users WHERE id = $1',
    [userId]
  )
  const user = result.rows[0]
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    plan: user.plan,
    plan_status: user.plan_status,
    trial_ends_at: user.trial_ends_at,
    has_subscription: !!user.subscription_id,
    can_manage_billing: !!user.stripe_customer_id
  })
}
