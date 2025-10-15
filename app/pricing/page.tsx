'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Container, Row, Col, Card, Button, Badge, Table } from 'react-bootstrap'
import { useLanguage } from '@/lib/language-context'

export const dynamic = 'force-dynamic'

export default function PricingPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const plans = [
    {
      name: t('pricing.plan.solo.name'),
      price: '$19',
      period: '/mo',
      description: t('pricing.plan.solo.desc'),
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      features: [
        t('pricing.features.staff_one'),
        t('pricing.features.location_one'),
        t('pricing.features.bookings'),
        t('pricing.features.whatsapp_manual'),
        t('pricing.features.payments'),
        t('pricing.features.bilingual'),
        t('pricing.features.calendar_basic'),
        t('pricing.features.support_email')
      ],
      cta: t('pricing.cta'),
      popular: false
    },
    {
      name: t('pricing.plan.team.name'),
      price: '$39',
      period: '/mo',
      description: t('pricing.plan.team.desc'),
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      features: [
        t('pricing.features.staff_five'),
        t('pricing.features.location_multiple'),
        t('pricing.features.scheduling'),
        t('pricing.features.calendar_advanced'),
        t('pricing.features.customers'),
        t('pricing.features.reports_basic'),
        t('pricing.features.everything_solo'),
        t('pricing.features.support_priority')
      ],
      cta: t('pricing.cta'),
      popular: true
    },
    {
      name: t('pricing.plan.pro.name'),
      price: '$79',
      period: '/mo',
      description: t('pricing.plan.pro.desc'),
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      features: [
        t('pricing.features.staff_ten'),
        t('pricing.features.whatsapp_auto'),
        t('pricing.features.domains'),
        t('pricing.features.reports_advanced'),
        t('pricing.features.api'),
        t('pricing.features.integrations'),
        t('pricing.features.everything_team'),
        t('pricing.features.support_phone')
      ],
      cta: t('pricing.cta'),
      popular: false
    }
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="bg-mesh text-white position-relative section-padding">
        <Container className="position-relative">
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <div className="animate-fadeInUp">
                <Badge bg="light" text="dark" className="mb-4 px-4 py-2 rounded-pill">
                  <i className="fas fa-tag me-2"></i>
                  {t('pricing.title')}
                </Badge>
                <h1 className="display-4 fw-bold mb-4">
                  {t('pricing.subtitle')}
                </h1>
                <p className="lead mb-5 opacity-90" style={{ fontSize: '1.2rem' }}>
                  {t('pricing.hero.description')}
                </p>
                <div className="d-flex justify-content-center align-items-center gap-4 flex-wrap">
                  <div className="d-flex align-items-center gap-2 text-white-50">
                    <i className="fas fa-check-circle text-success"></i>
                    <span>{t('pricing.hero.trial')}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-white-50">
                    <i className="fas fa-credit-card text-success"></i>
                    <span>{t('pricing.hero.setup')}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-white-50">
                    <i className="fas fa-times text-success"></i>
                    <span>{t('pricing.hero.cancel')}</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Pricing Cards */}
      <section className="section-padding" style={{ marginTop: '-60px' }}>
        <Container>
          <Row className="justify-content-center position-relative">
            {plans.map((plan, index) => (
              <Col lg={4} md={6} key={index} className="mb-4">
                <Card className={`h-100 border-0 position-relative overflow-hidden ${plan.popular ? 'shadow-xl' : 'shadow-lg'}`} 
                      style={{ transform: plan.popular ? 'scale(1.05)' : 'scale(1)' }}>
                  {plan.popular && (
                    <div className="position-absolute top-0 start-0 w-100 text-center">
                      <Badge 
                        className="px-4 py-2 rounded-bottom-pill fw-semibold"
                        style={{ background: plan.gradient, border: 'none' }}
                      >
                        <i className="fas fa-crown me-1"></i>
                        {t('pricing.popular')}
                      </Badge>
                    </div>
                  )}
                  
                  <div 
                    className="text-center py-5 text-white position-relative"
                    style={{ background: plan.gradient }}
                  >
                    <div className="position-absolute top-0 start-0 w-100 h-100 opacity-10">
                      <div style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.4'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: '20px 20px'
                      }} className="w-100 h-100"></div>
                    </div>
                    <div className="position-relative">
                      <h4 className="fw-bold mb-3">{plan.name}</h4>
                      <div className="d-flex align-items-end justify-content-center mb-3">
                        <span className="display-4 fw-bold">{plan.price}</span>
                        <span className="fs-5 opacity-75">{plan.period}</span>
                      </div>
                      <p className="opacity-90 mb-0">{plan.description}</p>
                    </div>
                  </div>
                  
                  <Card.Body className="p-4 d-flex flex-column">
                    <ul className="list-unstyled flex-grow-1 mb-4">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="mb-3 d-flex align-items-start">
                          <i className="fas fa-check text-success me-3 mt-1 flex-shrink-0"></i>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link href="/signup">
                      <Button 
                        size="lg" 
                        className="w-100 fw-semibold py-3"
                        style={{ 
                          background: plan.gradient, 
                          border: 'none',
                          color: 'white'
                        }}
                      >
                        <i className="fas fa-rocket me-2"></i>
                        {plan.cta}
                      </Button>
                    </Link>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Feature Comparison */}
      <section className="section-padding bg-light">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <div className="text-center mb-5">
                <h2 className="display-5 fw-bold mb-4">{t('pricing.features.title')}</h2>
                <p className="lead text-muted">
                  {t('pricing.features.subtitle')}
                </p>
              </div>
              
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="table-responsive">
                  <Table className="mb-0">
                    <thead style={{ background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)' }} className="text-white">
                      <tr>
                        <th className="py-4 px-4 fw-bold">{t('pricing.table.features')}</th>
                        <th className="text-center py-4 px-3 fw-bold">{t('pricing.table.solo')}</th>
                        <th className="text-center py-4 px-3 fw-bold position-relative" style={{ paddingTop: '2rem' }}>
                          <Badge bg="success" className="position-absolute start-50 translate-middle px-2 py-1 small" style={{ top: '0.5rem' }}>
                            {t('pricing.table.popular')}
                          </Badge>
                          {t('pricing.table.team')}
                        </th>
                        <th className="text-center py-4 px-3 fw-bold">{t('pricing.table.pro')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-bottom">
                        <td className="py-4 px-4 fw-semibold">{t('pricing.table.staff_members')}</td>
                        <td className="text-center py-4">1</td>
                        <td className="text-center py-4 bg-light">{t('pricing.table.up_to_5')}</td>
                        <td className="text-center py-4">{t('pricing.table.up_to_10')}</td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="py-4 px-4 fw-semibold">{t('pricing.table.locations')}</td>
                        <td className="text-center py-4">1</td>
                        <td className="text-center py-4 bg-light">{t('pricing.table.multiple')}</td>
                        <td className="text-center py-4">{t('pricing.table.unlimited')}</td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="py-4 px-4 fw-semibold">{t('pricing.table.whatsapp_integration')}</td>
                        <td className="text-center py-4">
                          <Badge bg="warning" text="dark">{t('pricing.table.manual')}</Badge>
                        </td>
                        <td className="text-center py-4 bg-light">
                          <Badge bg="warning" text="dark">{t('pricing.table.manual')}</Badge>
                        </td>
                        <td className="text-center py-4">
                          <Badge bg="success">{t('pricing.table.automated')}</Badge>
                        </td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="py-4 px-4 fw-semibold">{t('pricing.table.payment_processing')}</td>
                        <td className="text-center py-4">
                          <i className="fas fa-check text-success fs-5"></i>
                        </td>
                        <td className="text-center py-4 bg-light">
                          <i className="fas fa-check text-success fs-5"></i>
                        </td>
                        <td className="text-center py-4">
                          <i className="fas fa-check text-success fs-5"></i>
                        </td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="py-4 px-4 fw-semibold">{t('pricing.table.bilingual_support')}</td>
                        <td className="text-center py-4">
                          <i className="fas fa-check text-success fs-5"></i>
                        </td>
                        <td className="text-center py-4 bg-light">
                          <i className="fas fa-check text-success fs-5"></i>
                        </td>
                        <td className="text-center py-4">
                          <i className="fas fa-check text-success fs-5"></i>
                        </td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="py-4 px-4 fw-semibold">{t('pricing.table.calendar_sync')}</td>
                        <td className="text-center py-4">
                          <Badge bg="light" text="dark">{t('pricing.table.basic')}</Badge>
                        </td>
                        <td className="text-center py-4 bg-light">
                          <i className="fas fa-check text-success fs-5"></i>
                        </td>
                        <td className="text-center py-4">
                          <i className="fas fa-check text-success fs-5"></i>
                        </td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="py-4 px-4 fw-semibold">{t('pricing.table.advanced_reports')}</td>
                        <td className="text-center py-4">
                          <i className="fas fa-times text-muted"></i>
                        </td>
                        <td className="text-center py-4 bg-light">
                          <Badge bg="light" text="dark">{t('pricing.table.basic')}</Badge>
                        </td>
                        <td className="text-center py-4">
                          <Badge bg="primary">{t('pricing.table.advanced')}</Badge>
                        </td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="py-4 px-4 fw-semibold">{t('pricing.table.custom_domain')}</td>
                        <td className="text-center py-4">
                          <i className="fas fa-times text-muted"></i>
                        </td>
                        <td className="text-center py-4 bg-light">
                          <i className="fas fa-times text-muted"></i>
                        </td>
                        <td className="text-center py-4">
                          <i className="fas fa-check text-success fs-5"></i>
                        </td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="py-4 px-4 fw-semibold">{t('pricing.table.api_access')}</td>
                        <td className="text-center py-4">
                          <i className="fas fa-times text-muted"></i>
                        </td>
                        <td className="text-center py-4 bg-light">
                          <i className="fas fa-times text-muted"></i>
                        </td>
                        <td className="text-center py-4">
                          <i className="fas fa-check text-success fs-5"></i>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4 fw-semibold">{t('pricing.table.support')}</td>
                        <td className="text-center py-4">{t('pricing.table.email')}</td>
                        <td className="text-center py-4 bg-light">{t('pricing.table.priority_email')}</td>
                        <td className="text-center py-4">{t('pricing.table.phone_email')}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="section-padding">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <div className="text-center mb-5">
                <h2 className="display-5 fw-bold mb-4">{t('pricing.faq.title')}</h2>
                <p className="lead text-muted">
                  {t('pricing.faq.subtitle')}
                </p>
              </div>
              
              <div className="space-y-4">
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Header className="bg-transparent border-0 py-4">
                    <h5 className="fw-bold mb-0 d-flex align-items-center">
                      <i className="fas fa-gift text-success me-3"></i>
                      {t('pricing.faq.trial.question')}
                    </h5>
                  </Card.Header>
                  <Card.Body className="pt-0">
                    <p className="text-muted mb-0">
                      {t('pricing.faq.trial.answer')}
                    </p>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm mb-3">
                  <Card.Header className="bg-transparent border-0 py-4">
                    <h5 className="fw-bold mb-0 d-flex align-items-center">
                      <i className="fas fa-credit-card text-success me-3"></i>
                      {t('pricing.faq.payment.question')}
                    </h5>
                  </Card.Header>
                  <Card.Body className="pt-0">
                    <p className="text-muted mb-0">
                      {t('pricing.faq.payment.answer')}
                    </p>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm mb-3">
                  <Card.Header className="bg-transparent border-0 py-4">
                    <h5 className="fw-bold mb-0 d-flex align-items-center">
                      <i className="fas fa-exchange-alt text-success me-3"></i>
                      {t('pricing.faq.change.question')}
                    </h5>
                  </Card.Header>
                  <Card.Body className="pt-0">
                    <p className="text-muted mb-0">
                      {t('pricing.faq.change.answer')}
                    </p>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm mb-3">
                  <Card.Header className="bg-transparent border-0 py-4">
                    <h5 className="fw-bold mb-0 d-flex align-items-center">
                      <i className="fas fa-percentage text-success me-3"></i>
                      {t('pricing.faq.fees.question')}
                    </h5>
                  </Card.Header>
                  <Card.Body className="pt-0">
                    <p className="text-muted mb-0">
                      {t('pricing.faq.fees.answer')}
                    </p>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-transparent border-0 py-4">
                    <h5 className="fw-bold mb-0 d-flex align-items-center">
                      <i className="fas fa-times-circle text-success me-3"></i>
                      {t('pricing.faq.cancel.question')}
                    </h5>
                  </Card.Header>
                  <Card.Body className="pt-0">
                    <p className="text-muted mb-0">
                      {t('pricing.faq.cancel.answer')}
                    </p>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="bg-mesh text-white position-relative section-padding">
        <Container className="position-relative">
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h2 className="display-5 fw-bold mb-4">{t('pricing.final.title')}</h2>
              <p className="lead mb-5 opacity-90">
                {t('pricing.final.subtitle')}
              </p>
              <div className="d-flex justify-content-center gap-4 flex-wrap mb-5">
                <Link href="/signup">
                  <Button variant="light" size="lg" className="px-5 py-3 fw-semibold">
                    <i className="fas fa-rocket me-2"></i>
                    {t('pricing.final.trial')}
                  </Button>
                </Link>
                <Link href="/book/demo">
                  <Button variant="outline-light" size="lg" className="px-5 py-3 fw-semibold">
                    <i className="fas fa-calendar me-2"></i>
                    {t('pricing.final.demo')}
                  </Button>
                </Link>
              </div>
              <p className="small opacity-75">
                <i className="fas fa-lock me-2"></i>
                {t('pricing.final.security')}
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <div className="d-flex align-items-center mb-3 mb-md-0">
                <i className="fab fa-whatsapp text-success me-3 fs-2"></i>
                <div>
                  <h5 className="mb-0 fw-bold">BookIt</h5>
                  <small className="text-muted fst-italic">by Zewo</small>
                </div>
              </div>
            </Col>
            <Col md={6} className="text-md-end">
              <div className="d-flex justify-content-md-end justify-content-start gap-4 flex-wrap">
                <Link href="/pricing" className="text-white-50 text-decoration-none">
                  {t('nav.pricing')}
                </Link>
                <Link href="/login" className="text-white-50 text-decoration-none">
                  {t('nav.login')}
                </Link>
                <Link href="/signup" className="text-white-50 text-decoration-none">
                  {t('nav.signup')}
                </Link>
              </div>
              <div className="mt-3 d-flex justify-content-md-end justify-content-start gap-3">
                <a href="#" className="text-white-50" style={{ textDecoration: 'none', fontSize: '1.2rem' }} title="Follow us on Instagram">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="text-white-50" style={{ textDecoration: 'none', fontSize: '1.2rem' }} title="Follow us on Facebook">
                  <i className="fab fa-facebook"></i>
                </a>
                <a href="#" className="text-white-50" style={{ textDecoration: 'none', fontSize: '1.2rem' }} title="Follow us on TikTok">
                  <i className="fab fa-tiktok"></i>
                </a>
              </div>
              <div className="mt-3">
                <small className="text-muted">
                  {t('footer.copyright')}
                </small>
              </div>
            </Col>
          </Row>
          <Row>
            <Col className="text-end">
              <button 
                onClick={() => router.push('/admin/login')}
                style={{ 
                  fontSize: '18px', 
                  textDecoration: 'none',
                  background: 'transparent',
                  color: '#6c757d',
                  opacity: 0.3,
                  transition: 'opacity 0.3s',
                  cursor: 'pointer',
                  border: 'none',
                  padding: 0,
                  marginTop: '1rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}
                title="Admin Access"
              >
                <span style={{ 
                  fontWeight: 'bold', 
                  fontFamily: 'monospace',
                  textShadow: '0 0 2px rgba(255,255,255,0.5)',
                  backgroundColor: 'transparent'
                }}>
                  Z
                </span>
              </button>
            </Col>
          </Row>
        </Container>
      </footer>
    </>
  )
}