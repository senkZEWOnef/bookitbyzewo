'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const plans = [
  {
    id: 'trial',
    name: 'Free Trial',
    price: '$0',
    period: '30 days',
    description: 'Try all features for 30 days',
    gradient: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
    features: [
      '30-day free trial',
      '1 staff member',
      '1 business location', 
      'Up to 500 bookings/month',
      'WhatsApp integration',
      'Payment processing',
      'Bilingual support'
    ],
    cta: 'Start Free Trial',
    popular: false,
    trialOnly: true
  },
  {
    id: 'solo',
    name: 'Solo Plan',
    price: '$19',
    period: '/mo',
    description: 'Perfect for individual service providers',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    features: [
      '1 staff member',
      '1 business location',
      'Up to 500 bookings/month',
      'WhatsApp integration',
      'Payment processing',
      'Bilingual support',
      'Basic calendar sync',
      'Email support'
    ],
    cta: 'Choose Solo',
    popular: false
  },
  {
    id: 'team',
    name: 'Team Plan',
    price: '$39',
    period: '/mo',
    description: 'For growing teams and multiple staff',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    features: [
      'Up to 5 staff members',
      'Multiple locations',
      'Up to 2,000 bookings/month',
      'Advanced scheduling',
      'Advanced calendar sync',
      'Customer management',
      'Basic reports',
      'Priority support'
    ],
    cta: 'Choose Team',
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: '$79',
    period: '/mo',
    description: 'For established businesses',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    features: [
      'Up to 10 staff members',
      'Unlimited bookings',
      'Automated WhatsApp',
      'Custom domains',
      'Advanced reports',
      'API access',
      'Integrations',
      'Phone + email support'
    ],
    cta: 'Choose Pro',
    popular: false
  }
]

export default function ChoosePlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingUser, setPendingUser] = useState<any>(null)

  useEffect(() => {
    // Check if user just signed up
    console.log('🔍 Checking for pendingUser in localStorage...')
    const userString = localStorage.getItem('pendingUser')
    console.log('📦 pendingUser data:', userString)
    
    if (userString) {
      try {
        const userData = JSON.parse(userString)
        console.log('✅ Found pendingUser:', userData)
        setPendingUser(userData)
      } catch (error) {
        console.error('❌ Error parsing pendingUser data:', error)
        router.push('/signup')
      }
    } else {
      console.log('❌ No pendingUser found, redirecting to signup')
      // If no pending user, redirect to signup
      router.push('/signup')
    }
  }, [])

  const handlePlanSelection = async (planId: string) => {
    if (!pendingUser) {
      setError('No user data found. Please sign up again.')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (planId === 'trial') {
        // Activate free trial
        const response = await fetch('/api/auth/activate-trial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: pendingUser.id
          })
        })

        const result = await response.json()

        if (response.ok) {
          // Store user data and redirect to onboarding
          localStorage.setItem('user', JSON.stringify({
            ...pendingUser,
            plan_status: 'trial'
          }))
          localStorage.removeItem('pendingUser')
          router.push('/dashboard/onboarding')
        } else {
          setError(result.error || 'Failed to activate trial')
        }
      } else {
        // Redirect to payment for paid plans
        localStorage.setItem('selectedPlan', planId)
        router.push(`/payment?plan=${planId}&userId=${pendingUser.id}`)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!pendingUser) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container fluid className="py-5">
      <Row className="justify-content-center">
        <Col xl={11} lg={12}>
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold mb-3">
              Welcome, {pendingUser.full_name}! 👋
            </h1>
            <p className="lead text-muted mb-4">
              Your account has been created. Choose your plan to get started with BookIt by Zewo.
            </p>
            {error && <Alert variant="danger">{error}</Alert>}
          </div>

          <Row className="g-4 justify-content-center">
            {plans.map((plan, index) => (
              <Col xl={3} lg={4} md={6} key={plan.id}>
                <Card className={`h-100 border-0 position-relative overflow-hidden ${plan.popular ? 'shadow-xl' : 'shadow-lg'}`} 
                      style={{ transform: plan.popular ? 'scale(1.05)' : 'scale(1)' }}>
                  {plan.popular && (
                    <div className="position-absolute top-0 start-0 w-100 text-center">
                      <Badge 
                        className="px-3 py-2 rounded-bottom-pill fw-semibold"
                        style={{ background: plan.gradient, border: 'none', zIndex: 10 }}
                      >
                        <i className="fas fa-crown me-1"></i>
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <div 
                    className="text-center py-4 text-white position-relative"
                    style={{ background: plan.gradient, marginTop: plan.popular ? '20px' : '0' }}
                  >
                    <h4 className="fw-bold mb-2">{plan.name}</h4>
                    <div className="d-flex align-items-end justify-content-center mb-2">
                      <span className="display-5 fw-bold">{plan.price}</span>
                      <span className="fs-6 opacity-75">{plan.period}</span>
                    </div>
                    <p className="opacity-90 mb-0 small">{plan.description}</p>
                  </div>
                  
                  <Card.Body className="p-4 d-flex flex-column">
                    <ul className="list-unstyled flex-grow-1 mb-4">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="mb-2 d-flex align-items-start">
                          <i className="fas fa-check text-success me-2 mt-1 flex-shrink-0"></i>
                          <span className="small">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      size="lg" 
                      className="w-100 fw-semibold py-2"
                      style={{ 
                        background: plan.gradient, 
                        border: 'none',
                        color: 'white'
                      }}
                      disabled={loading}
                      onClick={() => handlePlanSelection(plan.id)}
                    >
                      {loading ? (
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      ) : (
                        <i className={`fas ${plan.trialOnly ? 'fa-play' : 'fa-rocket'} me-2`}></i>
                      )}
                      {plan.cta}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <div className="text-center mt-5">
            <p className="text-muted">
              <i className="fas fa-shield-alt me-2"></i>
              All plans include our 30-day money-back guarantee
            </p>
            <p className="small text-muted">
              Have questions? <Link href="/contact">Contact our support team</Link>
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  )
}