import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16'
})


const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const appointmentId = session.metadata?.appointment_id
        const businessId = session.metadata?.business_id

        if (!appointmentId || !businessId) {
          console.error('Missing metadata in webhook:', session.metadata)
          break
        }

        // Update payment status
        try {
          await query(
            'UPDATE payments SET status = $1, meta = $2 WHERE external_id = $3',
            [
              'succeeded',
              JSON.stringify({
                stripe_session_id: session.id,
                payment_intent_id: session.payment_intent
              }),
              session.id
            ]
          )
        } catch (paymentError) {
          console.error('Failed to update payment:', paymentError)
          break
        }


        // Update appointment status to confirmed
        try {
          await query(
            'UPDATE appointments SET status = $1, deposit_payment_id = $2 WHERE id = $3',
            ['confirmed', session.id, appointmentId]
          )
        } catch (appointmentError) {
          console.error('Failed to update appointment:', appointmentError)
          break
        }


        console.log('Payment confirmed for appointment:', appointmentId)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const appointmentId = session.metadata?.appointment_id

        if (appointmentId) {
          // Mark payment as failed and appointment as canceled
          try {
            await query(
              'UPDATE payments SET status = $1 WHERE external_id = $2',
              ['failed', session.id]
            )

            await query(
              'UPDATE appointments SET status = $1 WHERE id = $2',
              ['canceled', appointmentId]
            )
          } catch (error) {
            console.error('Failed to update payment/appointment on expiry:', error)
          }

          console.log('Payment expired for appointment:', appointmentId)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Find the related payment and appointment
        try {
          const paymentResult = await query(
            'SELECT meta FROM payments WHERE external_id = $1',
            [paymentIntent.id]
          )
          const payment = paymentResult.rows[0]

          if (payment?.meta?.appointment_id) {
            await query(
              'UPDATE payments SET status = $1 WHERE external_id = $2',
              ['failed', paymentIntent.id]
            )

            await query(
              'UPDATE appointments SET status = $1 WHERE id = $2',
              ['canceled', payment.meta.appointment_id]
            )

            console.log('Payment failed for appointment:', payment.meta.appointment_id)
          }
        } catch (error) {
          console.error('Failed to handle payment failure:', error)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}