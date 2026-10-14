import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { createTrialCode, TrialCodeError } from '@/lib/trial-codes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST { tier: 'full' | 'basic', free_trial_months: 1-12, max_uses: 1-100, expires_days: 1-365, label? }
export async function POST(request: NextRequest) {
  if (!(await getAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const result = await createTrialCode({
      tier: body.tier,
      free_trial_months: body.free_trial_months,
      max_uses: body.max_uses,
      expires_days: body.expires_days,
      label: typeof body.label === 'string' ? body.label : ''
    })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    if (error instanceof TrialCodeError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Generate coupon error:', error)
    return NextResponse.json({ error: 'Failed to generate coupon' }, { status: 500 })
  }
}
