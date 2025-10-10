'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Row, Col, Card, Form, Button, Alert, ProgressBar } from 'react-bootstrap'

interface BusinessData {
  name: string
  slug: string
  location: string
  timezone: string
  businessType: string
}

const businessTypes = [
  { value: 'barber', label: 'Barber / Hair Salon', icon: 'fas fa-cut' },
  { value: 'beauty', label: 'Beauty / Nails / Lashes', icon: 'fas fa-palette' },
  { value: 'cleaning', label: 'Cleaning Service', icon: 'fas fa-broom' },
  { value: 'handyman', label: 'Handyman / Repairs', icon: 'fas fa-tools' },
  { value: 'tutor', label: 'Tutoring / Coaching', icon: 'fas fa-graduation-cap' },
  { value: 'health', label: 'Health / Wellness', icon: 'fas fa-heart' },
  { value: 'other', label: 'Other Service', icon: 'fas fa-briefcase' }
]

const timezones = [
  { value: 'America/Puerto_Rico', label: 'Puerto Rico (AST)' },
  { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
  { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
  { value: 'America/Denver', label: 'Mountain Time (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' }
]

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function OnboardingPage() {
  console.log('🟡 ONBOARDING: OnboardingPage component rendering')
  
  const [step, setStep] = useState(1)
  const [businessData, setBusinessData] = useState<BusinessData>({
    name: '',
    slug: '',
    location: '',
    timezone: 'America/Puerto_Rico',
    businessType: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasExistingBusiness, setHasExistingBusiness] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const router = useRouter()

  // Check if user already has a business on component mount
  useEffect(() => {
    console.log('🟡 ONBOARDING: Checking if user already has a business...')
    
    const checkExistingBusiness = async () => {
      try {
        const userString = localStorage.getItem('user')
        if (!userString) return

        const user = JSON.parse(userString)

        // Check user's plan (for now, assume everyone is on free plan unless they have pro metadata)
        const userIsPro = user.user_metadata?.plan === 'pro' || user.user_metadata?.subscription === 'pro'
        setIsPro(userIsPro)
        console.log('🟡 ONBOARDING: User plan check - isPro:', userIsPro)
        
        // TODO: Check for existing business with Neon database
        // For now, assume no existing business
        setHasExistingBusiness(false)
        
        console.log('🟡 ONBOARDING: No existing business found, staying on onboarding')
      } catch (err) {
        console.error('🟡 ONBOARDING: Error checking existing business:', err)
      }
    }
    
    checkExistingBusiness()
  }, [])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (name: string) => {
    setBusinessData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const userString = localStorage.getItem('user')
      if (!userString) throw new Error('Not authenticated')
      
      const user = JSON.parse(userString)

      console.log('Creating business for user:', user.id)
      console.log('Business data:', businessData)

      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: businessData.name,
          slug: businessData.slug,
          location: businessData.location,
          timezone: businessData.timezone,
          businessType: businessData.businessType,
          userId: user.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create business')
      }
      
      console.log('Business setup completed successfully! Redirecting to dashboard...')
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  const getStarterServices = (businessType: string) => {
    switch (businessType) {
      case 'barber':
        return [
          { name: 'Haircut', duration_min: 45, price_cents: 3500, deposit_cents: 1000 },
          { name: 'Beard Trim', duration_min: 20, price_cents: 1500, deposit_cents: 500 },
          { name: 'Haircut & Beard', duration_min: 60, price_cents: 4500, deposit_cents: 1500 }
        ]
      case 'beauty':
        return [
          { name: 'Manicure', duration_min: 60, price_cents: 3000, deposit_cents: 1000 },
          { name: 'Pedicure', duration_min: 90, price_cents: 4000, deposit_cents: 1500 },
          { name: 'Gel Nails', duration_min: 120, price_cents: 6000, deposit_cents: 2000 }
        ]
      case 'cleaning':
        return [
          { name: 'House Cleaning (Small)', duration_min: 120, price_cents: 8000, deposit_cents: 2000 },
          { name: 'House Cleaning (Large)', duration_min: 240, price_cents: 15000, deposit_cents: 3000 },
          { name: 'Deep Cleaning', duration_min: 300, price_cents: 20000, deposit_cents: 5000 }
        ]
      case 'tutor':
        return [
          { name: '1-on-1 Tutoring', duration_min: 60, price_cents: 5000, deposit_cents: 1000 },
          { name: 'Group Session', duration_min: 90, price_cents: 7500, deposit_cents: 1500 }
        ]
      default:
        return [
          { name: 'Consultation', duration_min: 30, price_cents: 2500, deposit_cents: 500 },
          { name: 'Service', duration_min: 60, price_cents: 5000, deposit_cents: 1000 }
        ]
    }
  }


  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <div className="text-center mb-4">
            <h1 className="h3 fw-bold">Set Up Your Business</h1>
            <p className="text-muted">Let's get your WhatsApp booking system ready</p>
            <ProgressBar now={(step / 3) * 100} className="mb-3" />
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Card>
            <Card.Body className="p-4">
              {/* Step 1: Business Info */}
              {step === 1 && (
                <div>
                  <h5 className="mb-4">Business Information</h5>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Business Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={businessData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., Maria's Hair Salon"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Booking URL</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">bookitbyzewo.com/book/</span>
                      <Form.Control
                        type="text"
                        value={businessData.slug}
                        onChange={(e) => setBusinessData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="your-business-name"
                      />
                    </div>
                    <Form.Text className="text-muted">
                      This will be your public booking link
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Control
                      type="text"
                      value={businessData.location}
                      onChange={(e) => setBusinessData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., 123 Main St, San Juan, PR"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Timezone *</Form.Label>
                    <Form.Select
                      value={businessData.timezone}
                      onChange={(e) => setBusinessData(prev => ({ ...prev, timezone: e.target.value }))}
                      required
                    >
                      {timezones.map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <div className="text-end">
                    <Button 
                      variant="success" 
                      onClick={() => setStep(2)}
                      disabled={!businessData.name || !businessData.slug}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Business Type */}
              {step === 2 && (
                <div>
                  <h5 className="mb-4">What type of business is this?</h5>
                  <p className="text-muted mb-4">
                    We'll create starter services and templates for your business type.
                  </p>
                  
                  <Row>
                    {businessTypes.map(type => (
                      <Col md={6} key={type.value} className="mb-3">
                        <Card 
                          className={`cursor-pointer h-100 ${businessData.businessType === type.value ? 'border-success bg-light' : 'border-light'}`}
                          onClick={() => setBusinessData(prev => ({ ...prev, businessType: type.value }))}
                          style={{ cursor: 'pointer' }}
                        >
                          <Card.Body className="text-center">
                            <i className={`${type.icon} fa-2x text-success mb-2`}></i>
                            <h6>{type.label}</h6>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  <div className="d-flex justify-content-between mt-4">
                    <Button variant="outline-secondary" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button 
                      variant="success" 
                      onClick={() => setStep(3)}
                      disabled={!businessData.businessType}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Create */}
              {step === 3 && (
                <div>
                  <h5 className="mb-4">Review & Create</h5>
                  
                  {/* Warning for free users with existing business */}
                  {hasExistingBusiness && !isPro && (
                    <Alert variant="warning" className="mb-4">
                      <h6>
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Replace Existing Business
                      </h6>
                      <p className="mb-2">
                        You already have a business set up. Creating a new business will <strong>replace</strong> your current one.
                      </p>
                      <p className="mb-0">
                        <small>
                          💰 <strong>Want multiple businesses?</strong> Upgrade to Pro ($79/month) to manage unlimited businesses.
                        </small>
                      </p>
                    </Alert>
                  )}
                  
                  <div className="bg-light p-3 rounded mb-4">
                    <Row className="mb-2">
                      <Col sm={4} className="text-muted">Business:</Col>
                      <Col sm={8}><strong>{businessData.name}</strong></Col>
                    </Row>
                    <Row className="mb-2">
                      <Col sm={4} className="text-muted">Booking URL:</Col>
                      <Col sm={8}>
                        <code>bookitbyzewo.com/book/{businessData.slug}</code>
                      </Col>
                    </Row>
                    <Row className="mb-2">
                      <Col sm={4} className="text-muted">Location:</Col>
                      <Col sm={8}>{businessData.location || 'Not specified'}</Col>
                    </Row>
                    <Row className="mb-2">
                      <Col sm={4} className="text-muted">Type:</Col>
                      <Col sm={8}>
                        {businessTypes.find(t => t.value === businessData.businessType)?.label}
                      </Col>
                    </Row>
                  </div>

                  <Alert variant="info">
                    <h6>What happens next:</h6>
                    <ul className="mb-0">
                      <li>We'll create your business and booking page</li>
                      <li>Add starter services based on your business type</li>
                      <li>Set default availability (Mon-Fri, 9 AM - 5 PM)</li>
                      <li>You can customize everything later in your dashboard</li>
                    </ul>
                  </Alert>

                  <div className="d-flex justify-content-between">
                    <Button variant="outline-secondary" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button 
                      variant="success" 
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create My Business'}
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}