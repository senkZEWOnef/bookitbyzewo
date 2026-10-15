import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import { ensureDefaultBusiness } from '@/lib/business-setup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // The account comes from the login token, never from the request body
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Please log in again.' }, { status: 401 })
    }

    console.log('🟡 Activating trial for user:', userId)

    // One free trial per account: only accounts that never started one can activate it
    const result = await query(
      `UPDATE users SET plan_status = $1, trial_ends_at = $2, updated_at = NOW()
       WHERE id = $3 AND plan_status = 'incomplete'
       RETURNING id, email, plan, plan_status, trial_ends_at`,
      [
        'trial',
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        userId
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'A free trial has already been used on this account.' }, { status: 409 })
    }
    await ensureDefaultBusiness(userId).catch(error => console.error('Default business setup failed:', error))

    const user = result.rows[0]
    console.log('✅ Trial activated for user:', user.email)

    return NextResponse.json({
      message: 'Free trial activated successfully',
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        plan_status: user.plan_status,
        trial_ends_at: user.trial_ends_at
      }
    })

  } catch (error) {
    console.error('Trial activation error:', error)
    return NextResponse.json(
      { error: 'Failed to activate trial' },
      { status: 500 }
    )
  }
}