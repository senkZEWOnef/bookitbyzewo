'use client'

import Link from 'next/link'
import { Container, Row, Col, Card, Button, Badge, Table } from 'react-bootstrap'
import { useLanguage } from '@/lib/language-context'

export default function PricingPage() {
  const { t } = useLanguage()
  const plans = [
    {
      name: 'Solo',
      price: '$19',
      period: '/mo',
      description: 'Perfect for individual service providers',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      features: [
        '1 staff member',
        '1 location',
        'Unlimited bookings',
        'WhatsApp manual mode',
        'Stripe + ATH Móvil payments',
        'Bilingual templates (EN/ES)',
        'Basic calendar view',
        'Email support'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Team',
      price: '$39',
      period: '/mo',
      description: 'Great for small teams and multiple locations',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      features: [
        'Up to 5 staff members',
        'Multiple locations',
        'Staff scheduling',
        'Advanced calendar views',
        'Customer management',
        'Basic reports',
        'Everything in Solo',
        'Priority email support'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Pro',
      price: '$79',
      period: '/mo',
      description: 'Full-featured solution for growing businesses',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      features: [
        'Up to 10 staff members',
        'Automated WhatsApp messages',
        'Custom booking domains',
        'Advanced analytics',
        'API access',
        'Custom integrations',
        'Everything in Team',
        'Phone + email support'
      ],
      cta: 'Start Free Trial',
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
                  All plans include a 30-day free trial. No setup fees, no hidden costs, 
                  cancel anytime. Start eliminating no-shows today.
                </p>
                <div className="d-flex justify-content-center align-items-center gap-4 flex-wrap">
                  <div className="d-flex align-items-center gap-2 text-white-50">
                    <i className="fas fa-check-circle text-success"></i>
                    <span>30-day free trial</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-white-50">
                    <i className="fas fa-credit-card text-success"></i>
                    <span>No setup fees</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 text-white-50">
                    <i className="fas fa-times text-success"></i>
                    <span>Cancel anytime</span>
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
                        Most Popular
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
                <h2 className="display-5 fw-bold mb-4">Complete Feature Comparison</h2>
                <p className="lead text-muted">
                  Everything you need to know about what's included in each plan
                </p>
              </div>
              
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="table-responsive">
                  <Table className="mb-0">
                    <thead style={{ background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)' }} className="text-white">
                      <tr>
                        <th className="py-4 px-4 fw-bold">Features</th>
                        <th className="text-center py-4 px-3 fw-bold">Solo</th>
                        <th className="text-center py-4 px-3 fw-bold position-relative">
                          Team
                          <Badge bg="success" className="position-absolute top-0 start-50 translate-middle px-2 py-1 small">
                            Popular
                          </Badge>
                        </th>
                        <th className="text-center py-4 px-3 fw-bold">Pro</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-bottom">
                        <td className="py-4 px-4 fw-semibold">Staff Members</td>
                        <td className="text-center py-4">1</td>
                        <td className="text-center py-4 bg-light">Up to 5</td>
                        <td className="text-center py-4">Up to 10</td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="py-4 px-4 fw-semibold">Locations</td>
                        <td className="text-center py-4">1</td>
                        <td className="text-center py-4 bg-light">Multiple</td>
                        <td className="text-center py-4">Unlimited</td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="py-4 px-4 fw-semibold">WhatsApp Integration</td>
                        <td className="text-center py-4">
                          <Badge bg="warning" text="dark">Manual</Badge>
                        </td>
                        <td className="text-center py-4 bg-light">
                          <Badge bg="warning" text="dark">Manual</Badge>
                        </td>
                        <td className="text-center py-4">
                          <Badge bg="success">Automated</Badge>
                        </td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="py-4 px-4 fw-semibold">Payment Processing</td>
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
                        <td className="py-4 px-4 fw-semibold">Bilingual Support (EN/ES)</td>
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
                        <td className="py-4 px-4 fw-semibold">Calendar Sync</td>
                        <td className="text-center py-4">
                          <Badge bg="light" text="dark">Basic</Badge>
                        </td>
                        <td className="text-center py-4 bg-light">
                          <i className="fas fa-check text-success fs-5"></i>
                        </td>
                        <td className="text-center py-4">
                          <i className="fas fa-check text-success fs-5"></i>
                        </td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="py-4 px-4 fw-semibold">Advanced Reports</td>
                        <td className="text-center py-4">
                          <i className="fas fa-times text-muted"></i>
                        </td>
                        <td className="text-center py-4 bg-light">
                          <Badge bg="light" text="dark">Basic</Badge>
                        </td>
                        <td className="text-center py-4">
                          <Badge bg="primary">Advanced</Badge>
                        </td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="py-4 px-4 fw-semibold">Custom Domain</td>
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
                        <td className="py-4 px-4 fw-semibold">API Access</td>
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
                        <td className="py-4 px-4 fw-semibold">Support</td>
                        <td className="text-center py-4">Email</td>
                        <td className="text-center py-4 bg-light">Priority Email</td>
                        <td className="text-center py-4">Phone + Email</td>
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
                <h2 className="display-5 fw-bold mb-4">Frequently Asked Questions</h2>
                <p className="lead text-muted">
                  Everything you need to know about BookIt by Zewo
                </p>
              </div>
              
              <div className="space-y-4">
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Header className="bg-transparent border-0 py-4">
                    <h5 className="fw-bold mb-0 d-flex align-items-center">
                      <i className="fas fa-gift text-success me-3"></i>
                      Is there really a free trial?
                    </h5>
                  </Card.Header>
                  <Card.Body className="pt-0">
                    <p className="text-muted mb-0">
                      Yes! All plans include a full 30-day free trial with access to all features. 
                      No credit card required to start. We believe in our product and want you to 
                      experience the difference it makes.
                    </p>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm mb-3">
                  <Card.Header className="bg-transparent border-0 py-4">
                    <h5 className="fw-bold mb-0 d-flex align-items-center">
                      <i className="fas fa-credit-card text-success me-3"></i>
                      What payment methods do you accept?
                    </h5>
                  </Card.Header>
                  <Card.Body className="pt-0">
                    <p className="text-muted mb-0">
                      We accept all major credit cards through Stripe, and ATH Móvil for Puerto Rico 
                      customers. Your customers can pay deposits using the same methods. We handle 
                      all the payment processing securely.
                    </p>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm mb-3">
                  <Card.Header className="bg-transparent border-0 py-4">
                    <h5 className="fw-bold mb-0 d-flex align-items-center">
                      <i className="fas fa-exchange-alt text-success me-3"></i>
                      Can I change plans later?
                    </h5>
                  </Card.Header>
                  <Card.Body className="pt-0">
                    <p className="text-muted mb-0">
                      Absolutely! You can upgrade or downgrade your plan at any time from your 
                      dashboard. Changes take effect immediately, and we'll prorate the billing 
                      accordingly. No penalties or fees.
                    </p>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm mb-3">
                  <Card.Header className="bg-transparent border-0 py-4">
                    <h5 className="fw-bold mb-0 d-flex align-items-center">
                      <i className="fas fa-percentage text-success me-3"></i>
                      Do you charge transaction fees?
                    </h5>
                  </Card.Header>
                  <Card.Body className="pt-0">
                    <p className="text-muted mb-0">
                      We don't charge any additional transaction fees beyond our subscription price. 
                      You'll only pay standard Stripe processing fees (2.9% + 30¢) for credit card 
                      payments. ATH Móvil transactions have no additional fees.
                    </p>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-transparent border-0 py-4">
                    <h5 className="fw-bold mb-0 d-flex align-items-center">
                      <i className="fas fa-times-circle text-success me-3"></i>
                      What happens if I cancel?
                    </h5>
                  </Card.Header>
                  <Card.Body className="pt-0">
                    <p className="text-muted mb-0">
                      You can cancel anytime with no penalty or cancellation fees. Your account 
                      remains active until the end of your billing period, and you can export 
                      all your data including customer information and appointment history.
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
              <h2 className="display-5 fw-bold mb-4">Ready to Transform Your Business?</h2>
              <p className="lead mb-5 opacity-90">
                Join hundreds of service providers who've eliminated no-shows and automated 
                their booking process with WhatsApp. Start your journey today.
              </p>
              <div className="d-flex justify-content-center gap-4 flex-wrap mb-5">
                <Link href="/signup">
                  <Button variant="light" size="lg" className="px-5 py-3 fw-semibold">
                    <i className="fas fa-rocket me-2"></i>
                    Start Your Free Trial
                  </Button>
                </Link>
                <Link href="/book/demo">
                  <Button variant="outline-light" size="lg" className="px-5 py-3 fw-semibold">
                    <i className="fas fa-calendar me-2"></i>
                    Book a Demo
                  </Button>
                </Link>
              </div>
              <p className="small opacity-75">
                <i className="fas fa-lock me-2"></i>
                Your data is secure and protected. We never share your information.
              </p>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  )
}