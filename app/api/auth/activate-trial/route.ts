import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    console.log('🟡 Activating trial for user:', userId)

    // Update user to trial status with 30-day trial
    const result = await query(
      'UPDATE users SET plan_status = $1, trial_ends_at = $2, updated_at = NOW() WHERE id = $3 RETURNING id, email, plan, plan_status, trial_ends_at',
      [
        'trial',
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        userId
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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