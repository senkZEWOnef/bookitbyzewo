'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Container, Row, Col, Button, Card, Badge } from 'react-bootstrap'
import Link from 'next/link'

interface Business {
  id: string
  name: string
  slug: string
  description?: string
  location?: string
  phone?: string
  email?: string
}

interface Service {
  id: string
  name: string
  description?: string
  duration_min: number
  price_cents: number
  deposit_cents?: number
}

interface WebpageSettings {
  headerSection: {
    backgroundColor: string
    textColor: string
    showSocialIcons: boolean
    showNavigationButtons: boolean
  }
  heroBackgroundColor: string
  heroBackgroundImage: string
  heroTitle: string
  heroSubtitle: string
  businessName: string
  businessDescription: string
  rulesSection: {
    backgroundColor: string
    backgroundImage: string
    title: string
    depositRule: string
    latenessRule: string
    noshowRule: string
    cancellationRule: string
    additionalRules: string
  }
  footerSection: {
    backgroundColor: string
    backgroundImage: string
    textColor: string
    showPoweredBy: boolean
    customFooterText: string
    contactInfo: {
      address: string
      phone: string
      email: string
      hours: string
    }
  }
  socialMedia: {
    facebook: string
    instagram: string
    whatsapp: string
    website: string
  }
}

export default function BusinessWebpage() {
  const params = useParams()
  const businessSlug = params.slug as string
  
  console.log('🌐 BUSINESS PAGE: Component loaded for slug via /biz/ route:', businessSlug)
  
  const [business, setBusiness] = useState<Business | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [settings, setSettings] = useState<WebpageSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBusinessData()
  }, [businessSlug])

  const fetchBusinessData = async () => {
    try {
      console.log('🌐 WEBPAGE: Fetching business data for slug:', businessSlug)
      
      // Fetch business and services
      const response = await fetch(`/api/business/${businessSlug}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Business not found')
      }

      setBusiness(data.business)
      setServices(data.services || [])
      
      console.log('✅ WEBPAGE: Found business:', data.business.name)
      console.log('✅ WEBPAGE: Found', data.services?.length || 0, 'services')

      // Fetch webpage settings
      const settingsResponse = await fetch(`/api/webpage-settings?businessId=${data.business.id}`)
      const settingsResult = await settingsResponse.json()
      
      if (settingsResponse.ok && settingsResult.settings) {
        console.log('✅ WEBPAGE: Loaded custom settings')
        setSettings(settingsResult.settings)
      } else {
        console.log('📄 WEBPAGE: Using default settings')
        // Use default settings with business data
        setSettings({
          headerSection: {
            backgroundColor: '#ffffff',
            textColor: '#000000',
            showSocialIcons: true,
            showNavigationButtons: true
          },
          heroBackgroundColor: '#10b981',
          heroBackgroundImage: '',
          heroTitle: `Book Your Appointment at ${data.business.name}`,
          heroSubtitle: 'Professional services at your convenience',
          businessName: data.business.name,
          businessDescription: data.business.description || 'Professional services',
          rulesSection: {
            backgroundColor: '#f8f9fa',
            backgroundImage: '',
            title: 'Booking Policies',
            depositRule: 'A deposit may be required to confirm your appointment',
            latenessRule: 'Please arrive on time. Late arrivals may result in shortened service',
            noshowRule: 'No-show appointments will forfeit their deposit',
            cancellationRule: 'Cancellations must be made 24 hours in advance for full refund',
            additionalRules: ''
          },
          footerSection: {
            backgroundColor: '#212529',
            backgroundImage: '',
            textColor: '#ffffff',
            showPoweredBy: true,
            customFooterText: `${data.business.name} - Professional booking made easy`,
            contactInfo: {
              address: data.business.location || '',
              phone: data.business.phone || '',
              email: data.business.email || '',
              hours: 'Contact us for hours'
            }
          },
          socialMedia: {
            facebook: '',
            instagram: '',
            whatsapp: '',
            website: ''
          }
        })
      }
      
    } catch (err) {
      console.error('🔴 WEBPAGE: Error loading business:', err)
      setError(err instanceof Error ? err.message : 'Failed to load business')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    })
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading business page...</p>
        </div>
      </div>
    )
  }

  if (error || !business || !settings) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <div className="text-center">
              <h3>Business Not Found</h3>
              <p className="text-muted">{error || 'The business you\'re looking for doesn\'t exist.'}</p>
            </div>
          </Col>
        </Row>
      </Container>
    )
  }

  return (
    <div>
      {/* Header */}
      <header 
        style={{ 
          backgroundColor: settings.headerSection.backgroundColor,
          color: settings.headerSection.textColor
        }}
        className="py-3"
      >
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">{settings.businessName}</h5>
            
            <div className="d-flex align-items-center gap-3">
              {/* Social Media Icons */}
              {settings.headerSection.showSocialIcons && (
                <div className="d-flex gap-2">
                  {settings.socialMedia.facebook && (
                    <a 
                      href={settings.socialMedia.facebook} 
                      className="text-decoration-none" 
                      style={{ color: settings.headerSection.textColor }}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <i className="fab fa-facebook fs-5"></i>
                    </a>
                  )}
                  {settings.socialMedia.instagram && (
                    <a 
                      href={settings.socialMedia.instagram} 
                      className="text-decoration-none" 
                      style={{ color: settings.headerSection.textColor }}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <i className="fab fa-instagram fs-5"></i>
                    </a>
                  )}
                  {settings.socialMedia.whatsapp && (
                    <a 
                      href={`https://wa.me/${settings.socialMedia.whatsapp}`} 
                      className="text-decoration-none" 
                      style={{ color: settings.headerSection.textColor }}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <i className="fab fa-whatsapp fs-5"></i>
                    </a>
                  )}
                  {settings.socialMedia.website && (
                    <a 
                      href={settings.socialMedia.website} 
                      className="text-decoration-none" 
                      style={{ color: settings.headerSection.textColor }}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <i className="fas fa-globe fs-5"></i>
                    </a>
                  )}
                </div>
              )}
              
              {/* Navigation Buttons */}
              {settings.headerSection.showNavigationButtons && (
                <div className="d-flex gap-2">
                  <Link href={`/book/${businessSlug}`}>
                    <Button variant="success" size="sm">
                      <i className="fas fa-calendar-plus me-1"></i>
                      Book Now
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Container>
      </header>

      {/* Hero Section */}
      <section 
        style={{
          backgroundColor: settings.heroBackgroundColor,
          backgroundImage: settings.heroBackgroundImage ? `url(${settings.heroBackgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '60vh'
        }}
        className="d-flex align-items-center text-white position-relative"
      >
        <div className="position-absolute w-100 h-100" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}></div>
        <Container className="position-relative">
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1 className="display-4 fw-bold mb-4">{settings.heroTitle}</h1>
              <p className="lead mb-5">{settings.heroSubtitle}</p>
              <Link href={`/book/${businessSlug}`}>
                <Button 
                  variant="light" 
                  size="lg" 
                  className="px-5 py-3 fw-bold"
                  style={{ borderRadius: '50px' }}
                >
                  <i className="fas fa-calendar-check me-2"></i>
                  Book Your Appointment
                </Button>
              </Link>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Business Info Section */}
      <section className="py-5">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <div className="text-center mb-5">
                <h2 className="fw-bold mb-4">About {settings.businessName}</h2>
                <p className="lead text-muted">{settings.businessDescription}</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Services Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <div className="text-center mb-5">
                <h2 className="fw-bold mb-4">Our Services</h2>
                <p className="text-muted">Choose from our range of professional services</p>
              </div>
              
              <Row className="g-4">
                {services.map(service => (
                  <Col md={6} lg={4} key={service.id}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body className="text-center p-4">
                        <div 
                          className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                          style={{ 
                            width: '80px', 
                            height: '80px',
                            backgroundColor: settings.heroBackgroundColor,
                            color: 'white'
                          }}
                        >
                          <i className="fas fa-cut fs-3"></i>
                        </div>
                        <h5 className="fw-bold mb-2">{service.name}</h5>
                        {service.description && (
                          <p className="text-muted small mb-3">{service.description}</p>
                        )}
                        <div className="mb-3">
                          <Badge bg="light" text="dark" className="me-2">
                            <i className="fas fa-clock me-1"></i>
                            {service.duration_min} min
                          </Badge>
                          <Badge bg="success">
                            {formatPrice(service.price_cents)}
                          </Badge>
                          {(service.deposit_cents ?? 0) > 0 && (
                            <div className="mt-2">
                              <Badge bg="warning" text="dark">
                                Deposit: {formatPrice(service.deposit_cents || 0)}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <Link href={`/book/${businessSlug}?service=${service.id}`}>
                          <Button variant="outline-success" size="sm" className="w-100">
                            <i className="fas fa-calendar-plus me-1"></i>
                            Book This Service
                          </Button>
                        </Link>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Rules Section */}
      <section 
        style={{
          backgroundColor: settings.rulesSection.backgroundColor,
          backgroundImage: settings.rulesSection.backgroundImage ? `url(${settings.rulesSection.backgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        className="py-5"
      >
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <div className="text-center mb-5">
                <h2 className="fw-bold mb-4">{settings.rulesSection.title}</h2>
              </div>
              
              <Row className="g-4">
                <Col md={6}>
                  <div className="text-center">
                    <div className="mb-3">
                      <i className="fas fa-credit-card fs-2 text-success"></i>
                    </div>
                    <h6 className="fw-bold">Deposits</h6>
                    <p className="text-muted">{settings.rulesSection.depositRule}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-center">
                    <div className="mb-3">
                      <i className="fas fa-clock fs-2 text-warning"></i>
                    </div>
                    <h6 className="fw-bold">Punctuality</h6>
                    <p className="text-muted">{settings.rulesSection.latenessRule}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-center">
                    <div className="mb-3">
                      <i className="fas fa-ban fs-2 text-danger"></i>
                    </div>
                    <h6 className="fw-bold">No Shows</h6>
                    <p className="text-muted">{settings.rulesSection.noshowRule}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-center">
                    <div className="mb-3">
                      <i className="fas fa-calendar-times fs-2 text-info"></i>
                    </div>
                    <h6 className="fw-bold">Cancellations</h6>
                    <p className="text-muted">{settings.rulesSection.cancellationRule}</p>
                  </div>
                </Col>
              </Row>
              
              {settings.rulesSection.additionalRules && (
                <div className="text-center mt-4">
                  <p className="text-muted">{settings.rulesSection.additionalRules}</p>
                </div>
              )}
            </Col>
          </Row>
        </Container>
      </section>

      {/* Contact Section */}
      {(settings.footerSection.contactInfo.address || settings.footerSection.contactInfo.phone || settings.footerSection.contactInfo.email) && (
        <section className="py-5">
          <Container>
            <Row className="justify-content-center">
              <Col lg={8}>
                <div className="text-center mb-5">
                  <h2 className="fw-bold mb-4">Contact Us</h2>
                </div>
                
                <Row className="g-4 text-center">
                  {settings.footerSection.contactInfo.address && (
                    <Col md={4}>
                      <div>
                        <i className="fas fa-map-marker-alt fs-3 text-success mb-3"></i>
                        <h6 className="fw-bold">Address</h6>
                        <p className="text-muted">{settings.footerSection.contactInfo.address}</p>
                      </div>
                    </Col>
                  )}
                  {settings.footerSection.contactInfo.phone && (
                    <Col md={4}>
                      <div>
                        <i className="fas fa-phone fs-3 text-success mb-3"></i>
                        <h6 className="fw-bold">Phone</h6>
                        <p className="text-muted">
                          <a href={`tel:${settings.footerSection.contactInfo.phone}`} className="text-decoration-none">
                            {settings.footerSection.contactInfo.phone}
                          </a>
                        </p>
                      </div>
                    </Col>
                  )}
                  {settings.footerSection.contactInfo.email && (
                    <Col md={4}>
                      <div>
                        <i className="fas fa-envelope fs-3 text-success mb-3"></i>
                        <h6 className="fw-bold">Email</h6>
                        <p className="text-muted">
                          <a href={`mailto:${settings.footerSection.contactInfo.email}`} className="text-decoration-none">
                            {settings.footerSection.contactInfo.email}
                          </a>
                        </p>
                      </div>
                    </Col>
                  )}
                </Row>
                
                {settings.footerSection.contactInfo.hours && (
                  <div className="text-center mt-4">
                    <h6 className="fw-bold">Hours</h6>
                    <p className="text-muted">{settings.footerSection.contactInfo.hours}</p>
                  </div>
                )}
              </Col>
            </Row>
          </Container>
        </section>
      )}

      {/* Footer */}
      <footer 
        style={{
          backgroundColor: settings.footerSection.backgroundColor,
          backgroundImage: settings.footerSection.backgroundImage ? `url(${settings.footerSection.backgroundImage})` : 'none',
          color: settings.footerSection.textColor
        }}
        className="py-4"
      >
        <Container>
          <div className="text-center">
            <p className="mb-2">{settings.footerSection.customFooterText}</p>
            
            {settings.headerSection.showSocialIcons && (
              <div className="mb-3">
                {settings.socialMedia.facebook && (
                  <a href={settings.socialMedia.facebook} className="text-decoration-none mx-2" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-facebook fs-4"></i>
                  </a>
                )}
                {settings.socialMedia.instagram && (
                  <a href={settings.socialMedia.instagram} className="text-decoration-none mx-2" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-instagram fs-4"></i>
                  </a>
                )}
                {settings.socialMedia.whatsapp && (
                  <a href={`https://wa.me/${settings.socialMedia.whatsapp}`} className="text-decoration-none mx-2" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-whatsapp fs-4"></i>
                  </a>
                )}
                {settings.socialMedia.website && (
                  <a href={settings.socialMedia.website} className="text-decoration-none mx-2" target="_blank" rel="noopener noreferrer">
                    <i className="fas fa-globe fs-4"></i>
                  </a>
                )}
              </div>
            )}
            
            {settings.footerSection.showPoweredBy && (
              <small className="text-muted">
                Powered by <strong>BookIt by Zewo</strong>
              </small>
            )}
          </div>
        </Container>
      </footer>
    </div>
  )
}