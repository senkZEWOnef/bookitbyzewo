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
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, stripe_secret_key, stripe_enabled')
      .eq('slug', businessSlug)
      .single()

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
    await supabase
      .from('payments')
      .insert({
        business_id: business.id,
        provider: 'stripe',
        external_id: session.id,
        amount_cents: amount,
        currency: 'USD',
        status: 'pending',
        kind: 'deposit',
        meta: { 
          appointment_id: appointmentId,
          session_id: session.id,
          client_name: clientName
        }
      })

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