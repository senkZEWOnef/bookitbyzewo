import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { ensureModerationColumns, BUSINESS_IS_OPEN } from '@/lib/moderation'
import { ensureShopTables, ownerCanUseShop } from '@/lib/shop'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  await ensureModerationColumns()
  await ensureShopTables()
  const b = await query(
    `SELECT b.id, b.name, b.slug, b.description, b.location, b.phone FROM businesses b
     LEFT JOIN users u ON u.id = b.owner_id WHERE b.slug = $1 AND ${BUSINESS_IS_OPEN}`,
    [params.slug]
  )
  const business = b.rows[0]
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const s = await query('SELECT * FROM shop_settings WHERE business_id = $1', [business.id])
  const settings = s.rows[0]
  if (!settings?.enabled || !(await ownerCanUseShop(business.id))) {
    return NextResponse.json({ error: 'This shop is not open' }, { status: 404 })
  }
  const p = await query(
    `SELECT id, name, description, category, price_cents, price_mode, image_url FROM products
     WHERE business_id = $1 AND is_active = true ORDER BY category NULLS LAST, created_at ASC`,
    [business.id]
  )
  return NextResponse.json({
    business,
    shop: {
      pickup_enabled: settings.pickup_enabled,
      delivery_enabled: settings.delivery_enabled,
      delivery_fee_cents: settings.delivery_fee_cents,
      delivery_note: settings.delivery_note
    },
    products: p.rows
  })
}
