'use client'

import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap'
import { useRouter } from 'next/navigation'

interface PaymentRequiredProps {
  reason: 'trial_expired' | 'payment_failed' | 'no_payment_method'
  businessName?: string
}

export default function PaymentRequired({ reason, businessName }: PaymentRequiredProps) {
  const router = useRouter()

  const getMessage = () => {
    switch (reason) {
      case 'trial_expired':
        return {
          title: 'Trial Period Expired',
          message: 'Your free trial has ended. Please add a payment method to continue using BookIt.',
          action: 'Add Payment Method'
        }
      case 'payment_failed':
        return {
          title: 'Payment Failed',
          message: 'Your last payment failed. Please update your payment information to restore access.',
          action: 'Update Payment'
        }
      case 'no_payment_method':
        return {
          title: 'Payment Method Required',
          message: 'A payment method is required to continue. Please add your payment information.',
          action: 'Add Payment Method'
        }
      default:
        return {
          title: 'Payment Required',
          message: 'Please complete your payment setup to continue.',
          action: 'Setup Payment'
        }
    }
  }

  const { title, message, action } = getMessage()

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="text-center shadow">
            <Card.Body className="p-5">
              <div className="mb-4">
                <i className="fas fa-credit-card fa-4x text-warning"></i>
              </div>
              
              <h3 className="text-danger mb-3">{title}</h3>
              
              <p className="text-muted mb-4">{message}</p>
              
              {businessName && (
                <Alert variant="info">
                  <strong>Business:</strong> {businessName}
                </Alert>
              )}
              
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => router.push('/dashboard/billing')}
                >
                  <i className="fas fa-credit-card me-2"></i>
                  {action}
                </Button>
                
                <Button 
                  variant="outline-secondary"
                  onClick={() => router.push('/dashboard')}
                >
                  Return to Dashboard
                </Button>
              </div>
              
              <div className="mt-4 pt-4 border-top">
                <small className="text-muted">
                  Need help? Contact support at{' '}
                  <a href="mailto:support@bookitbyzewo.com">support@bookitbyzewo.com</a>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}