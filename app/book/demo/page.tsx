'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Row, Col, Button, Card, Badge, Modal, ProgressBar, Form } from 'react-bootstrap'
import { useLanguage } from '@/lib/language-context'

export const dynamic = 'force-dynamic'

interface DemoStep {
  id: number
  titleKey: string
  descKey: string
  icon: string
  bgColor: string
  component?: string
}

export default function DemoPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [demoData, setDemoData] = useState({
    businessName: '',
    businessType: 'barber',
    plan: 'solo'
  })

  const demoSteps: DemoStep[] = [
    {
      id: 0,
      titleKey: 'demo.welcome.title',
      descKey: 'demo.welcome.desc',
      icon: 'fas fa-play-circle',
      bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 1,
      titleKey: 'demo.plans.title',
      descKey: 'demo.plans.desc',
      icon: 'fas fa-crown',
      bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      component: 'plans'
    },
    {
      id: 2,
      titleKey: 'demo.signup.title',
      descKey: 'demo.signup.desc',
      icon: 'fas fa-user-plus',
      bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      component: 'signup'
    },
    {
      id: 3,
      titleKey: 'demo.business.title',
      descKey: 'demo.business.desc',
      icon: 'fas fa-store',
      bgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      component: 'business'
    },
    {
      id: 4,
      titleKey: 'demo.services.title',
      descKey: 'demo.services.desc',
      icon: 'fas fa-list',
      bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      component: 'services'
    },
    {
      id: 5,
      titleKey: 'demo.staff.title',
      descKey: 'demo.staff.desc',
      icon: 'fas fa-users',
      bgColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      component: 'staff'
    },
    {
      id: 6,
      titleKey: 'demo.booking.title',
      descKey: 'demo.booking.desc',
      icon: 'fab fa-whatsapp',
      bgColor: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
      component: 'booking'
    },
    {
      id: 7,
      titleKey: 'demo.complete.title',
      descKey: 'demo.complete.desc',
      icon: 'fas fa-rocket',
      bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  ]

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push('/signup')
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipToSignup = () => {
    router.push('/signup')
  }

  const renderStepContent = () => {
    const step = demoSteps[currentStep]
    
    switch (step.component) {
      case 'plans':
        return <PlansDemo t={t} demoData={demoData} setDemoData={setDemoData} />
      case 'signup':
        return <SignupDemo t={t} language={language} />
      case 'business':
        return <BusinessDemo t={t} demoData={demoData} setDemoData={setDemoData} />
      case 'services':
        return <ServicesDemo t={t} demoData={demoData} />
      case 'staff':
        return <StaffDemo t={t} demoData={demoData} />
      case 'booking':
        return <BookingDemo t={t} demoData={demoData} />
      default:
        return null
    }
  }

  return (
    <>
      <div className="bg-mesh text-white position-relative overflow-hidden" style={{ minHeight: '100vh' }}>
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          background: 'radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)'
        }}></div>
      
        <Container className="position-relative py-5">
          {/* Header */}
          <Row className="mb-4">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <Button 
                    variant="outline-light" 
                    onClick={() => router.push('/')}
                    className="me-3"
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    {t('demo.back')}
                  </Button>
                  <h2 className="text-white mb-0 fw-bold">
                    <i className="fab fa-whatsapp text-success me-2"></i>
                    {t('demo.title')}
                  </h2>
                </div>
                <Button 
                  variant="success" 
                  onClick={skipToSignup}
                  className="px-4"
                >
                  <i className="fas fa-rocket me-2"></i>
                  {t('demo.skip')}
                </Button>
              </div>
            </Col>
          </Row>

          {/* Progress Bar */}
          <Row className="mb-5">
            <Col>
              <ProgressBar 
                now={(currentStep + 1) / demoSteps.length * 100} 
                className="mb-2"
                style={{ height: '8px' }}
              />
              <div className="d-flex justify-content-between text-white-50 small">
                <span>{t('demo.step')} {currentStep + 1} {t('demo.of')} {demoSteps.length}</span>
                <span>{Math.round((currentStep + 1) / demoSteps.length * 100)}% {t('demo.complete')}</span>
              </div>
            </Col>
          </Row>

          {/* Current Step */}
          <Row className="justify-content-center">
            <Col lg={10}>
              <Card 
                className="border-0 shadow-lg"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  minHeight: '500px'
                }}
              >
                <Card.Body className="p-5">
                  {/* Step Header */}
                  <div className="text-center mb-5">
                    <div 
                      className="rounded-circle d-inline-flex align-items-center justify-content-center text-white mb-4"
                      style={{ 
                        width: '100px', 
                        height: '100px',
                        background: demoSteps[currentStep].bgColor,
                        fontSize: '2.5rem'
                      }}
                    >
                      <i className={demoSteps[currentStep].icon}></i>
                    </div>
                    <h3 className="text-white fw-bold mb-3">
                      {t(demoSteps[currentStep].titleKey)}
                    </h3>
                    <p className="text-white-50 lead mb-0">
                      {t(demoSteps[currentStep].descKey)}
                    </p>
                  </div>

                  {/* Step Content */}
                  <div className="mb-5">
                    {renderStepContent()}
                  </div>

                  {/* Navigation */}
                  <div className="d-flex justify-content-between align-items-center">
                    <Button 
                      variant="outline-light" 
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className="px-4"
                    >
                      <i className="fas fa-arrow-left me-2"></i>
                      {t('demo.previous')}
                    </Button>

                    <div className="d-flex gap-2">
                      {demoSteps.map((_, index) => (
                        <div
                          key={index}
                          className={`rounded-circle ${index === currentStep ? 'bg-success' : index < currentStep ? 'bg-success opacity-50' : 'bg-white opacity-25'}`}
                          style={{ width: '12px', height: '12px' }}
                        ></div>
                      ))}
                    </div>

                    <Button 
                      variant="success" 
                      onClick={nextStep}
                      className="px-4"
                    >
                      {currentStep === demoSteps.length - 1 ? (
                        <>
                          <i className="fas fa-rocket me-2"></i>
                          {t('demo.start')}
                        </>
                      ) : (
                        <>
                          {t('demo.next')}
                          <i className="fas fa-arrow-right ms-2"></i>
                        </>
                      )}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}

