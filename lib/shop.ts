import { query } from './db'
import { getPlanLimits } from './plans'

// Shop tables are created on first use so no manual migration is needed (same approach as lib/moderation.ts).
let ready: Promise<unknown> | null = null

export function ensureShopTables() {
  if (!ready) {
    ready = (async () => {
      await query(`CREATE TABLE IF NOT EXISTS shop_settings (
        business_id UUID PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
        enabled BOOLEAN NOT NULL DEFAULT false,
        pickup_enabled BOOLEAN NOT NULL DEFAULT true,
        delivery_enabled BOOLEAN NOT NULL DEFAULT false,
        delivery_fee_cents INTEGER NOT NULL DEFAULT 0,
        delivery_note TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )`)
      await query(`CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        price_cents INTEGER NOT NULL DEFAULT 0,
        price_mode VARCHAR(10) NOT NULL DEFAULT 'fixed',
        image_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`)
      await query('CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id)')
      await query(`CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        kind VARCHAR(10) NOT NULL DEFAULT 'order',
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        fulfillment VARCHAR(10) NOT NULL DEFAULT 'pickup',
        address TEXT,
        notes TEXT,
        subtotal_cents INTEGER NOT NULL DEFAULT 0,
        delivery_fee_cents INTEGER NOT NULL DEFAULT 0,
        total_cents INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'new',
        created_at TIMESTAMP DEFAULT NOW()
      )`)
      await query('CREATE INDEX IF NOT EXISTS idx_orders_business ON orders(business_id, created_at DESC)')
      await query(`CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID,
        name VARCHAR(255) NOT NULL,
        price_cents INTEGER NOT NULL DEFAULT 0,
        quantity INTEGER NOT NULL DEFAULT 1
      )`)
    })().catch(error => {
      ready = null
      throw error
    })
  }
  return ready
}

// The shop is a Pro feature. The owner needs an active subscription or a running trial, like the assistant.
export async function ownerCanUseShop(businessId: string): Promise<boolean> {
  const r = await query(
    `SELECT u.plan, u.plan_status, u.trial_ends_at FROM businesses b JOIN users u ON u.id = b.owner_id WHERE b.id = $1`,
    [businessId]
  )
  const u = r.rows[0]
  if (!u) return false
  const live = u.plan_status === 'active' || (u.plan_status === 'trial' && u.trial_ends_at && new Date(u.trial_ends_at) > new Date())
  return !!live && getPlanLimits(u.plan).hasShop
}

export async function verifyOwner(businessId: string, userId: string) {
  const r = await query('SELECT id FROM businesses WHERE id = $1 AND owner_id = $2', [businessId, userId])
  return r.rows.length > 0
}
