import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import { ensureDefaultBusiness } from '@/lib/business-setup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST { locale?: 'es' | 'en' } -> the account's store, created on the spot if it has none
export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    const locale = body.locale === 'en' ? 'en' : 'es'

    const result = await query('SELECT plan_status, trial_ends_at FROM users WHERE id = $1', [userId])
    const user = result.rows[0]
    const hasAccess =
      user &&
      (user.plan_status === 'active' ||
        (user.plan_status === 'trial' && user.trial_ends_at && new Date(user.trial_ends_at) > new Date()))
    if (!hasAccess) {
      return NextResponse.json({ error: 'Active subscription required.' }, { status: 402 })
    }

    const { business, created } = await ensureDefaultBusiness(userId, locale)
    return NextResponse.json({ success: true, business, created })
  } catch (error) {
    console.error('Ensure business error:', error)
    return NextResponse.json({ error: 'Failed to set up your store' }, { status: 500 })
  }
}
