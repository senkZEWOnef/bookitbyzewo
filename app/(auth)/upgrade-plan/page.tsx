'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
    cta: 'Activate Free Trial',
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

export default function UpgradePlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const userString = localStorage.getItem('user')
    if (userString) {
      setCurrentUser(JSON.parse(userString))
    } else {
      router.push('/login')
    }
  }, [])

  const handlePlanSelection = async (planId: string) => {
    if (!currentUser) {
      setError('No user data found. Please log in again.')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (planId === 'trial') {
        if (currentUser.plan_status === 'trial') {
          setError('You have already used your free trial. Please choose a paid plan.')
          setLoading(false)
          return
        }

        const response = await fetch('/api/auth/activate-trial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id })
        })

        const result = await response.json()

        if (response.ok) {
          const updatedUser = {
            ...currentUser,
            plan_status: 'trial',
            trial_ends_at: result.user.trial_ends_at
          }
          localStorage.setItem('user', JSON.stringify(updatedUser))
          router.push('/dashboard')
        } else {
          setError(result.error || 'Failed to activate trial')
        }
      } else {
        router.push(`/payment?plan=${planId}&userId=${currentUser.id}&upgrade=true`)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-bottom">
        <Container>
          <div className="d-flex justify-content-between align-items-center py-3">
            <div className="d-flex align-items-center">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{ 
                  width: '40px', 
                  height: '40px',
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                }}
              >
                <i className="fab fa-whatsapp fs-5 text-white"></i>
              </div>
              <div>
                <h5 className="mb-0 fw-bold text-success">BookIt by Zewo</h5>
              </div>
            </div>
            <div>
              <Link href="/dashboard" className="btn btn-outline-secondary">
                <i className="fas fa-arrow-left me-2"></i>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* Content */}
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={10}>
            <div className="text-center mb-5">
              <h1 className="display-5 fw-bold mb-3">
                Upgrade Your Plan
              </h1>
              <p className="lead text-muted mb-2">
                Hello {currentUser.full_name || currentUser.email?.split('@')[0]}! 
                Choose a plan to continue using BookIt by Zewo.
              </p>
              <p className="text-muted mb-4">
                Current Plan: <Badge bg="warning">{currentUser.plan || 'Solo'} - {currentUser.plan_status || 'Incomplete'}</Badge>
              </p>
              {error && <Alert variant="danger">{error}</Alert>}
            </div>

            <div className="row g-4 justify-content-center">
              {/* Free Trial */}
              <div className="col-lg-4 col-md-6">
                <div className="card border border-secondary h-100">
                  <div className="card-header bg-secondary text-white text-center py-3">
                    <h5 className="card-title mb-0">Free Trial</h5>
                    <h2 className="mb-0">$0 <small className="text-white-50">/ 30 days</small></h2>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <ul className="list-unstyled mb-4">
                      <li className="mb-2"><i className="fas fa-check text-success me-2"></i>30-day free trial</li>
                      <li className="mb-2"><i className="fas fa-check text-success me-2"></i>1 staff member</li>
                      <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Up to 500 bookings/month</li>
                      <li className="mb-2"><i className="fas fa-check text-success me-2"></i>WhatsApp integration</li>
                    </ul>
                    <button 
                      className="btn btn-outline-secondary btn-lg mt-auto w-100"
                      disabled={loading || currentUser.plan_status === 'trial'}
                      onClick={() => handlePlanSelection('trial')}
                    >
                      {currentUser.plan_status === 'trial' ? 'Trial Already Used' : 'Start Free Trial'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Solo Plan */}
              <div className="col-lg-4 col-md-6">
                <div className="card border border-primary h-100">
                  <div className="card-header bg-primary text-white text-center py-3">
                    <h5 className="card-title mb-0">Solo Plan</h5>
                    <h2 className="mb-0">$19 <small className="text-white-50">/ month</small></h2>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <ul className="list-unstyled mb-4">
                      <li className="mb-2"><i className="fas fa-check text-success me-2"></i>1 staff member</li>
                      <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Up to 500 bookings/month</li>
                      <li className="mb-2"><i className="fas fa-check text-success me-2"></i>WhatsApp integration</li>
                      <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Email support</li>
                    </ul>
                    <button 
                      className="btn btn-primary btn-lg mt-auto w-100"
                      disabled={loading}
                      onClick={() => handlePlanSelection('solo')}
                    >
                      {loading ? 'Loading...' : 'Choose Solo'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Team Plan */}
              <div className="col-lg-4 col-md-6">
                <div className="card border border-success h-100 position-relative">
                  <div className="position-absolute top-0 start-50 translate-middle">
                    <span className="badge bg-success px-3 py-2">
                      <i className="fas fa-star me-1"></i>Most Popular
                    </span>
                  </div>
                  <div className="card-header bg-success text-white text-center py-3" style={{ marginTop: '15px' }}>
                    <h5 className="card-title mb-0">Team Plan</h5>
                    <h2 className="mb-0">$39 <small className="text-white-50">/ month</small></h2>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <ul className="list-unstyled mb-4">
                      <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Up to 5 staff members</li>
                      <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Up to 2,000 bookings/month</li>
                      <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Advanced scheduling</li>
                      <li className="mb-2"><i className="fas fa-check text-success me-2"></i>Priority support</li>
                    </ul>
                    <button 
                      className="btn btn-success btn-lg mt-auto w-100"
                      disabled={loading}
                      onClick={() => handlePlanSelection('team')}
                    >
                      {loading ? 'Loading...' : 'Choose Team'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

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
    </div>
  )
}