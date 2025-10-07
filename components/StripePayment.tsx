'use client'

import React, { useState, useEffect } from 'react'
import { Button, Alert, Spinner, Card, Row, Col } from 'react-bootstrap'

declare global {
  interface Window {
    Stripe?: any;
  }
}

interface StripePaymentProps {
  amount: number
  description: string
  publishableKey: string
  onSuccess: (data: any) => void
  onCancel: () => void
  onError: (error: string) => void
  disabled?: boolean
  clientName?: string
  appointmentId?: string
  businessSlug: string
}

export default function StripePayment({
  amount,
  description,
  publishableKey,
  onSuccess,
  onCancel,
  onError,
  disabled = false,
  clientName,
  appointmentId,
  businessSlug
}: StripePaymentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStripeScript = () => {
      if (window.Stripe) {
        setScriptLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://js.stripe.com/v3/'
      script.async = true
      script.onload = () => {
        setScriptLoaded(true)
      }
      script.onerror = () => {
        setError('Failed to load Stripe payment system')
      }
      
      document.head.appendChild(script)
    }

    loadStripeScript()
  }, [])

  const initiatePayment = async () => {
    if (!scriptLoaded || !window.Stripe) {
      setError('Stripe payment system is not available')
      return
    }

    if (!publishableKey) {
      setError('Stripe is not configured. Please contact the business.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create checkout session via our API
      const response = await fetch(`/api/payments/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          description,
          clientName,
          appointmentId,
          businessSlug,
          successUrl: `${window.location.origin}/book/${businessSlug}/confirm?id=${appointmentId}&payment=stripe`,
          cancelUrl: `${window.location.origin}/book/${businessSlug}?error=payment_cancelled`
        })
      })

      const { sessionId, error: apiError } = await response.json()

      if (!response.ok || apiError) {
        throw new Error(apiError || 'Failed to create payment session')
      }

      // Initialize Stripe and redirect to checkout
      const stripe = window.Stripe(publishableKey)
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

    } catch (err: any) {
      setIsLoading(false)
      const errorMessage = err.message || 'Payment initialization failed'
      setError(errorMessage)
      onError(errorMessage)
    }
  }

  const handleCancel = () => {
    setIsLoading(false)
    onCancel()
  }

  if (!scriptLoaded) {
    return (
      <Card className="p-3">
        <div className="d-flex align-items-center">
          <Spinner animation="border" size="sm" className="me-2" />
          <span>Loading payment system...</span>
        </div>
      </Card>
    )
  }

  return (
    <div className="stripe-payment">
      {error && (
        <Alert variant="danger" className="mb-3">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col xs={12} md={8}>
              <div className="d-flex align-items-center mb-3 mb-md-0">
                <div className="stripe-logo me-3">
                  <div 
                    style={{
                      width: '50px',
                      height: '50px',
                      backgroundColor: '#635BFF',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}
                  >
                    <i className="fas fa-credit-card"></i>
                  </div>
                </div>
                <div>
                  <h6 className="mb-1">Secure Payment with Credit/Debit Card</h6>
                  <small className="text-muted">
                    Amount: <strong>${amount.toFixed(2)}</strong>
                  </small>
                </div>
              </div>
            </Col>
            <Col xs={12} md={4} className="text-md-end">
              <Button
                variant="primary"
                onClick={initiatePayment}
                disabled={disabled || isLoading || !publishableKey}
                className="w-100 w-md-auto me-2"
                style={{
                  backgroundColor: '#635BFF',
                  borderColor: '#635BFF',
                  minHeight: '44px'
                }}
              >
                {isLoading ? (
                  <>
                    <Spinner 
                      as="span" 
                      animation="border" 
                      size="sm" 
                      className="me-2" 
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-credit-card me-2"></i>
                    Pay with Card
                  </>
                )}
              </Button>
              {!isLoading && (
                <Button
                  variant="outline-secondary"
                  onClick={handleCancel}
                  disabled={disabled}
                  className="w-100 w-md-auto mt-2 mt-md-0"
                  style={{ minHeight: '44px' }}
                >
                  Cancel
                </Button>
              )}
            </Col>
          </Row>

          {description && (
            <div className="mt-3 pt-3 border-top">
              <small className="text-muted">{description}</small>
            </div>
          )}
        </Card.Body>
      </Card>

      <div className="mt-2">
        <small className="text-muted d-flex align-items-center">
          <i className="fas fa-shield-alt me-1"></i>
          Secure payment processing by Stripe
        </small>
      </div>
    </div>
  )
}