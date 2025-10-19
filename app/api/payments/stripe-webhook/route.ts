import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    // Verify webhook signature
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-08-16'
    })

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        await handleSuccessfulPayment(session)
        break
        
      case 'payment_intent.payment_failed':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handleFailedPayment(paymentIntent)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const appointmentId = session.metadata?.appointment_id
  const businessId = session.metadata?.business_id

  if (!appointmentId || !businessId) {
    console.error('Missing metadata in Stripe session')
    return
  }

  try {
    // Update payment record
    await query(
      `UPDATE payments 
       SET status = 'completed', updated_at = NOW() 
       WHERE external_id = $1 AND provider = 'stripe'`,
      [session.id]
    )

    // Update appointment status
    await query(
      `UPDATE appointments 
       SET status = 'confirmed', updated_at = NOW() 
       WHERE id = $1`,
      [appointmentId]
    )

    console.log(`Payment completed for appointment ${appointmentId}`)
  } catch (error) {
    console.error('Error updating payment status:', error)
  }
}

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  const appointmentId = paymentIntent.metadata?.appointment_id

  if (!appointmentId) {
    console.error('Missing appointment_id in payment intent metadata')
    return
  }

  try {
    // Update payment record
    await query(
      `UPDATE payments 
       SET status = 'failed', updated_at = NOW() 
       WHERE external_id = $1 AND provider = 'stripe'`,
      [paymentIntent.id]
    )

    console.log(`Payment failed for appointment ${appointmentId}`)
  } catch (error) {
    console.error('Error updating failed payment status:', error)
  }
}