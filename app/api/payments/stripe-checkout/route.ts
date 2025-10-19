import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {

  try {
    const body = await request.json()
    const { 
      amount, 
      description, 
      clientName, 
      appointmentId, 
      businessSlug,
      successUrl,
      cancelUrl 
    } = body

    if (!amount || !appointmentId || !businessSlug) {
      return NextResponse.json(
        { error: 'Missing required payment data' },
        { status: 400 }
      )
    }

    // Get business to retrieve Stripe credentials
    const businessResult = await query(
      'SELECT id, name, stripe_secret_key, stripe_enabled FROM businesses WHERE slug = $1',
      [businessSlug]
    )
    const business = businessResult.rows[0]

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    if (!business.stripe_enabled || !business.stripe_secret_key) {
      return NextResponse.json(
        { error: 'Stripe payments not configured for this business' },
        { status: 400 }
      )
    }

    // Initialize Stripe with business credentials
    const stripe = new Stripe(business.stripe_secret_key, {
      apiVersion: '2023-08-16'
    })

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: description || 'Appointment Deposit',
              description: `Deposit for appointment with ${business.name}`,
            },
            unit_amount: amount, // Already in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        appointment_id: appointmentId,
        business_id: business.id,
        client_name: clientName || '',
        type: 'deposit'
      },
      customer_email: undefined, // We don't collect email in booking flow
      billing_address_collection: 'auto',
      payment_intent_data: {
        metadata: {
          appointment_id: appointmentId,
          business_id: business.id,
          type: 'deposit'
        }
      }
    })

    // Store payment reference
    await query(
      'INSERT INTO payments (business_id, provider, external_id, amount_cents, currency, status, kind, meta) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        business.id,
        'stripe',
        session.id,
        amount,
        'USD',
        'pending',
        'deposit',
        JSON.stringify({
          appointment_id: appointmentId,
          session_id: session.id,
          client_name: clientName
        })
      ]
    )

    return NextResponse.json({
      sessionId: session.id
    })

  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment session' },
      { status: 500 }
    )
  }
}