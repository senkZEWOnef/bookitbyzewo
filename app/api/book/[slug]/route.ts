import { NextRequest, NextResponse } from 'next/server'
import { query } from "@/lib/database"
import { parseISO, addMinutes } from 'date-fns'
import Stripe from 'stripe'


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16'
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  
  try {
    const body = await request.json()
    const { serviceId, staffId, datetime, customerName, customerPhone, customerLocale } = body

    if (!serviceId || !datetime || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get business details
    const businessResult = await query(
      'SELECT * FROM businesses WHERE slug = $1',
      [params.slug]
    )

    if (businessResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const business = businessResult.rows[0]

    // Get service details
    const serviceResult = await query(
      'SELECT * FROM services WHERE id = $1 AND business_id = $2',
      [serviceId, business.id]
    )

    if (serviceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    const service = serviceResult.rows[0]

    // Calculate appointment end time
    const startsAt = parseISO(datetime)
    const endsAt = addMinutes(startsAt, service.duration_min)

    // Check if slot is still available
    let conflictQuery = `
      SELECT id FROM appointments 
      WHERE business_id = $1 
      AND starts_at >= $2 
      AND starts_at <= $3 
      AND status IN ('confirmed', 'pending')
    `
    let conflictParams = [business.id, startsAt.toISOString(), endsAt.toISOString()]
    
    // Add staff filter if staffId exists
    if (staffId) {
      conflictQuery += ' AND staff_id = $4'
      conflictParams.push(staffId)
    } else {
      conflictQuery += ' AND staff_id IS NULL'
    }
    
    const conflictResult = await query(conflictQuery, conflictParams)

    if (conflictResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Time slot is no longer available' },
        { status: 409 }
      )
    }

    // Create appointment
    const appointmentResult = await query(`
      INSERT INTO appointments (
        business_id, service_id, staff_id, starts_at, ends_at,
        customer_name, customer_phone, customer_locale, status, source, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *
    `, [
      business.id,
      serviceId,
      staffId || null,
      startsAt.toISOString(),
      endsAt.toISOString(),
      customerName,
      customerPhone,
      customerLocale || 'es-PR',
      service.deposit_cents > 0 ? 'pending' : 'confirmed',
      'public'
    ])

    if (appointmentResult.rows.length === 0) {
      console.error('Failed to create appointment')
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      )
    }

    const appointment = appointmentResult.rows[0]

    // If deposit required, create Stripe checkout session
    if (service.deposit_cents > 0) {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `Deposit - ${service.name}`,
                  description: `Appointment with ${business.name}`,
                },
                unit_amount: service.deposit_cents,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/book/${params.slug}/confirm?id=${appointment.id}&payment=stripe`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/book/${params.slug}?error=payment_cancelled`,
          metadata: {
            appointment_id: appointment.id,
            business_id: business.id,
            type: 'deposit'
          }
        })

        // Store payment reference
        await query(`
          INSERT INTO payments (
            business_id, provider, external_id, amount_cents, currency, 
            status, kind, meta, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `, [
          business.id,
          'stripe',
          session.id,
          service.deposit_cents,
          'USD',
          'pending',
          'deposit',
          JSON.stringify({ appointment_id: appointment.id })
        ])

        return NextResponse.json({
          appointmentId: appointment.id,
          stripeUrl: session.url,
          requiresPayment: true
        })
      } catch (stripeError) {
        console.error('Stripe error:', stripeError)
        
        // Offer ATH Móvil as fallback
        return NextResponse.json({
          appointmentId: appointment.id,
          athRequired: true,
          depositAmount: service.deposit_cents,
          requiresPayment: true
        })
      }
    }

    // No deposit required, appointment is confirmed
    return NextResponse.json({
      appointmentId: appointment.id,
      requiresPayment: false
    })
    
  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}