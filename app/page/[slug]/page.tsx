'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'

interface Business {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  address: string | null
  description: string | null
  website: string | null
  facebook: string | null
  instagram: string | null
  twitter: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

interface Service {
  id: string
  business_id: string
  name: string
  description: string | null
  duration_min: number
  price_cents: number
  created_at: string
  updated_at: string
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
    textColor: string
    backgroundImage?: string
    title: string
    depositRule?: string
    latenessRule?: string
    noshowRule?: string
    cancellationRule?: string
    additionalRules?: string
  }
  footerSection: {
    backgroundColor: string
    textColor: string
    backgroundImage?: string
    showPoweredBy: boolean
    customFooterText: string
    contactInfo: {
      phone: string
      email: string
      address: string
      hours: string
    }
  }
  socialMedia: {
    facebook?: string
    instagram?: string
    whatsapp?: string
    website?: string
  }
}

export default function BusinessWebpage() {
  const params = useParams()
  const businessSlug = params.slug as string
  
  const [business, setBusiness] = useState<Business | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [settings, setSettings] = useState<WebpageSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBusinessData = async () => {
    try {
      setLoading(true)
      
      // Fetch business
      const businessResponse = await fetch(`/api/business/${businessSlug}`)
      if (!businessResponse.ok) {
        throw new Error('Business not found')
      }
      const businessResult = await businessResponse.json()
      setBusiness(businessResult.business)

      // Fetch services
      const servicesResponse = await fetch(`/api/businesses/${businessResult.business.id}/services`)
      if (servicesResponse.ok) {
        const servicesResult = await servicesResponse.json()
        setServices(servicesResult.services || [])
      }

      // Fetch webpage settings
      const settingsResponse = await fetch(`/api/webpage-settings?businessId=${businessResult.business.id}`)
      if (settingsResponse.ok) {
        const settingsResult = await settingsResponse.json()
        if (settingsResult.settings && Object.keys(settingsResult.settings).length > 0) {
          setSettings(settingsResult.settings)
        }
      }

    } catch (err) {
      console.error('Error fetching business data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load business')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBusinessData()
  }, [businessSlug])

  // Hide nav and footer when component mounts
  useEffect(() => {
    const nav = document.querySelector('nav')
    const footer = document.querySelector('footer')
    if (nav) nav.style.display = 'none'
    if (footer) footer.style.display = 'none'

    // Show them again when component unmounts
    return () => {
      if (nav) nav.style.display = ''
      if (footer) footer.style.display = ''
    }
  }, [])

  const handleBookNow = () => {
    window.location.href = `/book/${businessSlug}`
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error || !business || !settings) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <h3>Business Not Found</h3>
          <p>{error || 'The requested business could not be found.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header - EXACT copy from preview */}
      <div
        className="d-flex align-items-center justify-content-between p-4"
        style={{
          backgroundColor: settings.headerSection.backgroundColor,
          color: settings.headerSection.textColor
        }}
      >
        <div className="d-flex align-items-center">
          <h1 className="mb-0 fw-bold">{settings.businessName}</h1>
        </div>

        <div className="d-flex align-items-center gap-3">
          {settings.headerSection.showNavigationButtons && (
            <div className="d-flex gap-2">
              <Button 
                size="sm" 
                variant={settings.headerSection.textColor === '#000000' ? 'outline-dark' : 'outline-light'}
                onClick={() => {
                  const bookingSection = document.getElementById('booking-section')
                  bookingSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                Book Now
              </Button>
              <Button 
                size="sm" 
                variant={settings.headerSection.textColor === '#000000' ? 'outline-dark' : 'outline-light'}
                onClick={() => {
                  const rulesSection = document.getElementById('rules-section')
                  rulesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                Rules
              </Button>
            </div>
          )}

          {settings.headerSection.showSocialIcons && (
            <div className="d-flex gap-2">
              {settings.socialMedia.facebook && (
                <a 
                  href={settings.socialMedia.facebook} 
                  style={{ color: settings.headerSection.textColor, fontSize: '1.5rem' }}
                  title="Facebook"
                >
                  <i className="fab fa-facebook"></i>
                </a>
              )}
              {settings.socialMedia.instagram && (
                <a 
                  href={settings.socialMedia.instagram} 
                  style={{ color: settings.headerSection.textColor, fontSize: '1.5rem' }}
                  title="Instagram"
                >
                  <i className="fab fa-instagram"></i>
                </a>
              )}
              {settings.socialMedia.whatsapp && (
                <a 
                  href={`https://wa.me/${settings.socialMedia.whatsapp}`} 
                  style={{ color: settings.headerSection.textColor, fontSize: '1.5rem' }}
                  title="WhatsApp"
                >
                  <i className="fab fa-whatsapp"></i>
                </a>
              )}
              {settings.socialMedia.website && (
                <a 
                  href={settings.socialMedia.website} 
                  style={{ color: settings.headerSection.textColor, fontSize: '1.5rem' }}
                  title="Website"
                >
                  <i className="fas fa-globe"></i>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hero Section - EXACT copy from preview */}
      <div
        id="booking-section"
        className="text-white d-flex align-items-center justify-content-center"
        style={{
          height: '400px',
          backgroundColor: settings.heroBackgroundColor,
          backgroundImage: settings.heroBackgroundImage ? `url(${settings.heroBackgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}
      >
        {settings.heroBackgroundImage && (
          <div 
            className="position-absolute w-100 h-100" 
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          />
        )}
        <div className="text-center position-relative">
          <h2 className="fw-bold mb-3 display-4">{settings.heroTitle}</h2>
          <p className="mb-4 fs-5">{settings.heroSubtitle}</p>
          <Button variant="light" size="lg" onClick={handleBookNow}>
            <i className="fas fa-calendar-alt me-2"></i>
            Book Now
          </Button>
        </div>
      </div>

      {/* Business Info & Services - EXACT copy from preview but bigger */}
      <div className="p-5 bg-light">
        <div className="text-center mb-5">
          <h3 className="fw-bold">{settings.businessName}</h3>
          {settings.businessDescription && (
            <p className="text-muted">{settings.businessDescription}</p>
          )}
        </div>

        <Container>
          <Row>
            <Col md={6}>
              <h6 className="mb-2">Our Services</h6>
              {services.slice(0, 3).map((service) => (
                <Card key={service.id} className="mb-1" style={{ fontSize: '0.8rem' }}>
                  <Card.Body className="py-2 px-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-medium">{service.name}</div>
                        <small className="text-muted">{service.duration_min} min</small>
                      </div>
                      <div className="text-end">
                        <strong>${(service.price_cents / 100).toFixed(2)}</strong>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </Col>
            <Col md={6}>
              <h6 className="mb-2">Book Appointment</h6>
              <div className="bg-white p-3 rounded border text-center">
                <i className="fas fa-calendar-alt fa-2x text-muted mb-2"></i>
                <p className="text-muted small mb-0">
                  Interactive calendar will appear here
                </p>
                <Button variant="primary" size="sm" onClick={handleBookNow} className="mt-3">
                  <i className="fas fa-calendar-check me-1"></i>
                  Book Now
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Rules Section - EXACT copy from preview */}
      <div
        id="rules-section"
        className="p-5"
        style={{
          backgroundColor: settings.rulesSection.backgroundColor,
          backgroundImage: settings.rulesSection.backgroundImage ? `url(${settings.rulesSection.backgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}
      >
        {settings.rulesSection.backgroundImage && (
          <div 
            className="position-absolute w-100 h-100 top-0 start-0" 
            style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
          />
        )}
        <Container className="position-relative">
          <h3 className="text-center mb-4">{settings.rulesSection.title}</h3>
          <Row>
            <Col md={6}>
              {settings.rulesSection.depositRule && (
                <div className="mb-3">
                  <i className="fas fa-credit-card text-success me-2"></i>
                  <span>{settings.rulesSection.depositRule}</span>
                </div>
              )}
              {settings.rulesSection.latenessRule && (
                <div className="mb-3">
                  <i className="fas fa-clock text-warning me-2"></i>
                  <span>{settings.rulesSection.latenessRule}</span>
                </div>
              )}
            </Col>
            <Col md={6}>
              {settings.rulesSection.noshowRule && (
                <div className="mb-3">
                  <i className="fas fa-user-times text-danger me-2"></i>
                  <span>{settings.rulesSection.noshowRule}</span>
                </div>
              )}
              {settings.rulesSection.cancellationRule && (
                <div className="mb-3">
                  <i className="fas fa-ban text-info me-2"></i>
                  <span>{settings.rulesSection.cancellationRule}</span>
                </div>
              )}
            </Col>
          </Row>
          {settings.rulesSection.additionalRules && (
            <div className="mt-4 pt-3 border-top">
              <p className="text-muted">{settings.rulesSection.additionalRules}</p>
            </div>
          )}
        </Container>
      </div>

      {/* Footer - EXACT copy from preview */}
      <div
        className="p-5 position-relative"
        style={{
          backgroundColor: settings.footerSection.backgroundColor,
          backgroundImage: settings.footerSection.backgroundImage ? `url(${settings.footerSection.backgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: settings.footerSection.textColor
        }}
      >
        {settings.footerSection.backgroundImage && (
          <div 
            className="position-absolute w-100 h-100 top-0 start-0" 
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          />
        )}
        <Container className="position-relative">
          <Row>
            <Col md={4}>
              <h5>{settings.businessName}</h5>
              {settings.footerSection.customFooterText && (
                <p className="mb-3">{settings.footerSection.customFooterText}</p>
              )}
              {!settings.footerSection.customFooterText && settings.businessDescription && (
                <p className="mb-3">{settings.businessDescription}</p>
              )}
            </Col>
            
            <Col md={4}>
              <h5>Contact Info</h5>
              {settings.footerSection.contactInfo.address && (
                <div className="mb-2">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  {settings.footerSection.contactInfo.address}
                </div>
              )}
              {settings.footerSection.contactInfo.phone && (
                <div className="mb-2">
                  <i className="fas fa-phone me-2"></i>
                  <a href={`tel:${settings.footerSection.contactInfo.phone}`} style={{ color: settings.footerSection.textColor, textDecoration: 'none' }}>
                    {settings.footerSection.contactInfo.phone}
                  </a>
                </div>
              )}
              {settings.footerSection.contactInfo.email && (
                <div className="mb-2">
                  <i className="fas fa-envelope me-2"></i>
                  <a href={`mailto:${settings.footerSection.contactInfo.email}`} style={{ color: settings.footerSection.textColor, textDecoration: 'none' }}>
                    {settings.footerSection.contactInfo.email}
                  </a>
                </div>
              )}
              {settings.footerSection.contactInfo.hours && (
                <div className="mb-2">
                  <i className="fas fa-clock me-2"></i>
                  {settings.footerSection.contactInfo.hours}
                </div>
              )}
            </Col>
            
            <Col md={4}>
              <h5>Follow Us</h5>
              <div className="d-flex gap-3 mb-3">
                {settings.socialMedia.facebook && (
                  <a href={settings.socialMedia.facebook} style={{ color: settings.footerSection.textColor, fontSize: '1.5rem' }}>
                    <i className="fab fa-facebook"></i>
                  </a>
                )}
                {settings.socialMedia.instagram && (
                  <a href={settings.socialMedia.instagram} style={{ color: settings.footerSection.textColor, fontSize: '1.5rem' }}>
                    <i className="fab fa-instagram"></i>
                  </a>
                )}
                {settings.socialMedia.whatsapp && (
                  <a href={`https://wa.me/${settings.socialMedia.whatsapp}`} style={{ color: settings.footerSection.textColor, fontSize: '1.5rem' }}>
                    <i className="fab fa-whatsapp"></i>
                  </a>
                )}
                {settings.socialMedia.website && (
                  <a href={settings.socialMedia.website} style={{ color: settings.footerSection.textColor, fontSize: '1.5rem' }}>
                    <i className="fas fa-globe"></i>
                  </a>
                )}
              </div>
              {settings.footerSection.showPoweredBy && (
                <p className="mb-0" style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                  Powered by <strong>BookIt by Zewo</strong>
                </p>
              )}
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  )
}