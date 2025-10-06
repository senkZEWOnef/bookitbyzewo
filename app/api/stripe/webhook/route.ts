import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16'
})


const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
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
        const { error: paymentError } = await supabase
          .from('payments')
          .update({
            status: 'succeeded',
            meta: { 
              stripe_session_id: session.id,
              payment_intent_id: session.payment_intent 
            }
          })
          .eq('external_id', session.id)

        if (paymentError) {
          console.error('Failed to update payment:', paymentError)
          break
        }

        // Update appointment status to confirmed
        const { error: appointmentError } = await supabase
          .from('appointments')
          .update({ 
            status: 'confirmed',
            deposit_payment_id: session.id
          })
          .eq('id', appointmentId)

        if (appointmentError) {
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
          await supabase
            .from('payments')
            .update({ status: 'failed' })
            .eq('external_id', session.id)

          await supabase
            .from('appointments')
            .update({ status: 'canceled' })
            .eq('id', appointmentId)

          console.log('Payment expired for appointment:', appointmentId)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Find the related payment and appointment
        const { data: payment } = await supabase
          .from('payments')
          .select('meta')
          .eq('external_id', paymentIntent.id)
          .single()

        if (payment?.meta?.appointment_id) {
          await supabase
            .from('payments')
            .update({ status: 'failed' })
            .eq('external_id', paymentIntent.id)

          await supabase
            .from('appointments')
            .update({ status: 'canceled' })
            .eq('id', payment.meta.appointment_id)

          console.log('Payment failed for appointment:', payment.meta.appointment_id)
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