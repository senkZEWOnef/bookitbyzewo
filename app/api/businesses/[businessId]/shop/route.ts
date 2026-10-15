import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import { ensureShopTables, ownerCanUseShop, verifyOwner } from '@/lib/shop'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: { businessId: string } }

export async function GET(request: NextRequest, { params }: Ctx) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyOwner(params.businessId, userId))) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  await ensureShopTables()
  const r = await query('SELECT * FROM shop_settings WHERE business_id = $1', [params.businessId])
  const allowed = await ownerCanUseShop(params.businessId)
  return NextResponse.json({
    allowed,
    settings: r.rows[0] || { enabled: false, pickup_enabled: true, delivery_enabled: false, delivery_fee_cents: 0, delivery_note: '' }
  })
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyOwner(params.businessId, userId))) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  if (!(await ownerCanUseShop(params.businessId))) return NextResponse.json({ error: 'The shop is a Pro feature', code: 'upgrade' }, { status: 403 })
  await ensureShopTables()
  const b = await request.json()
  const pickup = b.pickup_enabled !== false
  const delivery = !!b.delivery_enabled
  if (!pickup && !delivery) return NextResponse.json({ error: 'Enable pickup or delivery' }, { status: 400 })
  await query(
    `INSERT INTO shop_settings (business_id, enabled, pickup_enabled, delivery_enabled, delivery_fee_cents, delivery_note, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW())
     ON CONFLICT (business_id) DO UPDATE SET enabled=$2, pickup_enabled=$3, delivery_enabled=$4, delivery_fee_cents=$5, delivery_note=$6, updated_at=NOW()`,
    [params.businessId, !!b.enabled, pickup, delivery, Math.max(0, Math.round(Number(b.delivery_fee_cents) || 0)), String(b.delivery_note || '').slice(0, 500) || null]
  )
  return NextResponse.json({ success: true })
}
