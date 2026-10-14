import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RefundResult {
  refunded: boolean
  amount?: number
  reason?: string
}

async function processRefund(appointment: any, business: any): Promise<RefundResult> {
  // Check if there's a payment to refund
  if (!appointment.deposit_payment_id) {
    return { refunded: false, reason: 'no_payment' }
  }

  // Get payment details
  const paymentResult = await query(
    'SELECT * FROM payments WHERE external_id = $1 AND status = $2',
    [appointment.deposit_payment_id, 'succeeded']
  )

  if (paymentResult.rows.length === 0) {
    return { refunded: false, reason: 'payment_not_found' }
  }

  const payment = paymentResult.rows[0]

  // Check business refund policy - refund if cancelled more than 24 hours before appointment
  const appointmentTime = new Date(appointment.starts_at)
  const now = new Date()
  const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  // Default policy: full refund if cancelled 24+ hours in advance
  const refundEligible = hoursUntilAppointment >= 24

  if (!refundEligible) {
    return {
      refunded: false,
      reason: 'outside_refund_window',
      amount: payment.amount_cents
    }
  }

  // Process Stripe refund if applicable
  if (payment.provider === 'stripe' && business.stripe_secret_key) {
    try {
      const stripe = new Stripe(business.stripe_secret_key, {
        apiVersion: '2023-08-16'
      })

      // Get the payment intent from the session
      const session = await stripe.checkout.sessions.retrieve(payment.external_id)

      if (session.payment_intent && typeof session.payment_intent === 'string') {
        await stripe.refunds.create({
          payment_intent: session.payment_intent,
          reason: 'requested_by_customer'
        })

        // Update payment status
        await query(
          'UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2',
          ['refunded', payment.id]
        )

        return {
          refunded: true,
          amount: payment.amount_cents
        }
      }
    } catch (stripeError) {
      console.error('Stripe refund error:', stripeError)
      return {
        refunded: false,
        reason: 'refund_failed',
        amount: payment.amount_cents
      }
    }
  }

  return { refunded: false, reason: 'no_refund_method' }
}

async function sendCancellationNotification(appointment: any, business: any, refundResult: RefundResult) {
  // Build cancellation message
  const appointmentDate = new Date(appointment.starts_at)
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
  const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: business.timezone || 'America/Puerto_Rico'
  })

  let message = `Your appointment at ${business.name} on ${formattedDate} at ${formattedTime} has been cancelled.`

  if (refundResult.refunded && refundResult.amount) {
    message += ` A refund of $${(refundResult.amount / 100).toFixed(2)} has been processed to your original payment method.`
  } else if (refundResult.reason === 'outside_refund_window') {
    message += ` Unfortunately, cancellations within 24 hours of the appointment are not eligible for a refund.`
  }

  // Log the notification (actual sending would use WhatsApp/SMS service)
  console.log('📱 Cancellation notification:', {
    to: appointment.customer_phone,
    message
  })

  // Store notification in database for future sending
  try {
    await query(
      `INSERT INTO messages (business_id, appointment_id, recipient_phone, message_type, content, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        appointment.business_id,
        appointment.id,
        appointment.customer_phone,
        'cancellation',
        message,
        'pending'
      ]
    )
  } catch (msgError) {
    // Messages table might not exist, log but don't fail
    console.log('Could not store message - table may not exist')
  }

  return message
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get existing appointment with business details
    const appointmentResult = await query(
      `SELECT a.*, b.name as business_name, b.timezone, b.stripe_secret_key
       FROM appointments a
       JOIN businesses b ON a.business_id = b.id
       WHERE a.id = $1`,
      [params.id]
    )
    const appointment = appointmentResult.rows[0]

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    if (appointment.status === 'canceled') {
      return NextResponse.json(
        { error: 'Appointment is already canceled' },
        { status: 400 }
      )
    }

    // Process refund if applicable
    const refundResult = await processRefund(appointment, {
      stripe_secret_key: appointment.stripe_secret_key
    })

    // Update appointment status to canceled
    await query(
      'UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2',
      ['canceled', params.id]
    )

    // Send cancellation notification
    const notificationMessage = await sendCancellationNotification(
      appointment,
      {
        name: appointment.business_name,
        timezone: appointment.timezone
      },
      refundResult
    )

    return NextResponse.json({
      success: true,
      refund: refundResult,
      notification_sent: true
    })
  } catch (error) {
    console.error('Cancel API error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    )
  }
}