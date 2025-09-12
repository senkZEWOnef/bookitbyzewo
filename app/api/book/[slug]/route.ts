import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    const body = await request.json()
    const { serviceId, staffId, datetime, customerName, customerPhone, customerLocale } = body

    if (!serviceId || !datetime || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get business and service details
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', params.slug)
      .single()

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const { data: service } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('business_id', business.id)
      .single()

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Calculate appointment end time
    const startsAt = parseISO(datetime)
    const endsAt = addMinutes(startsAt, service.duration_min)

    // Check if slot is still available
    let query = supabase
      .from('appointments')
      .select('id')
      .eq('business_id', business.id)
      .gte('starts_at', startsAt.toISOString())
      .lte('starts_at', endsAt.toISOString())
      .in('status', ['confirmed', 'pending'])
    
    // Add staff filter if staffId exists
    if (staffId) {
      query = query.eq('staff_id', staffId)
    } else {
      query = query.is('staff_id', null)
    }
    
    const { data: conflictingAppointments } = await query

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      return NextResponse.json(
        { error: 'Time slot is no longer available' },
        { status: 409 }
      )
    }

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        business_id: business.id,
        service_id: serviceId,
        staff_id: staffId || null,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_locale: customerLocale || 'es-PR',
        status: service.deposit_cents > 0 ? 'pending' : 'confirmed',
        source: 'public'
      })
      .select()
      .single()

    if (appointmentError) {
      console.error('Appointment creation error:', appointmentError)
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      )
    }

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
        await supabase
          .from('payments')
          .insert({
            business_id: business.id,
            provider: 'stripe',
            external_id: session.id,
            amount_cents: service.deposit_cents,
            currency: 'USD',
            status: 'pending',
            kind: 'deposit',
            meta: { appointment_id: appointment.id }
          })

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