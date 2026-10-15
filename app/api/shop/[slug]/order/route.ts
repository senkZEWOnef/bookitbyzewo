import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { ensureModerationColumns, BUSINESS_IS_OPEN } from '@/lib/moderation'
import { ensureShopTables, ownerCanUseShop } from '@/lib/shop'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Prices are always read from the database; the browser only sends product ids and quantities.
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const body = await request.json()
    const name = String(body.customerName || '').trim().slice(0, 255)
    const phone = String(body.customerPhone || '').trim().slice(0, 50)
    const notes = String(body.notes || '').trim().slice(0, 1000) || null
    const lines: { productId: string; quantity: number }[] = Array.isArray(body.items) ? body.items.slice(0, 60) : []
    if (!name || !phone || lines.length === 0) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    await ensureModerationColumns()
    await ensureShopTables()
    const b = await query(
      `SELECT b.id, b.name, b.phone FROM businesses b LEFT JOIN users u ON u.id = b.owner_id WHERE b.slug = $1 AND ${BUSINESS_IS_OPEN}`,
      [params.slug]
    )
    const business = b.rows[0]
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    const s = (await query('SELECT * FROM shop_settings WHERE business_id = $1', [business.id])).rows[0]
    if (!s?.enabled || !(await ownerCanUseShop(business.id))) return NextResponse.json({ error: 'This shop is not open' }, { status: 404 })

    const fulfillment = body.fulfillment === 'delivery' ? 'delivery' : 'pickup'
    if ((fulfillment === 'delivery' && !s.delivery_enabled) || (fulfillment === 'pickup' && !s.pickup_enabled)) {
      return NextResponse.json({ error: 'That option is not available' }, { status: 400 })
    }
    const address = fulfillment === 'delivery' ? String(body.address || '').trim().slice(0, 500) : null
    if (fulfillment === 'delivery' && !address) return NextResponse.json({ error: 'Delivery address required' }, { status: 400 })

    const ids = lines.map(l => l.productId)
    const found = (await query(
      'SELECT id, name, price_cents, price_mode FROM products WHERE business_id = $1 AND is_active = true AND id = ANY($2::uuid[])',
      [business.id, ids]
    )).rows
    const byId = new Map<string, any>(found.map((p: any) => [p.id, p]))
    const items = lines
      .map(l => ({ p: byId.get(l.productId), qty: Math.min(99, Math.max(1, Math.floor(Number(l.quantity) || 1))) }))
      .filter(x => x.p)
    if (items.length === 0) return NextResponse.json({ error: 'Products not found' }, { status: 400 })

    // Any "request a quote" product turns the whole thing into a quote request (no total, owner replies with a price).
    const isQuote = items.some(x => x.p.price_mode === 'quote')
    const subtotal = isQuote ? 0 : items.reduce((sum, x) => sum + x.p.price_cents * x.qty, 0)
    const fee = !isQuote && fulfillment === 'delivery' ? s.delivery_fee_cents : 0

    const o = await query(
      `INSERT INTO orders (business_id, kind, customer_name, customer_phone, fulfillment, address, notes, subtotal_cents, delivery_fee_cents, total_cents)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [business.id, isQuote ? 'quote' : 'order', name, phone, fulfillment, address, notes, subtotal, fee, subtotal + fee]
    )
    const orderId = o.rows[0].id
    for (const x of items) {
      await query('INSERT INTO order_items (order_id, product_id, name, price_cents, quantity) VALUES ($1,$2,$3,$4,$5)',
        [orderId, x.p.id, x.p.name, x.p.price_cents, x.qty])
    }
    return NextResponse.json({
      success: true,
      order: { id: orderId, kind: isQuote ? 'quote' : 'order', total_cents: subtotal + fee, business_name: business.name, business_phone: business.phone }
    })
  } catch (error) {
    console.error('Shop order error:', error)
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 })
  }
}
