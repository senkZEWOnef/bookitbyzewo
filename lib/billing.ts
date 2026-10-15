import Stripe from 'stripe'
import { query } from './db'
import { PLAN_NAMES } from './plans'

export const BILLING_PLANS = ['solo', 'pro'] as const
export type BillingPlan = (typeof BILLING_PLANS)[number]

// Monthly prices in cents: Starter $29.99, Pro $59.99
export const PLAN_PRICE_CENTS: Record<BillingPlan, number> = { solo: 2999, pro: 5999 }

export class BillingConfigError extends Error {}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new BillingConfigError('STRIPE_SECRET_KEY is not configured')
  return new Stripe(key, { apiVersion: '2023-08-16' })
}

export function isBillingPlan(value: unknown): value is BillingPlan {
  return typeof value === 'string' && (BILLING_PLANS as readonly string[]).includes(value)
}

// Uses a pre-created Stripe Price when STRIPE_PRICE_STARTER / STRIPE_PRICE_PRO is set;
// otherwise describes the price inline so nothing has to be created in the Stripe dashboard first.
export function subscriptionLineItem(plan: BillingPlan): Stripe.Checkout.SessionCreateParams.LineItem {
  const priceId = plan === 'solo' ? process.env.STRIPE_PRICE_STARTER : process.env.STRIPE_PRICE_PRO
  if (priceId) return { price: priceId, quantity: 1 }
  return {
    quantity: 1,
    price_data: {
      currency: 'usd',
      unit_amount: PLAN_PRICE_CENTS[plan],
      recurring: { interval: 'month' },
      product_data: { name: `BookIt ${PLAN_NAMES[plan]} plan` }
    }
  }
}

export function appOrigin(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
}

export async function ensureBillingColumns() {
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)')
}

function mapStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active': return 'active'
    case 'trialing': return 'trial'
    case 'past_due':
    case 'unpaid': return 'past_due'
    case 'canceled':
    case 'paused': return 'cancelled'
    default: return 'incomplete' // incomplete, incomplete_expired
  }
}

// Mirrors a Stripe subscription onto the user's account. Safe to run repeatedly for the same state.
export async function applySubscription(subscription: Stripe.Subscription): Promise<boolean> {
  await ensureBillingColumns()
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
  const metaUserId = subscription.metadata?.user_id

  const found = metaUserId
    ? await query('SELECT id FROM users WHERE id = $1', [metaUserId])
    : await query('SELECT id FROM users WHERE stripe_customer_id = $1', [customerId])
  if (found.rows.length === 0) {
    console.error('Billing webhook: no user for subscription', subscription.id)
    return false
  }

  const metaPlan = subscription.metadata?.plan
  const planStatus = mapStatus(subscription.status)
  const trialEnd = subscription.status === 'trialing' && subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null

  await query(
    `UPDATE users
     SET plan = COALESCE($2, plan),
         plan_status = $3::varchar,
         subscription_id = $4,
         stripe_customer_id = $5,
         trial_ends_at = COALESCE($6, trial_ends_at),
         last_payment_at = CASE WHEN $3::varchar = 'active' THEN NOW() ELSE last_payment_at END,
         updated_at = NOW()
     WHERE id = $1`,
    [found.rows[0].id, isBillingPlan(metaPlan) ? metaPlan : null, planStatus, subscription.id, customerId, trialEnd]
  )
  return true
}
