import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import { applyStarterTemplate } from '@/lib/business-setup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TYPES = ['barber', 'beauty', 'cleaning', 'handyman', 'tutor', 'health', 'other']

// POST { businessType } -> replaces the starter services with that type's template (only before the first booking)
export async function POST(request: NextRequest, { params }: { params: { businessId: string } }) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { businessType } = await request.json()
    if (!TYPES.includes(businessType)) return NextResponse.json({ error: 'Invalid business type' }, { status: 400 })

    const owned = await query('SELECT id FROM businesses WHERE id = $1 AND owner_id = $2', [params.businessId, userId])
    if (owned.rows.length === 0) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

    const applied = await applyStarterTemplate(params.businessId, businessType)
    return NextResponse.json({ success: true, applied })
  } catch (error) {
    console.error('Starter services error:', error)
    return NextResponse.json({ error: 'Failed to apply services' }, { status: 500 })
  }
}