// Demo Components
function PlansDemo({ t, demoData, setDemoData }: any) {
  const plans = [
    {
      name: 'solo',
      price: 19,
      features: ['demo.plans.solo.staff', 'demo.plans.solo.location', 'demo.plans.solo.whatsapp', 'demo.plans.solo.trial']
    },
    {
      name: 'team', 
      price: 39,
      features: ['demo.plans.team.staff', 'demo.plans.team.locations', 'demo.plans.team.scheduling', 'demo.plans.team.calendar']
    },
    {
      name: 'pro',
      price: 79, 
      features: ['demo.plans.pro.staff', 'demo.plans.pro.automation', 'demo.plans.pro.analytics', 'demo.plans.pro.api']
    }
  ]

  return (
    <Row className="g-4">
      {plans.map((plan, index) => (
        <Col md={4} key={plan.name}>
          <Card 
            className={`h-100 border-0 cursor-pointer ${demoData.plan === plan.name ? 'border-success' : ''}`}
            style={{ 
              background: demoData.plan === plan.name ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: demoData.plan === plan.name ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onClick={() => setDemoData({...demoData, plan: plan.name})}
          >
            <Card.Body className="p-4 text-center">
              {index === 1 && (
                <Badge bg="warning" className="mb-3">{t('demo.plans.popular')}</Badge>
              )}
              <h5 className="text-white fw-bold text-capitalize mb-3">{t(`demo.plans.${plan.name}.name`)}</h5>
              <div className="mb-4">
                <span className="text-success fw-bold" style={{ fontSize: '2rem' }}>${plan.price}</span>
                <span className="text-white-50">/{t('demo.plans.month')}</span>
              </div>
              <ul className="list-unstyled">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="text-white-50 mb-2">
                    <i className="fas fa-check text-success me-2"></i>
                    {t(feature)}
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

function SignupDemo({ t, language }: any) {
  return (
    <Row className="justify-content-center">
      <Col md={6}>
        <Card 
          className="border-0"
          style={{ 
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '16px'
          }}
        >
          <Card.Body className="p-4">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="text-white">{t('demo.signup.name')}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={language === 'es' ? 'María García' : 'Maria Garcia'}
                  value={language === 'es' ? 'María García' : 'Maria Garcia'}
                  readOnly
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    color: '#fff'
                  }}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label className="text-white">{t('demo.signup.email')}</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="maria@hairsalon.com"
                  value="maria@hairsalon.com"
                  readOnly
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    color: '#fff'
                  }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="text-white">{t('demo.signup.phone')}</Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="+1 787 555 0123"
                  value="+1 787 555 0123"
                  readOnly
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    color: '#fff'
                  }}
                />
              </Form.Group>

              <div className="text-center">
                <Badge bg="success" className="px-3 py-2">
                  <i className="fas fa-check me-2"></i>
                  {t('demo.signup.trial')}
                </Badge>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}

function BusinessDemo({ t, demoData, setDemoData }: any) {
  const businessTypes = [
    { value: 'barber', icon: 'fas fa-cut', label: t('demo.business.types.barber') },
    { value: 'beauty', icon: 'fas fa-palette', label: t('demo.business.types.beauty') },
    { value: 'cleaning', icon: 'fas fa-broom', label: t('demo.business.types.cleaning') },
    { value: 'tutor', icon: 'fas fa-graduation-cap', label: t('demo.business.types.tutor') }
  ]

  return (
    <Row>
      <Col md={6}>
        <Form.Group className="mb-4">
          <Form.Label className="text-white fw-medium">{t('demo.business.name')}</Form.Label>
          <Form.Control
            type="text"
            value={demoData.businessName || t('demo.business.example')}
            onChange={(e) => setDemoData({...demoData, businessName: e.target.value})}
            style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              color: '#fff',
              borderRadius: '12px'
            }}
          />
        </Form.Group>

        <div className="mb-4">
          <Form.Label className="text-white fw-medium mb-3">{t('demo.business.type')}</Form.Label>
          <Row className="g-3">
            {businessTypes.map((type) => (
              <Col xs={6} key={type.value}>
                <Card 
                  className={`text-center cursor-pointer ${demoData.businessType === type.value ? 'border-success' : ''}`}
                  style={{ 
                    background: demoData.businessType === type.value ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: demoData.businessType === type.value ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px'
                  }}
                  onClick={() => setDemoData({...demoData, businessType: type.value})}
                >
                  <Card.Body className="p-3">
                    <i className={`${type.icon} text-success mb-2`} style={{ fontSize: '1.5rem' }}></i>
                    <div className="text-white small">{type.label}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Col>

      <Col md={6}>
        <div 
          className="p-4 rounded-3"
          style={{ 
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}
        >
          <h6 className="text-success fw-bold mb-3">
            <i className="fas fa-link me-2"></i>
            {t('demo.business.url')}
          </h6>
          <div className="bg-dark p-3 rounded">
            <code className="text-success">
              bookitbyzewo.com/book/{demoData.businessName?.toLowerCase().replace(/\s+/g, '-') || 'marias-salon'}
            </code>
          </div>
          <small className="text-white-50 mt-2 d-block">
            {t('demo.business.share')}
          </small>
        </div>
      </Col>
    </Row>
  )
}

function ServicesDemo({ t, demoData }: any) {
  const getServices = () => {
    switch (demoData.businessType) {
      case 'barber':
        return [
          { name: t('demo.services.barber.haircut'), duration: '45 min', price: '$35', deposit: '$10' },
          { name: t('demo.services.barber.beard'), duration: '20 min', price: '$15', deposit: '$5' },
          { name: t('demo.services.barber.combo'), duration: '60 min', price: '$45', deposit: '$15' }
        ]
      case 'beauty':
        return [
          { name: t('demo.services.beauty.manicure'), duration: '60 min', price: '$30', deposit: '$10' },
          { name: t('demo.services.beauty.pedicure'), duration: '90 min', price: '$40', deposit: '$15' },
          { name: t('demo.services.beauty.gel'), duration: '120 min', price: '$60', deposit: '$20' }
        ]
      case 'cleaning':
        return [
          { name: t('demo.services.cleaning.small'), duration: '2 hrs', price: '$80', deposit: '$20' },
          { name: t('demo.services.cleaning.large'), duration: '4 hrs', price: '$150', deposit: '$30' },
          { name: t('demo.services.cleaning.deep'), duration: '5 hrs', price: '$200', deposit: '$50' }
        ]
      default:
        return [
          { name: t('demo.services.tutor.individual'), duration: '60 min', price: '$50', deposit: '$10' },
          { name: t('demo.services.tutor.group'), duration: '90 min', price: '$75', deposit: '$15' }
        ]
    }
  }

  return (
    <Row className="g-3">
      {getServices().map((service, index) => (
        <Col md={4} key={index}>
          <Card 
            className="border-0 h-100"
            style={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '16px'
            }}
          >
            <Card.Body className="p-4">
              <h6 className="text-white fw-bold mb-3">{service.name}</h6>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-white-50">{t('demo.services.duration')}:</span>
                <span className="text-white">{service.duration}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-white-50">{t('demo.services.price')}:</span>
                <span className="text-success fw-bold">{service.price}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-white-50">{t('demo.services.deposit')}:</span>
                <span className="text-warning">{service.deposit}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

function StaffDemo({ t, demoData }: any) {
  const getPlanLimit = () => {
    switch (demoData.plan) {
      case 'solo': return 1
      case 'team': return 5
      case 'pro': return 10
      default: return 1
    }
  }

  const staffMembers = [
    { name: 'María García', role: t('demo.staff.owner'), status: 'active' },
    { name: 'Ana López', role: t('demo.staff.stylist'), status: demoData.plan !== 'solo' ? 'active' : 'blocked' },
    { name: 'Carlos Rivera', role: t('demo.staff.assistant'), status: demoData.plan === 'pro' ? 'active' : 'blocked' }
  ]

  return (
    <div>
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="text-white fw-bold">{t('demo.staff.title')}</h6>
          <Badge bg={demoData.plan === 'solo' ? 'warning' : 'success'}>
            {demoData.plan === 'solo' ? `1/1 ${t('demo.staff.limit')}` : `1/${getPlanLimit()} ${t('demo.staff.limit')}`}
          </Badge>
        </div>

        {staffMembers.map((member, index) => (
          <Card 
            key={index}
            className="mb-3 border-0"
            style={{ 
              background: member.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              opacity: member.status === 'blocked' ? 0.5 : 1
            }}
          >
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-white fw-medium">{member.name}</div>
                  <small className="text-white-50">{member.role}</small>
                </div>
                <div>
                  {member.status === 'active' ? (
                    <Badge bg="success">{t('demo.staff.active')}</Badge>
                  ) : (
                    <Badge bg="secondary">{t('demo.staff.upgrade')}</Badge>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>

      {demoData.plan === 'solo' && (
        <div 
          className="p-3 rounded-3 text-center"
          style={{ 
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}
        >
          <i className="fas fa-crown text-warning mb-2" style={{ fontSize: '1.5rem' }}></i>
          <div className="text-warning fw-bold">{t('demo.staff.solo.title')}</div>
          <small className="text-white-50">{t('demo.staff.solo.desc')}</small>
        </div>
      )}
    </div>
  )
}

function BookingDemo({ t, demoData }: any) {
  return (
    <Row>
      <Col md={6}>
        <div 
          className="p-4 rounded-3 mb-4"
          style={{ 
            background: 'rgba(37, 211, 102, 0.1)',
            border: '1px solid rgba(37, 211, 102, 0.3)'
          }}
        >
          <div className="d-flex align-items-center mb-3">
            <i className="fab fa-whatsapp text-success me-3" style={{ fontSize: '2rem' }}></i>
            <div>
              <h6 className="text-white fw-bold mb-0">{t('demo.booking.whatsapp')}</h6>
              <small className="text-success">{t('demo.booking.automatic')}</small>
            </div>
          </div>
          
          <div className="bg-dark p-3 rounded mb-3">
            <div className="text-white-50 small mb-2">
              <i className="fas fa-user me-2"></i>
              {t('demo.booking.customer')}: Ana Rodríguez
            </div>
            <div className="text-white small">
              "{t('demo.booking.message')}"
            </div>
          </div>

          <div className="d-flex gap-2">
            <Badge bg="success">{t('demo.booking.confirmed')}</Badge>
            <Badge bg="warning">{t('demo.booking.deposit')}</Badge>
            <Badge bg="info">{t('demo.booking.reminder')}</Badge>
          </div>
        </div>
      </Col>

      <Col md={6}>
        <Card 
          className="border-0"
          style={{ 
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '16px'
          }}
        >
          <Card.Body className="p-4">
            <h6 className="text-white fw-bold mb-3">
              <i className="fas fa-calendar me-2"></i>
              {t('demo.booking.appointment')}
            </h6>
            
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-white-50">{t('demo.booking.service')}:</span>
                <span className="text-white">{t('demo.services.barber.haircut')}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-white-50">{t('demo.booking.date')}:</span>
                <span className="text-white">Dec 15, 2024</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-white-50">{t('demo.booking.time')}:</span>
                <span className="text-white">2:00 PM</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-white-50">{t('demo.booking.staff')}:</span>
                <span className="text-white">María García</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-white-50">{t('demo.booking.status')}:</span>
                <Badge bg="success">{t('demo.booking.confirmed')}</Badge>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}