'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Container, Row, Col, Button, Card, Badge } from 'react-bootstrap'
import { useLanguage } from '@/lib/language-context'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const { t } = useLanguage()
  const router = useRouter()
  return (
    <>
      {/* Hero Section */}
      <section className="bg-mesh text-white position-relative overflow-hidden">
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)'
        }}></div>
        <Container className="position-relative">
          <Row className="min-vh-100 align-items-center justify-content-center text-center">
            <Col lg={10} xl={8}>
              <div className="animate-fadeInUp">
                <Badge bg="light" text="dark" className="mb-4 px-4 py-2 rounded-pill">
                  <i className="fab fa-whatsapp text-success me-2"></i>
                  {t('hero.badge')}
                </Badge>
                <h1 className="display-3 fw-bold mb-4">
                  {t('hero.title')}{' '}
                  <span className="position-relative">
                    WhatsApp
                    <svg className="position-absolute start-0 bottom-0 w-100" height="12" viewBox="0 0 100 12" fill="none" style={{ transform: 'translateY(8px)' }}>
                      <path d="M0 8C20 4, 40 0, 60 2C80 4, 90 6, 100 8" stroke="currentColor" strokeWidth="3" fill="none" />
                    </svg>
                  </span>
                </h1>
                <p className="lead mb-5 opacity-90" style={{ fontSize: '1.3rem', maxWidth: '700px', margin: '0 auto 3rem' }}>
                  {t('hero.subtitle')}
                </p>
                <div className="d-flex gap-4 justify-content-center flex-wrap mb-5">
                  <Link href="/signup">
                    <Button size="lg" variant="light" className="px-5 py-3 fw-semibold">
                      <i className="fas fa-rocket me-2"></i>
                      {t('hero.cta.trial')}
                    </Button>
                  </Link>
                  <Link href="/book/demo">
                    <Button 
                      size="lg" 
                      variant="outline-light" 
                      className="px-5 py-3 fw-semibold"
                    >
                      <i className="fas fa-play me-2"></i>
                      {t('hero.cta.demo')}
                    </Button>
                  </Link>
                </div>
                
                {/* Trust indicators */}
                <div className="d-flex justify-content-center align-items-center gap-4 flex-wrap text-white-50">
                  <div className="d-flex align-items-center gap-2">
                    <i className="fas fa-check-circle text-success"></i>
                    <span>30-day free trial</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <i className="fas fa-shield-alt text-success"></i>
                    <span>No setup fees</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <i className="fas fa-times text-success"></i>
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
        
        {/* Floating elements */}
        <div className="position-absolute" style={{ top: '20%', left: '10%', opacity: '0.1' }}>
          <i className="fab fa-whatsapp" style={{ fontSize: '6rem' }}></i>
        </div>
        <div className="position-absolute" style={{ top: '60%', right: '10%', opacity: '0.1' }}>
          <i className="fas fa-calendar-check" style={{ fontSize: '4rem' }}></i>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <Row className="text-center">
                <Col md={3} className="mb-4">
                  <div className="stat-card">
                    <div className="stat-number">{t('stats.noshows.number')}</div>
                    <div className="stat-label">{t('stats.noshows.label')}</div>
                  </div>
                </Col>
                <Col md={3} className="mb-4">
                  <div className="stat-card">
                    <div className="stat-number">{t('stats.whatsapp.number')}</div>
                    <div className="stat-label">{t('stats.whatsapp.label')}</div>
                  </div>
                </Col>
                <Col md={3} className="mb-4">
                  <div className="stat-card">
                    <div className="stat-number">{t('stats.setup.number')}</div>
                    <div className="stat-label">{t('stats.setup.label')}</div>
                  </div>
                </Col>
                <Col md={3} className="mb-4">
                  <div className="stat-card">
                    <div className="stat-number">{t('stats.automation.number')}</div>
                    <div className="stat-label">{t('stats.automation.label')}</div>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="section-padding">
        <Container>
          <Row className="justify-content-center text-center mb-5">
            <Col lg={8}>
              <h2 className="display-5 fw-bold mb-4">{t('providers.title')}</h2>
              <p className="lead text-muted">
                {t('providers.subtitle')}
              </p>
            </Col>
          </Row>
          
          <Row className="g-4">
            <Col lg={4} md={6} className="mb-4">
              <Card className="h-100 border-0 text-center p-4">
                <Card.Body>
                  <div className="feature-icon mx-auto">
                    <i className="fas fa-cut"></i>
                  </div>
                  <h5 className="fw-bold mb-3">{t('providers.beauty.title')}</h5>
                  <p className="text-muted">
                    {t('providers.beauty.desc')}
                  </p>
                  <div className="mt-3">
                    {t('providers.beauty.tags').split(',').map((tag, index) => (
                      <Badge key={index} bg="light" text="dark" className="me-2 mb-2">{tag}</Badge>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4} md={6} className="mb-4">
              <Card className="h-100 border-0 text-center p-4">
                <Card.Body>
                  <div className="feature-icon mx-auto" style={{ 
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' 
                  }}>
                    <i className="fas fa-broom"></i>
                  </div>
                  <h5 className="fw-bold mb-3">{t('providers.home.title')}</h5>
                  <p className="text-muted">
                    {t('providers.home.desc')}
                  </p>
                  <div className="mt-3">
                    {t('providers.home.tags').split(',').map((tag, index) => (
                      <Badge key={index} bg="light" text="dark" className="me-2 mb-2">{tag}</Badge>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4} md={6} className="mb-4">
              <Card className="h-100 border-0 text-center p-4">
                <Card.Body>
                  <div className="feature-icon mx-auto" style={{ 
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                  }}>
                    <i className="fas fa-graduation-cap"></i>
                  </div>
                  <h5 className="fw-bold mb-3">{t('providers.personal.title')}</h5>
                  <p className="text-muted">
                    {t('providers.personal.desc')}
                  </p>
                  <div className="mt-3">
                    {t('providers.personal.tags').split(',').map((tag, index) => (
                      <Badge key={index} bg="light" text="dark" className="me-2 mb-2">{tag}</Badge>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-mesh text-white position-relative overflow-hidden">
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)'
        }}></div>
        <Container className="position-relative">
          <Row className="justify-content-center text-center mb-5">
            <Col lg={8}>
              <h2 className="display-5 fw-bold mb-4 text-white">{t('howit.title')}</h2>
              <p className="lead text-white opacity-75">
                {t('howit.subtitle')}
              </p>
            </Col>
          </Row>
          
          <Row className="align-items-center">
            <Col lg={6} className="mb-5">
              <div className="pe-lg-5">
                <div className="d-flex align-items-start mb-4">
                  <div className="flex-shrink-0 me-4">
                    <div className="rounded-circle bg-gradient-primary text-white d-flex align-items-center justify-content-center" 
                         style={{ width: '60px', height: '60px', fontSize: '1.5rem', fontWeight: 'bold' }}>
                      1
                    </div>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-2 text-white">{t('howit.step1.title')}</h5>
                    <p className="text-white opacity-75 mb-0">
                      {t('howit.step1.desc')}
                    </p>
                  </div>
                </div>
                
                <div className="d-flex align-items-start mb-4">
                  <div className="flex-shrink-0 me-4">
                    <div className="rounded-circle bg-gradient-secondary text-white d-flex align-items-center justify-content-center" 
                         style={{ width: '60px', height: '60px', fontSize: '1.5rem', fontWeight: 'bold' }}>
                      2
                    </div>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-2 text-white">{t('howit.step2.title')}</h5>
                    <p className="text-white opacity-75 mb-0">
                      {t('howit.step2.desc')}
                    </p>
                  </div>
                </div>
                
                <div className="d-flex align-items-start">
                  <div className="flex-shrink-0 me-4">
                    <div className="rounded-circle text-white d-flex align-items-center justify-content-center" 
                         style={{ 
                           width: '60px', 
                           height: '60px', 
                           fontSize: '1.5rem', 
                           fontWeight: 'bold',
                           background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)'
                         }}>
                      3
                    </div>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-2 text-white">{t('howit.step3.title')}</h5>
                    <p className="text-white opacity-75 mb-0">
                      {t('howit.step3.desc')}
                    </p>
                  </div>
                </div>
              </div>
            </Col>
            
            <Col lg={6}>
              <div className="text-center">
                <div className="glass-card p-5 rounded-xl">
                  <div className="mb-4">
                    <i className="fab fa-whatsapp text-success" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h4 className="fw-bold mb-3 text-dark">{t('howit.integration.title')}</h4>
                  <p className="text-muted mb-4">
                    {t('howit.integration.desc')}
                  </p>
                  <div className="d-flex justify-content-center gap-3">
                    {t('howit.integration.tags').split(',').map((tag, index) => (
                      <Badge key={index} bg={index === 0 ? 'success' : index === 1 ? 'warning' : 'info'} className="px-3 py-2">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Differentiators */}
      <section className="section-padding">
        <Container>
          <Row className="justify-content-center text-center mb-5">
            <Col lg={8}>
              <h2 className="display-5 fw-bold mb-4">{t('whychoose.title')}</h2>
              <p className="lead text-muted">
                {t('whychoose.subtitle')}
              </p>
            </Col>
          </Row>
          
          <Row className="g-5">
            <Col md={6} lg={3}>
              <div className="text-center">
                <div className="feature-icon mx-auto mb-3">
                  <i className="fab fa-whatsapp"></i>
                </div>
                <h5 className="fw-bold mb-3">{t('whychoose.native.title')}</h5>
                <p className="text-muted">
                  {t('whychoose.native.desc')}
                </p>
              </div>
            </Col>
            
            <Col md={6} lg={3}>
              <div className="text-center">
                <div className="feature-icon mx-auto mb-3" style={{ 
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                }}>
                  <i className="fas fa-shield-alt"></i>
                </div>
                <h5 className="fw-bold mb-3">{t('whychoose.protection.title')}</h5>
                <p className="text-muted">
                  {t('whychoose.protection.desc')}
                </p>
              </div>
            </Col>
            
            <Col md={6} lg={3}>
              <div className="text-center">
                <div className="feature-icon mx-auto mb-3" style={{ 
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' 
                }}>
                  <i className="fas fa-language"></i>
                </div>
                <h5 className="fw-bold mb-3">{t('whychoose.bilingual.title')}</h5>
                <p className="text-muted">
                  {t('whychoose.bilingual.desc')}
                </p>
              </div>
            </Col>
            
            <Col md={6} lg={3}>
              <div className="text-center">
                <div className="feature-icon mx-auto mb-3" style={{ 
                  background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' 
                }}>
                  <i className="fas fa-mobile-alt"></i>
                </div>
                <h5 className="fw-bold mb-3">{t('whychoose.mobile.title')}</h5>
                <p className="text-muted">
                  {t('whychoose.mobile.desc')}
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="section-padding bg-light">
        <Container>
          <Row className="justify-content-center text-center mb-5">
            <Col lg={8}>
              <h2 className="display-5 fw-bold mb-4">Loved by Service Providers</h2>
              <p className="lead text-muted">
                See how local businesses are eliminating no-shows and growing with WhatsApp
              </p>
            </Col>
          </Row>
          
          <Row>
            <Col lg={4} className="mb-4">
              <Card className="border-0 h-100 p-4">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '50px', height: '50px' }}>
                      <i className="fas fa-cut"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">Maria's Hair Studio</h6>
                      <small className="text-muted">Bayamón, PR</small>
                    </div>
                  </div>
                  <p className="text-muted mb-3">
                    "{t('testimonials.maria.quote')}"
                  </p>
                  <div className="text-warning">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4} className="mb-4">
              <Card className="border-0 h-100 p-4">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '50px', height: '50px' }}>
                      <i className="fas fa-broom"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">CleanPR Services</h6>
                      <small className="text-muted">San Juan, PR</small>
                    </div>
                  </div>
                  <p className="text-muted mb-3">
                    "{t('testimonials.clean.quote')}"
                  </p>
                  <div className="text-warning">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4} className="mb-4">
              <Card className="border-0 h-100 p-4">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle bg-warning text-white d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '50px', height: '50px' }}>
                      <i className="fas fa-graduation-cap"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">Tutor Luis</h6>
                      <small className="text-muted">Ponce, PR</small>
                    </div>
                  </div>
                  <p className="text-muted mb-3">
                    "{t('testimonials.tutor.quote')}"
                  </p>
                  <div className="text-warning">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="bg-mesh text-white position-relative">
        <Container className="position-relative section-padding text-center">
          <Row className="justify-content-center">
            <Col lg={8}>
              <h2 className="display-5 fw-bold mb-4">{t('cta.title')}</h2>
              <p className="lead mb-5 opacity-90">
                {t('cta.subtitle')}
              </p>
              
              <div className="d-flex gap-4 justify-content-center flex-wrap mb-5">
                <Link href="/signup">
                  <Button size="lg" variant="light" className="px-5 py-3 fw-semibold">
                    <i className="fas fa-rocket me-2"></i>
                    {t('cta.trial')}
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline-light" className="px-5 py-3 fw-semibold">
                    <i className="fas fa-dollar-sign me-2"></i>
                    {t('cta.pricing')}
                  </Button>
                </Link>
              </div>
              
              <div className="d-flex justify-content-center align-items-center gap-4 flex-wrap text-white-50">
                <div className="d-flex align-items-center gap-2">
                  <i className="fas fa-check-circle text-success"></i>
                  <span>{t('cta.features.setup')}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="fas fa-shield-alt text-success"></i>
                  <span>{t('cta.features.nocard')}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="fas fa-headset text-success"></i>
                  <span>{t('cta.features.support')}</span>
                </div>
              </div>
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