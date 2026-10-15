import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { applySubscription, getStripe, BillingConfigError } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Stripe -> BookIt subscription events. Add this URL as a webhook endpoint in the Stripe dashboard:
//   https://<your-site>/api/billing/webhook
// events: checkout.session.completed, customer.subscription.created|updated|deleted,
//         invoice.paid, invoice.payment_failed
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_BILLING_WEBHOOK_SECRET
  if (!secret) {
    console.error('STRIPE_BILLING_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let stripe: Stripe
  try {
    stripe = getStripe()
  } catch (error) {
    if (error instanceof BillingConfigError) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    throw error
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret)
  } catch (error) {
    console.error('Billing webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // Deposit payments for appointments use the other webhook; only handle plan subscriptions here
        if (session.mode === 'subscription' && session.subscription) {
          const id = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          await applySubscription(await stripe.subscriptions.retrieve(id))
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await applySubscription(event.data.object as Stripe.Subscription)
        break
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const id = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id
          await applySubscription(await stripe.subscriptions.retrieve(id))
        }
        break
      }
      default:
        break
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    // A non-2xx response makes Stripe retry later
    console.error('Billing webhook handler error:', error)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}
