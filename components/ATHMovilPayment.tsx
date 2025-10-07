'use client'

import React, { useState, useEffect } from 'react'
import { Button, Alert, Spinner, Card, Row, Col } from 'react-bootstrap'

declare global {
  interface Window {
    ATHMPayment?: any;
  }
}

interface ATHMovilPaymentProps {
  amount: number
  description: string
  publicToken: string
  onSuccess: (data: any) => void
  onCancel: () => void
  onExpired: () => void
  onError: (error: string) => void
  disabled?: boolean
  clientName?: string
  appointmentId?: string
}

export default function ATHMovilPayment({
  amount,
  description,
  publicToken,
  onSuccess,
  onCancel,
  onExpired,
  onError,
  disabled = false,
  clientName,
  appointmentId
}: ATHMovilPaymentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadATHMovilScript = () => {
      if (window.ATHMPayment) {
        setScriptLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://www.athmovil.com/api/js/v2/athm.js'
      script.async = true
      script.onload = () => {
        setScriptLoaded(true)
      }
      script.onerror = () => {
        setError('Failed to load ATH Móvil payment system')
      }
      
      document.head.appendChild(script)
    }

    loadATHMovilScript()
  }, [])

  const initiatePayment = async () => {
    if (!scriptLoaded || !window.ATHMPayment) {
      setError('ATH Móvil payment system is not available')
      return
    }

    if (!publicToken) {
      setError('ATH Móvil is not configured. Please contact the business.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const paymentData = {
        publicToken: publicToken,
        timeout: 600,
        theme: 'btn',
        lang: 'en',
        total: amount,
        subtotal: amount,
        tax: 0,
        metadata1: appointmentId || '',
        metadata2: clientName || '',
        items: [
          {
            name: description,
            description: `Deposit for appointment`,
            quantity: 1,
            price: amount,
            tax: 0,
            metadata: ''
          }
        ]
      }

      window.ATHMPayment.pay(paymentData, {
        onCompletedPayment: function(response: any) {
          setIsLoading(false)
          console.log('Payment completed:', response)
          onSuccess(response)
        },
        onCancelledPayment: function(response: any) {
          setIsLoading(false)
          console.log('Payment cancelled:', response)
          onCancel()
        },
        onExpiredPayment: function(response: any) {
          setIsLoading(false)
          console.log('Payment expired:', response)
          onExpired()
        }
      })

    } catch (err: any) {
      setIsLoading(false)
      const errorMessage = err.message || 'Payment initialization failed'
      setError(errorMessage)
      onError(errorMessage)
    }
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
    <div className="ath-movil-payment">
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
                <div className="ath-movil-logo me-3">
                  <div 
                    style={{
                      width: '50px',
                      height: '50px',
                      backgroundColor: '#ff6b35',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    ATH
                  </div>
                </div>
                <div>
                  <h6 className="mb-1">Secure Payment with ATH Móvil</h6>
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
                disabled={disabled || isLoading || !publicToken}
                className="w-100 w-md-auto"
                style={{
                  backgroundColor: '#ff6b35',
                  borderColor: '#ff6b35',
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
                    Pay with ATH Móvil
                  </>
                )}
              </Button>
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
          Secure payment processing by ATH Móvil
        </small>
      </div>
    </div>
  )
}