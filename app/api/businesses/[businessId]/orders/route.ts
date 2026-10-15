import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import { ensureShopTables, verifyOwner } from '@/lib/shop'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: { businessId: string } }
const STATUSES = ['new', 'confirmed', 'ready', 'completed', 'cancelled']

async function guard(request: NextRequest, businessId: string) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyOwner(businessId, userId))) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  await ensureShopTables()
  return null
}

export async function GET(request: NextRequest, { params }: Ctx) {
  const denied = await guard(request, params.businessId)
  if (denied) return denied
  const r = await query(
    `SELECT o.*, COALESCE(json_agg(json_build_object('name', i.name, 'price_cents', i.price_cents, 'quantity', i.quantity))
              FILTER (WHERE i.id IS NOT NULL), '[]') AS items
     FROM orders o LEFT JOIN order_items i ON i.order_id = o.id
     WHERE o.business_id = $1 GROUP BY o.id ORDER BY o.created_at DESC LIMIT 200`,
    [params.businessId]
  )
  return NextResponse.json({ orders: r.rows })
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const denied = await guard(request, params.businessId)
  if (denied) return denied
  const { id, status } = await request.json()
  if (!id || !STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  await query('UPDATE orders SET status=$3 WHERE id=$1 AND business_id=$2', [id, params.businessId, status])
  return NextResponse.json({ success: true })
}
