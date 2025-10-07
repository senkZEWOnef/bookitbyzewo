import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

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
        await handleSuccessfulPayment(session, supabase)
        break
        
      case 'payment_intent.payment_failed':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handleFailedPayment(paymentIntent, supabase)
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

async function handleSuccessfulPayment(session: Stripe.Checkout.Session, supabase: any) {
  const appointmentId = session.metadata?.appointment_id
  const businessId = session.metadata?.business_id

  if (!appointmentId || !businessId) {
    console.error('Missing metadata in Stripe session')
    return
  }

  try {
    // Update payment record
    await supabase
      .from('payments')
      .update({ status: 'completed' })
      .eq('external_id', session.id)
      .eq('provider', 'stripe')

    // Update appointment status
    await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', appointmentId)

    console.log(`Payment completed for appointment ${appointmentId}`)
  } catch (error) {
    console.error('Error updating payment status:', error)
  }
}

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  const appointmentId = paymentIntent.metadata?.appointment_id

  if (!appointmentId) {
    console.error('Missing appointment_id in payment intent metadata')
    return
  }

  try {
    // Update payment record
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('external_id', paymentIntent.id)
      .eq('provider', 'stripe')

    console.log(`Payment failed for appointment ${appointmentId}`)
  } catch (error) {
    console.error('Error updating failed payment status:', error)
  }
}