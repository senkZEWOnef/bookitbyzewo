import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await request.json()
    const { referenceNumber, status, amount, appointmentId, paymentData } = body

    if (!referenceNumber || !appointmentId) {
      return NextResponse.json(
        { error: 'Missing required payment data' },
        { status: 400 }
      )
    }

    // Find the appointment
    const { data: appointment } = await supabase
      .from('appointments')
      .select('*, businesses(id, name)')
      .eq('id', appointmentId)
      .single()

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Update or create payment record
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('external_id', referenceNumber)
      .eq('provider', 'ath_movil')
      .single()

    const paymentStatus = status === 'completed' ? 'completed' : 'failed'

    if (existingPayment) {
      // Update existing payment
      await supabase
        .from('payments')
        .update({
          status: paymentStatus,
          meta: {
            appointment_id: appointmentId,
            ath_payment_data: paymentData,
            updated_at: new Date().toISOString()
          }
        })
        .eq('id', existingPayment.id)
    } else {
      // Create new payment record
      await supabase
        .from('payments')
        .insert({
          business_id: appointment.businesses.id,
          provider: 'ath_movil',
          external_id: referenceNumber,
          amount_cents: Math.round(amount * 100),
          currency: 'USD',
          status: paymentStatus,
          kind: 'deposit',
          meta: {
            appointment_id: appointmentId,
            ath_payment_data: paymentData
          }
        })
    }

    // Update appointment status if payment completed
    if (status === 'completed') {
      await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointmentId)
    }

    return NextResponse.json({
      success: true,
      appointmentId,
      paymentStatus
    })

  } catch (error) {
    console.error('ATH Móvil callback error:', error)
    return NextResponse.json(
      { error: 'Failed to process payment callback' },
      { status: 500 }
    )
  }
}

// Handle GET requests for payment status checks
export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { searchParams } = new URL(request.url)
  const appointmentId = searchParams.get('appointmentId')
  const referenceNumber = searchParams.get('referenceNumber')

  if (!appointmentId && !referenceNumber) {
    return NextResponse.json(
      { error: 'Missing appointment ID or reference number' },
      { status: 400 }
    )
  }

  try {
    let query = supabase
      .from('payments')
      .select('*, appointments(id, status, customer_name)')

    if (referenceNumber) {
      query = query.eq('external_id', referenceNumber).eq('provider', 'ath_movil')
    } else if (appointmentId) {
      query = query.eq('meta->appointment_id', appointmentId).eq('provider', 'ath_movil')
    }

    const { data: payment } = await query.single()

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount_cents / 100,
        referenceNumber: payment.external_id,
        appointmentId: payment.meta?.appointment_id,
        appointmentStatus: payment.appointments?.status,
        customerName: payment.appointments?.customer_name
      }
    })

  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    )
  }
}