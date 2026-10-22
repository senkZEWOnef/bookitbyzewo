import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_WEEKS = [1, 2, 3, 4, 5, 6, 8]

async function loadOwnedBusiness(businessId: string, userId: string) {
  const result = await query(
    'SELECT id, name, phone, timezone FROM businesses WHERE id = $1 AND owner_id = $2',
    [businessId, userId]
  )
  return result.rows[0] || null
}

// Appointments created by the booking page store UTC, recurring ones store the shop's wall-clock time.
// This turns either into the shop's local time so "today" means the barber's today.
const LOCAL_START = `(CASE WHEN a.source = 'recurring' THEN a.starts_at ELSE (a.starts_at AT TIME ZONE 'UTC') AT TIME ZONE $2 END)`

// Today's lineup for the Morning Run
export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await loadOwnedBusiness(params.businessId, userId)
    if (!business) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS morning_reminded_at TIMESTAMP')

    const timezone = business.timezone || 'America/Puerto_Rico'
    const dateParam = new URL(request.url).searchParams.get('date')
    if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }

    const todayResult = await query(`SELECT to_char(NOW() AT TIME ZONE $1, 'YYYY-MM-DD') AS today`, [timezone])
    const date = dateParam || todayResult.rows[0].today

    const result = await query(`
      SELECT
        a.id,
        a.customer_name,
        a.customer_phone,
        a.customer_locale,
        a.status,
        a.morning_reminded_at,
        to_char(${LOCAL_START}, 'HH24:MI') AS local_time,
        s.name AS service_name,
        s.duration_minutes AS service_duration,
        EXISTS (
          SELECT 1 FROM appointments n
          WHERE n.business_id = a.business_id
            AND n.customer_phone = a.customer_phone
            AND n.status IN ('confirmed', 'pending')
            AND n.starts_at > a.starts_at
        ) AS has_next
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.business_id = $1
        AND a.status IN ('confirmed', 'pending', 'completed')
        AND to_char(${LOCAL_START}, 'YYYY-MM-DD') = $3
      ORDER BY ${LOCAL_START} ASC
    `, [business.id, timezone, date])

    return NextResponse.json({
      success: true,
      date,
      business: { id: business.id, name: business.name, phone: business.phone, timezone },
      appointments: result.rows
    })
  } catch (error) {
    console.error('Morning run fetch error:', error)
    return NextResponse.json({ error: 'Failed to load the morning run' }, { status: 500 })
  }
}

// Mark reminders as sent, or rebook a client N weeks out
export async function POST(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await loadOwnedBusiness(params.businessId, userId)
    if (!business) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()

    if (body.action === 'sent') {
      const ids: string[] = Array.isArray(body.appointmentIds) ? body.appointmentIds : []
      if (ids.length === 0) {
        return NextResponse.json({ error: 'No appointments given' }, { status: 400 })
      }
      await query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS morning_reminded_at TIMESTAMP')
      await query(
        'UPDATE appointments SET morning_reminded_at = NOW() WHERE business_id = $1 AND id = ANY($2::uuid[])',
        [business.id, ids]
      )
      return NextResponse.json({ success: true })
    }

    if (body.action === 'rebook') {
      const weeks = Number(body.weeks)
      if (!ALLOWED_WEEKS.includes(weeks) || !body.appointmentId) {
        return NextResponse.json({ error: 'Invalid rebook request' }, { status: 400 })
      }

      const sourceResult = await query(
        'SELECT * FROM appointments WHERE id = $1 AND business_id = $2',
        [body.appointmentId, business.id]
      )
      const source = sourceResult.rows[0]
      if (!source) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }

      // Adding whole weeks to the stored value keeps whatever time convention the original used
      const interval = `${weeks * 7} days`
      const clash = await query(`
        SELECT 1 FROM appointments o, appointments src
        WHERE src.id = $2
          AND o.business_id = $1
          AND o.status IN ('confirmed', 'pending')
          AND o.starts_at < src.starts_at + $3::interval + make_interval(mins => COALESCE(src.duration_minutes, 30))
          AND o.starts_at + make_interval(mins => COALESCE(o.duration_minutes, 30)) > src.starts_at + $3::interval
        LIMIT 1
      `, [business.id, source.id, interval])
      if (clash.rows.length > 0) {
        return NextResponse.json({ error: 'That slot is already taken. Pick another interval.' }, { status: 409 })
      }

      const created = await query(`
        INSERT INTO appointments (
          business_id, service_id, customer_name, customer_phone, customer_email,
          starts_at, ends_at, duration_minutes, status, source, notes, customer_locale
        )
        SELECT
          business_id, service_id, customer_name, customer_phone, customer_email,
          starts_at + $2::interval, ends_at + $2::interval, duration_minutes,
          'confirmed', 'rebook', notes, customer_locale
        FROM appointments WHERE id = $1
        RETURNING id, to_char(starts_at, 'YYYY-MM-DD HH24:MI') AS starts_at
      `, [source.id, interval])

      return NextResponse.json({ success: true, appointment: created.rows[0] })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Morning run update error:', error)
    return NextResponse.json({ error: 'Failed to update the morning run' }, { status: 500 })
  }
}
