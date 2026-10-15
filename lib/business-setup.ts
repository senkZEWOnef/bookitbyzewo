import { query, pool } from './db'

// The booking-related columns the settings screens and the API read and write.
// Created on first use so existing databases pick them up without a manual migration.
let columnsReady: Promise<unknown> | null = null

export function ensureBusinessColumns() {
  if (!columnsReady) {
    columnsReady = query(`
      ALTER TABLE businesses
        ADD COLUMN IF NOT EXISTS deposit_enabled BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2) DEFAULT 10,
        ADD COLUMN IF NOT EXISTS deposit_policy TEXT,
        ADD COLUMN IF NOT EXISTS ath_movil_private_token TEXT,
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
        ADD COLUMN IF NOT EXISTS email VARCHAR(255)
    `).catch(error => {
      columnsReady = null
      throw error
    })
  }
  return columnsReady
}

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // drop accents: "Peña" -> "pena"
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
    .replace(/^-+|-+$/g, '')
}

export async function uniqueSlug(base: string) {
  const root = slugify(base) || 'my-business'
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`
    const taken = await query('SELECT 1 FROM businesses WHERE slug = $1', [candidate])
    if (taken.rows.length === 0) return candidate
  }
  return `${root}-${Math.random().toString(36).slice(2, 7)}`
}

export function getStarterServices(businessType?: string) {
  switch (businessType) {
    case 'barber':
      return [
        { name: 'Haircut', duration_min: 45, price_cents: 3500, deposit_cents: 1000 },
        { name: 'Beard Trim', duration_min: 20, price_cents: 1500, deposit_cents: 500 },
        { name: 'Haircut & Beard', duration_min: 60, price_cents: 4500, deposit_cents: 1500 }
      ]
    case 'beauty':
      return [
        { name: 'Manicure', duration_min: 60, price_cents: 3000, deposit_cents: 1000 },
        { name: 'Pedicure', duration_min: 90, price_cents: 4000, deposit_cents: 1500 },
        { name: 'Gel Nails', duration_min: 120, price_cents: 6000, deposit_cents: 2000 }
      ]
    case 'cleaning':
      return [
        { name: 'House Cleaning (Small)', duration_min: 120, price_cents: 8000, deposit_cents: 2000 },
        { name: 'House Cleaning (Large)', duration_min: 240, price_cents: 15000, deposit_cents: 3000 },
        { name: 'Deep Cleaning', duration_min: 300, price_cents: 20000, deposit_cents: 5000 }
      ]
    case 'tutor':
      return [
        { name: '1-on-1 Tutoring', duration_min: 60, price_cents: 5000, deposit_cents: 1000 },
        { name: 'Group Session', duration_min: 90, price_cents: 7500, deposit_cents: 1500 }
      ]
    case 'handyman':
      return [
        { name: 'Estimate / Visit', duration_min: 30, price_cents: 2500, deposit_cents: 500 },
        { name: 'Repair (per hour)', duration_min: 60, price_cents: 6000, deposit_cents: 1500 }
      ]
    case 'health':
      return [
        { name: 'Initial Consultation', duration_min: 60, price_cents: 6000, deposit_cents: 1500 },
        { name: 'Follow-up Session', duration_min: 45, price_cents: 4500, deposit_cents: 1000 }
      ]
    default:
      return [
        { name: 'Consultation', duration_min: 30, price_cents: 2500, deposit_cents: 500 },
        { name: 'Service', duration_min: 60, price_cents: 5000, deposit_cents: 1000 }
      ]
  }
}

async function insertStarterServices(businessId: string, businessType?: string) {
  for (const service of getStarterServices(businessType)) {
    await query(
      `INSERT INTO services (business_id, name, duration_minutes, price_cents, deposit_cents, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())`,
      [businessId, service.name, service.duration_min, service.price_cents, service.deposit_cents]
    )
  }
}

// Monday-Friday 9-5, Saturday 10-3, Sunday closed
async function insertDefaultHours(businessId: string) {
  const days = [
    { day: 0, closed: true },
    ...[1, 2, 3, 4, 5].map(day => ({ day, closed: false, open: '09:00', close: '17:00' })),
    { day: 6, closed: false, open: '10:00', close: '15:00' }
  ]
  for (const d of days as { day: number; closed: boolean; open?: string; close?: string }[]) {
    await query(
      `INSERT INTO business_default_hours (business_id, day_of_week, is_closed, open_time, close_time, slot_duration_minutes, break_times, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 30, '[]', NOW(), NOW())`,
      [businessId, d.day, d.closed, d.open || null, d.close || null]
    )
  }
}

export async function createBusiness(input: {
  userId: string
  name: string
  slug?: string
  location?: string | null
  timezone?: string
  businessType?: string
}) {
  await ensureBusinessColumns()
  const slug = input.slug || (await uniqueSlug(input.name))
  const result = await query(
    `INSERT INTO businesses (name, slug, location, timezone, owner_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, name, slug`,
    [input.name, slug, input.location || null, input.timezone || 'America/Puerto_Rico', input.userId]
  )
  const business = result.rows[0]
  await insertStarterServices(business.id, input.businessType)
  await insertDefaultHours(business.id)
  return business as { id: string; name: string; slug: string }
}

// Makes sure an account owns at least one store. New accounts get one named after them,
// which they can rename right away (onboarding and Settings).
export async function ensureDefaultBusiness(userId: string, locale: 'es' | 'en' = 'es') {
  // Two requests can arrive together (dashboard layout + onboarding page). A per-user lock makes the
  // second one wait and then find the store the first one created, instead of making a duplicate.
  const lock = await pool.connect()
  try {
    await lock.query('SELECT pg_advisory_lock(hashtext($1))', [`ensure-business:${userId}`])
    return await ensureDefaultBusinessLocked(userId, locale)
  } finally {
    await lock.query('SELECT pg_advisory_unlock(hashtext($1))', [`ensure-business:${userId}`]).catch(() => {})
    lock.release()
  }
}

async function ensureDefaultBusinessLocked(userId: string, locale: 'es' | 'en') {
  const existing = await query(
    'SELECT id, name, slug FROM businesses WHERE owner_id = $1 ORDER BY created_at ASC LIMIT 1',
    [userId]
  )
  if (existing.rows.length > 0) return { business: existing.rows[0], created: false }

  const user = await query('SELECT full_name, email FROM users WHERE id = $1', [userId])
  const fullName = (user.rows[0]?.full_name || user.rows[0]?.email?.split('@')[0] || '').trim()
  const first = fullName.split(/\s+/)[0] || ''
  const name = first
    ? (locale === 'es' ? `Negocio de ${first}` : `${first}'s Business`)
    : (locale === 'es' ? 'Mi Negocio' : 'My Business')

  const business = await createBusiness({ userId, name })
  return { business, created: true }
}

// Swaps the generic starter services for a template, but only while the store has no appointments yet
export async function applyStarterTemplate(businessId: string, businessType: string): Promise<boolean> {
  const booked = await query('SELECT 1 FROM appointments WHERE business_id = $1 LIMIT 1', [businessId])
  if (booked.rows.length > 0) return false
  await query('DELETE FROM services WHERE business_id = $1', [businessId])
  await insertStarterServices(businessId, businessType)
  return true
}
