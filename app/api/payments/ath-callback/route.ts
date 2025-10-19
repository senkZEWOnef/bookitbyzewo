import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {

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
    const appointmentResult = await query(`
      SELECT a.*, b.id as business_id, b.name as business_name
      FROM appointments a
      JOIN businesses b ON a.business_id = b.id
      WHERE a.id = $1
    `, [appointmentId])
    const appointment = appointmentResult.rows[0]

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Update or create payment record
    const existingPaymentResult = await query(
      'SELECT id FROM payments WHERE external_id = $1 AND provider = $2',
      [referenceNumber, 'ath_movil']
    )
    const existingPayment = existingPaymentResult.rows[0]

    const paymentStatus = status === 'completed' ? 'completed' : 'failed'

    if (existingPayment) {
      // Update existing payment
      await query(
        'UPDATE payments SET status = $1, meta = $2 WHERE id = $3',
        [
          paymentStatus,
          JSON.stringify({
            appointment_id: appointmentId,
            ath_payment_data: paymentData,
            updated_at: new Date().toISOString()
          }),
          existingPayment.id
        ]
      )
    } else {
      // Create new payment record
      await query(
        'INSERT INTO payments (business_id, provider, external_id, amount_cents, currency, status, kind, meta) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          appointment.business_id,
          'ath_movil',
          referenceNumber,
          Math.round(amount * 100),
          'USD',
          paymentStatus,
          'deposit',
          JSON.stringify({
            appointment_id: appointmentId,
            ath_payment_data: paymentData
          })
        ]
      )
    }

    // Update appointment status if payment completed
    if (status === 'completed') {
      await query(
        'UPDATE appointments SET status = $1 WHERE id = $2',
        ['confirmed', appointmentId]
      )
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
    let paymentQuery: string
    let queryParams: any[]

    if (referenceNumber) {
      paymentQuery = `
        SELECT p.*, a.id as appointment_id, a.status as appointment_status, a.customer_name
        FROM payments p
        LEFT JOIN appointments a ON (p.meta->>'appointment_id')::uuid = a.id
        WHERE p.external_id = $1 AND p.provider = $2
      `
      queryParams = [referenceNumber, 'ath_movil']
    } else {
      paymentQuery = `
        SELECT p.*, a.id as appointment_id, a.status as appointment_status, a.customer_name
        FROM payments p
        LEFT JOIN appointments a ON (p.meta->>'appointment_id')::uuid = a.id
        WHERE (p.meta->>'appointment_id')::uuid = $1 AND p.provider = $2
      `
      queryParams = [appointmentId, 'ath_movil']
    }

    const paymentResult = await query(paymentQuery, queryParams)
    const payment = paymentResult.rows[0]

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
        appointmentStatus: payment.appointment_status,
        customerName: payment.customer_name
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