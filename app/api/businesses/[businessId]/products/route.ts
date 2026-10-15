import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import { ensureShopTables, ownerCanUseShop, verifyOwner } from '@/lib/shop'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: { businessId: string } }

async function guard(request: NextRequest, businessId: string) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyOwner(businessId, userId))) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  await ensureShopTables()
  return null
}

function clean(body: any) {
  const name = String(body.name || '').trim().slice(0, 255)
  const price_mode = body.price_mode === 'quote' ? 'quote' : 'fixed'
  const price_cents = price_mode === 'quote' ? 0 : Math.max(0, Math.round(Number(body.price_cents) || 0))
  const image = typeof body.image_url === 'string' ? body.image_url : null
  // Images are stored inline as small data URLs (downscaled in the browser); refuse anything huge.
  if (image && image.length > 600_000) return { error: 'Image too large' }
  return {
    name,
    description: String(body.description || '').trim().slice(0, 2000) || null,
    category: String(body.category || '').trim().slice(0, 100) || null,
    price_cents,
    price_mode,
    image_url: image,
    is_active: body.is_active !== false
  }
}

export async function GET(request: NextRequest, { params }: Ctx) {
  const denied = await guard(request, params.businessId)
  if (denied) return denied
  const r = await query('SELECT * FROM products WHERE business_id = $1 ORDER BY category NULLS LAST, created_at DESC', [params.businessId])
  return NextResponse.json({ products: r.rows })
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const denied = await guard(request, params.businessId)
  if (denied) return denied
  if (!(await ownerCanUseShop(params.businessId))) return NextResponse.json({ error: 'The shop is a Pro feature', code: 'upgrade' }, { status: 403 })
  const data: any = clean(await request.json())
  if (data.error) return NextResponse.json({ error: data.error }, { status: 400 })
  if (!data.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const r = await query(
    `INSERT INTO products (business_id, name, description, category, price_cents, price_mode, image_url, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [params.businessId, data.name, data.description, data.category, data.price_cents, data.price_mode, data.image_url, data.is_active]
  )
  return NextResponse.json({ product: r.rows[0] })
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const denied = await guard(request, params.businessId)
  if (denied) return denied
  const body = await request.json()
  const data: any = clean(body)
  if (data.error) return NextResponse.json({ error: data.error }, { status: 400 })
  if (!body.id || !data.name) return NextResponse.json({ error: 'Invalid product' }, { status: 400 })
  const r = await query(
    `UPDATE products SET name=$3, description=$4, category=$5, price_cents=$6, price_mode=$7, image_url=$8, is_active=$9, updated_at=NOW()
     WHERE id=$1 AND business_id=$2 RETURNING *`,
    [body.id, params.businessId, data.name, data.description, data.category, data.price_cents, data.price_mode, data.image_url, data.is_active]
  )
  if (!r.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ product: r.rows[0] })
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const denied = await guard(request, params.businessId)
  if (denied) return denied
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await query('DELETE FROM products WHERE id=$1 AND business_id=$2', [id, params.businessId])
  return NextResponse.json({ success: true })
}
