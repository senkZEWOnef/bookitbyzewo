'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Modal } from 'react-bootstrap'
import TimeSlotPicker from '@/components/TimeSlotPicker'

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
    textStyle: {
      fontFamily: string
      fontSize: string
      fontWeight: string
    }
  }
  heroBackgroundColor: string
  heroBackgroundImage: string
  heroTitle: string
  heroSubtitle: string
  heroTextStyle: {
    titleColor: string
    subtitleColor: string
    titleFontSize: string
    subtitleFontSize: string
    fontFamily: string
    fontWeight: string
    textAlign: 'left' | 'center' | 'right'
  }
  businessName: string
  businessDescription: string
  businessTextStyle: {
    nameColor: string
    descriptionColor: string
    nameFontSize: string
    descriptionFontSize: string
    fontFamily: string
    textAlign: 'left' | 'center' | 'right'
  }
  aboutSection: {
    enabled: boolean
    backgroundColor: string
    backgroundImage: string
    title: string
    content: string
    showTeamInfo: boolean
    teamInfo: string
    textStyle: {
      titleColor: string
      contentColor: string
      titleFontSize: string
      contentFontSize: string
      fontFamily: string
      textAlign: 'left' | 'center' | 'right'
    }
  }
  gallerySection: {
    enabled: boolean
    backgroundColor: string
    title: string
    images: string[]
    description: string
  }
  testimonialsSection: {
    enabled: boolean
    backgroundColor: string
    title: string
    testimonials: {
      name: string
      text: string
      rating: number
    }[]
  }
  contactSection: {
    enabled: boolean
    backgroundColor: string
    backgroundImage: string
    title: string
    subtitle: string
    showForm: boolean
    formFields: {
      name: boolean
      email: boolean
      phone: boolean
      subject: boolean
      message: boolean
    }
    showContactInfo: boolean
    showMap: boolean
    mapEmbedCode: string
  }
  rulesSection: {
    backgroundColor: string
    backgroundImage: string
    title: string
    depositRule: string
    latenessRule: string
    noshowRule: string
    cancellationRule: string
    additionalRules: string
    textStyle: {
      titleColor: string
      textColor: string
      titleFontSize: string
      textFontSize: string
      fontFamily: string
      textAlign: 'left' | 'center' | 'right'
    }
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
    tiktok: string
    linkedin: string
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
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  
  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

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

      // Fetch webpage settings with default fallback
      const settingsResponse = await fetch(`/api/webpage-settings?businessId=${businessResult.business.id}`)
      let webpageSettings = null
      if (settingsResponse.ok) {
        const settingsResult = await settingsResponse.json()
        if (settingsResult.settings && Object.keys(settingsResult.settings).length > 0) {
          webpageSettings = settingsResult.settings
        }
      }
      
      // Use default settings if none found
      if (!webpageSettings) {
        webpageSettings = {
          headerSection: {
            backgroundColor: '#ffffff',
            textColor: '#000000',
            showSocialIcons: true,
            showNavigationButtons: true,
            textStyle: { fontFamily: 'Arial, sans-serif', fontSize: '16px', fontWeight: 'normal' }
          },
          heroBackgroundColor: '#10b981',
          heroBackgroundImage: '',
          heroTitle: `Book Your Appointment at ${businessResult.business.name}`,
          heroSubtitle: 'Professional services at your convenience',
          heroTextStyle: {
            titleColor: '#ffffff', subtitleColor: '#ffffff', titleFontSize: '2.5rem',
            subtitleFontSize: '1.2rem', fontFamily: 'Arial, sans-serif', fontWeight: 'bold', textAlign: 'center'
          },
          businessName: businessResult.business.name,
          businessDescription: businessResult.business.description || 'Professional services',
          businessTextStyle: {
            nameColor: '#212529', descriptionColor: '#6c757d', nameFontSize: '2rem',
            descriptionFontSize: '1rem', fontFamily: 'Arial, sans-serif', textAlign: 'center'
          },
          aboutSection: { enabled: false, backgroundColor: '#ffffff', backgroundImage: '', title: 'About Us',
            content: '', showTeamInfo: false, teamInfo: '',
            textStyle: { titleColor: '#212529', contentColor: '#495057', titleFontSize: '2rem',
              contentFontSize: '1rem', fontFamily: 'Arial, sans-serif', textAlign: 'center' }
          },
          gallerySection: { enabled: false, backgroundColor: '#f8f9fa', title: 'Our Work', images: [], description: '' },
          testimonialsSection: { enabled: false, backgroundColor: '#ffffff', title: 'What Our Clients Say', testimonials: [] },
          contactSection: {
            enabled: true, backgroundColor: '#f8f9fa', backgroundImage: '', title: 'Get In Touch',
            subtitle: "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
            showForm: true, formFields: { name: true, email: true, phone: true, subject: true, message: true },
            showContactInfo: true, showMap: false, mapEmbedCode: ''
          },
          rulesSection: {
            backgroundColor: '#f8f9fa', backgroundImage: '', title: 'Booking Policies',
            depositRule: 'A deposit may be required to confirm your appointment',
            latenessRule: 'Please arrive on time. Late arrivals may result in shortened service',
            noshowRule: 'No-show appointments may forfeit their deposit',
            cancellationRule: 'Cancellations should be made in advance for full refund',
            additionalRules: '',
            textStyle: { titleColor: '#212529', textColor: '#495057', titleFontSize: '1.8rem',
              textFontSize: '0.9rem', fontFamily: 'Arial, sans-serif', textAlign: 'center' }
          },
          footerSection: {
            backgroundColor: '#212529', backgroundImage: '', textColor: '#ffffff', showPoweredBy: true,
            customFooterText: 'Professional booking made easy',
            contactInfo: { address: '', phone: businessResult.business.phone || '', email: businessResult.business.email || '', hours: '' }
          },
          socialMedia: { facebook: '', instagram: '', whatsapp: '', website: '', tiktok: '', linkedin: '' }
        }
      }
      
      setSettings(webpageSettings)

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

  const handleBookNow = (service?: Service) => {
    if (service) {
      setSelectedService(service)
      setShowBookingModal(true)
    } else {
      window.location.href = `/book/${businessSlug}`
    }
  }
  
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) return
    
    setContactSubmitting(true)
    setContactMessage('')
    
    try {
      const response = await fetch('/api/contact-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: business.id,
          ...contactForm
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setContactMessage('Thank you for your message! We will get back to you soon.')
        setContactForm({ name: '', email: '', phone: '', subject: '', message: '' })
      } else {
        setContactMessage(result.error || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      setContactMessage('Failed to send message. Please try again.')
    } finally {
      setContactSubmitting(false)
    }
  }
  
  const handleContactInputChange = (field: string, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }))
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
      {/* Header - Desktop & Mobile Optimized */}
      <div
        className="d-flex flex-column flex-sm-row align-items-center justify-content-between p-3 p-lg-4 gap-3"
        style={{
          backgroundColor: settings.headerSection.backgroundColor,
          color: settings.headerSection.textColor
        }}
      >
        <div className="d-flex align-items-center text-center text-sm-start flex-shrink-0">
          <h1 
            className="mb-0 fw-bold" 
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', lineHeight: '1.2' }}
          >
            {settings.businessName}
          </h1>
        </div>

        <div className="d-flex flex-column flex-sm-row align-items-center gap-2 gap-sm-3">
          {settings.headerSection.showNavigationButtons && (
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <Button 
                size="sm" 
                variant={settings.headerSection.textColor === '#000000' ? 'outline-dark' : 'outline-light'}
                className="px-3"
                style={{ fontSize: 'clamp(0.8rem, 2vw, 0.875rem)', minHeight: '36px' }}
                onClick={() => {
                  const bookingSection = document.getElementById('booking-section')
                  bookingSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                <i className="fas fa-calendar-check me-1"></i>
                Book Now
              </Button>
              <Button 
                size="sm" 
                variant={settings.headerSection.textColor === '#000000' ? 'outline-dark' : 'outline-light'}
                className="px-3"
                style={{ fontSize: 'clamp(0.8rem, 2vw, 0.875rem)', minHeight: '36px' }}
                onClick={() => {
                  const rulesSection = document.getElementById('rules-section')
                  rulesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                <i className="fas fa-list me-1"></i>
                Rules
              </Button>
            </div>
          )}

          {settings.headerSection.showSocialIcons && (
            <div className="d-flex gap-2 justify-content-center">
              {settings.socialMedia.facebook && (
                <a 
                  href={settings.socialMedia.facebook} 
                  style={{ 
                    color: settings.headerSection.textColor, 
                    fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                    padding: '8px'
                  }}
                  title="Facebook"
                  className="d-flex align-items-center justify-content-center"
                >
                  <i className="fab fa-facebook"></i>
                </a>
              )}
              {settings.socialMedia.instagram && (
                <a 
                  href={settings.socialMedia.instagram} 
                  style={{ 
                    color: settings.headerSection.textColor, 
                    fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                    padding: '8px'
                  }}
                  title="Instagram"
                  className="d-flex align-items-center justify-content-center"
                >
                  <i className="fab fa-instagram"></i>
                </a>
              )}
              {settings.socialMedia.whatsapp && (
                <a 
                  href={`https://wa.me/${settings.socialMedia.whatsapp}`} 
                  style={{ 
                    color: settings.headerSection.textColor, 
                    fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                    padding: '8px'
                  }}
                  title="WhatsApp"
                  className="d-flex align-items-center justify-content-center"
                >
                  <i className="fab fa-whatsapp"></i>
                </a>
              )}
              {settings.socialMedia.website && (
                <a 
                  href={settings.socialMedia.website} 
                  style={{ 
                    color: settings.headerSection.textColor, 
                    fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                    padding: '8px'
                  }}
                  title="Website"
                  className="d-flex align-items-center justify-content-center"
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
          minHeight: 'clamp(300px, 50vh, 400px)',
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
        <div className="text-center position-relative px-3">
          <h2 
            className="fw-bold mb-3" 
            style={{ 
              fontSize: 'clamp(1.75rem, 5vw, 3rem)',
              lineHeight: '1.2'
            }}
          >
            {settings.heroTitle}
          </h2>
          <p 
            className="mb-4" 
            style={{ 
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              maxWidth: '500px',
              margin: '0 auto 1.5rem auto'
            }}
          >
            {settings.heroSubtitle}
          </p>
          <Button 
            variant="light" 
            size="lg" 
            onClick={() => handleBookNow()}
            style={{ 
              minHeight: '48px',
              fontSize: 'clamp(0.9rem, 2.2vw, 1.1rem)',
              padding: '0.75rem 2rem'
            }}
          >
            <i className="fas fa-calendar-alt me-2"></i>
            Book Now
          </Button>
        </div>
      </div>

      {/* Business Info & Services */}
      <div className="py-4 py-md-5 px-3 bg-light">
        <div 
          className="mb-5" 
          style={{ 
            textAlign: settings.businessTextStyle.textAlign,
            maxWidth: '800px',
            margin: '0 auto'
          }}
        >
          <h3 
            className="fw-bold mb-3"
            style={{
              color: settings.businessTextStyle.nameColor,
              fontSize: settings.businessTextStyle.nameFontSize,
              fontFamily: settings.businessTextStyle.fontFamily
            }}
          >
            {settings.businessName}
          </h3>
          {settings.businessDescription && (
            <p 
              style={{
                color: settings.businessTextStyle.descriptionColor,
                fontSize: settings.businessTextStyle.descriptionFontSize,
                fontFamily: settings.businessTextStyle.fontFamily,
                maxWidth: '600px',
                margin: settings.businessTextStyle.textAlign === 'center' ? '0 auto' : '0'
              }}
            >
              {settings.businessDescription}
            </p>
          )}
        </div>

        <Container>
          <Row className="g-4">
            <Col lg={8} className="order-2 order-lg-1">
              <h4 className="mb-3 mb-md-4">Our Services</h4>
              <Row className="g-3">
                {services.map((service) => (
                  <Col sm={6} lg={6} key={service.id} className="mb-2 mb-sm-0">
                    <Card className="h-100 shadow-sm">
                      <Card.Body className="p-3 p-md-4">
                        <h5 className="card-title" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
                          {service.name}
                        </h5>
                        {service.description && (
                          <p className="card-text text-muted small mb-3" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                            {service.description}
                          </p>
                        )}
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mt-3 gap-2">
                          <div>
                            <span className="text-muted small d-block">Duration: {service.duration_min} min</span>
                            <strong className="h5 text-primary" style={{ fontSize: 'clamp(1.1rem, 3vw, 1.25rem)' }}>
                              ${(service.price_cents / 100).toFixed(2)}
                            </strong>
                          </div>
                          <Button 
                            variant="primary" 
                            size="sm"
                            className="w-100 w-sm-auto"
                            style={{ minHeight: '38px' }}
                            onClick={() => handleBookNow(service)}
                          >
                            <i className="fas fa-calendar-check me-1 d-none d-sm-inline"></i>
                            Book Now
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>
            <Col lg={4} className="order-1 order-lg-2">
              <div className="position-sticky" style={{ top: '20px' }}>
                <Card className="shadow-sm">
                  <Card.Header className="border-0 bg-primary text-white">
                    <h5 className="mb-0" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
                      <i className="fas fa-calendar-alt me-2"></i>
                      Quick Booking
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-3 p-md-4">
                    <p className="text-muted mb-3" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                      Select a service and choose your preferred time slot
                    </p>
                    <div className="d-grid gap-2">
                      <Button 
                        variant="primary" 
                        size="lg" 
                        onClick={() => handleBookNow()}
                        style={{ 
                          minHeight: '48px',
                          fontSize: 'clamp(0.9rem, 2.2vw, 1.1rem)'
                        }}
                      >
                        <i className="fas fa-calendar-check me-2"></i>
                        Book Appointment
                      </Button>
                      {settings.socialMedia.whatsapp && (
                        <Button 
                          variant="success" 
                          size="sm"
                          href={`https://wa.me/${settings.socialMedia.whatsapp}?text=Hi! I'd like to book an appointment.`}
                          target="_blank"
                          style={{ 
                            minHeight: '40px',
                            fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
                          }}
                        >
                          <i className="fab fa-whatsapp me-2"></i>
                          WhatsApp Us
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* About Section */}
      {settings.aboutSection?.enabled && (
        <div
          className="py-4 py-md-5 position-relative"
          style={{
            backgroundColor: settings.aboutSection.backgroundColor,
            backgroundImage: settings.aboutSection.backgroundImage ? `url(${settings.aboutSection.backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {settings.aboutSection.backgroundImage && (
            <div 
              className="position-absolute w-100 h-100 top-0 start-0" 
              style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
            />
          )}
          <Container 
            className="position-relative px-3 px-md-4" 
            style={{ 
              textAlign: settings.aboutSection.textStyle.textAlign,
              maxWidth: '800px'
            }}
          >
            <h3 
              className="mb-3 mb-md-4"
              style={{
                color: settings.aboutSection.textStyle.titleColor,
                fontSize: `clamp(1.5rem, 4vw, ${settings.aboutSection.textStyle.titleFontSize || '2rem'})`,
                fontFamily: settings.aboutSection.textStyle.fontFamily,
                lineHeight: '1.3'
              }}
            >
              {settings.aboutSection.title}
            </h3>
            <p 
              className="lead"
              style={{
                color: settings.aboutSection.textStyle.contentColor,
                fontSize: `clamp(1rem, 2.5vw, ${settings.aboutSection.textStyle.contentFontSize || '1.25rem'})`,
                fontFamily: settings.aboutSection.textStyle.fontFamily,
                lineHeight: '1.6'
              }}
            >
              {settings.aboutSection.content}
            </p>
            {settings.aboutSection.showTeamInfo && settings.aboutSection.teamInfo && (
              <div className="mt-4 pt-3 border-top">
                <p 
                  style={{
                    color: settings.aboutSection.textStyle.contentColor,
                    fontFamily: settings.aboutSection.textStyle.fontFamily
                  }}
                >
                  {settings.aboutSection.teamInfo}
                </p>
              </div>
            )}
          </Container>
        </div>
      )}

      {/* Gallery Section */}
      {settings.gallerySection?.enabled && (
        <div
          className="p-5"
          style={{ backgroundColor: settings.gallerySection.backgroundColor }}
        >
          <Container>
            <div className="text-center mb-5">
              <h3 className="mb-3">{settings.gallerySection.title}</h3>
              {settings.gallerySection.description && (
                <p className="text-muted">{settings.gallerySection.description}</p>
              )}
            </div>
            {settings.gallerySection.images.length > 0 ? (
              <Row>
                {settings.gallerySection.images.map((image, index) => (
                  <Col md={4} key={index} className="mb-4">
                    <Card className="shadow-sm">
                      <Card.Img 
                        variant="top" 
                        src={image} 
                        alt={`Gallery ${index + 1}`} 
                        style={{ height: '250px', objectFit: 'cover' }}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-images fa-3x text-muted mb-3"></i>
                <p className="text-muted">Gallery coming soon!</p>
              </div>
            )}
          </Container>
        </div>
      )}

      {/* Testimonials Section */}
      {settings.testimonialsSection?.enabled && (
        <div
          className="p-5"
          style={{ backgroundColor: settings.testimonialsSection.backgroundColor }}
        >
          <Container>
            <div className="text-center mb-5">
              <h3 className="mb-3">{settings.testimonialsSection.title}</h3>
            </div>
            {settings.testimonialsSection.testimonials.length > 0 ? (
              <Row>
                {settings.testimonialsSection.testimonials.map((testimonial, index) => (
                  <Col md={4} key={index} className="mb-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Body className="text-center">
                        <div className="mb-3">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <i key={i} className="fas fa-star text-warning"></i>
                          ))}
                        </div>
                        <p className="card-text mb-3">"{testimonial.text}"</p>
                        <footer className="blockquote-footer">
                          <strong>{testimonial.name}</strong>
                        </footer>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-quote-left fa-3x text-muted mb-3"></i>
                <p className="text-muted">Customer testimonials coming soon!</p>
              </div>
            )}
          </Container>
        </div>
      )}

      {/* Contact Section */}
      {settings.contactSection?.enabled && (
        <div
          id="contact-section"
          className="p-5 position-relative"
          style={{
            backgroundColor: settings.contactSection.backgroundColor,
            backgroundImage: settings.contactSection.backgroundImage ? `url(${settings.contactSection.backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {settings.contactSection.backgroundImage && (
            <div 
              className="position-absolute w-100 h-100 top-0 start-0" 
              style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
            />
          )}
          <Container className="position-relative">
            <div className="text-center mb-5">
              <h3 className="mb-3">{settings.contactSection.title}</h3>
              {settings.contactSection.subtitle && (
                <p className="text-muted">{settings.contactSection.subtitle}</p>
              )}
            </div>
            <Row>
              {settings.contactSection.showForm && (
                <Col lg={settings.contactSection.showContactInfo ? 8 : 12}>
                  <Card className="shadow-sm">
                    <Card.Header>
                      <h5 className="mb-0">
                        <i className="fas fa-envelope me-2"></i>
                        Send us a Message
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      {contactMessage && (
                        <Alert variant={contactMessage.includes('Thank you') ? 'success' : 'danger'}>
                          {contactMessage}
                        </Alert>
                      )}
                      <Form onSubmit={handleContactSubmit}>
                        <Row>
                          {settings.contactSection.formFields.name && (
                            <Col md={6} className="mb-3">
                              <Form.Group>
                                <Form.Label>Name *</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={contactForm.name}
                                  onChange={(e) => handleContactInputChange('name', e.target.value)}
                                  required
                                  placeholder="Your full name"
                                />
                              </Form.Group>
                            </Col>
                          )}
                          {settings.contactSection.formFields.email && (
                            <Col md={6} className="mb-3">
                              <Form.Group>
                                <Form.Label>Email *</Form.Label>
                                <Form.Control
                                  type="email"
                                  value={contactForm.email}
                                  onChange={(e) => handleContactInputChange('email', e.target.value)}
                                  required
                                  placeholder="your@email.com"
                                />
                              </Form.Group>
                            </Col>
                          )}
                        </Row>
                        <Row>
                          {settings.contactSection.formFields.phone && (
                            <Col md={6} className="mb-3">
                              <Form.Group>
                                <Form.Label>Phone</Form.Label>
                                <Form.Control
                                  type="tel"
                                  value={contactForm.phone}
                                  onChange={(e) => handleContactInputChange('phone', e.target.value)}
                                  placeholder="+1 (555) 123-4567"
                                />
                              </Form.Group>
                            </Col>
                          )}
                          {settings.contactSection.formFields.subject && (
                            <Col md={6} className="mb-3">
                              <Form.Group>
                                <Form.Label>Subject</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={contactForm.subject}
                                  onChange={(e) => handleContactInputChange('subject', e.target.value)}
                                  placeholder="What's this about?"
                                />
                              </Form.Group>
                            </Col>
                          )}
                        </Row>
                        {settings.contactSection.formFields.message && (
                          <Form.Group className="mb-3">
                            <Form.Label>Message *</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={4}
                              value={contactForm.message}
                              onChange={(e) => handleContactInputChange('message', e.target.value)}
                              required
                              placeholder="Tell us how we can help you..."
                            />
                          </Form.Group>
                        )}
                        <div className="d-grid">
                          <Button 
                            variant="primary" 
                            type="submit" 
                            size="lg"
                            disabled={contactSubmitting}
                          >
                            {contactSubmitting ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-paper-plane me-2"></i>
                                Send Message
                              </>
                            )}
                          </Button>
                        </div>
                      </Form>
                    </Card.Body>
                  </Card>
                </Col>
              )}
              {settings.contactSection.showContactInfo && (
                <Col lg={settings.contactSection.showForm ? 4 : 12}>
                  <Card className="shadow-sm h-100">
                    <Card.Header>
                      <h5 className="mb-0">
                        <i className="fas fa-map-marker-alt me-2"></i>
                        Contact Information
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      {settings.footerSection.contactInfo.address && (
                        <div className="mb-3">
                          <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                          <strong>Address:</strong><br />
                          <span className="ms-4">{settings.footerSection.contactInfo.address}</span>
                        </div>
                      )}
                      {settings.footerSection.contactInfo.phone && (
                        <div className="mb-3">
                          <i className="fas fa-phone me-2 text-primary"></i>
                          <strong>Phone:</strong><br />
                          <a href={`tel:${settings.footerSection.contactInfo.phone}`} className="ms-4 text-decoration-none">
                            {settings.footerSection.contactInfo.phone}
                          </a>
                        </div>
                      )}
                      {settings.footerSection.contactInfo.email && (
                        <div className="mb-3">
                          <i className="fas fa-envelope me-2 text-primary"></i>
                          <strong>Email:</strong><br />
                          <a href={`mailto:${settings.footerSection.contactInfo.email}`} className="ms-4 text-decoration-none">
                            {settings.footerSection.contactInfo.email}
                          </a>
                        </div>
                      )}
                      {settings.footerSection.contactInfo.hours && (
                        <div className="mb-3">
                          <i className="fas fa-clock me-2 text-primary"></i>
                          <strong>Hours:</strong><br />
                          <span className="ms-4">{settings.footerSection.contactInfo.hours}</span>
                        </div>
                      )}
                      {settings.socialMedia.whatsapp && (
                        <div className="d-grid mt-4">
                          <Button 
                            variant="success"
                            href={`https://wa.me/${settings.socialMedia.whatsapp}?text=Hi! I'd like to get in touch.`}
                            target="_blank"
                          >
                            <i className="fab fa-whatsapp me-2"></i>
                            WhatsApp Us
                          </Button>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
            {settings.contactSection.showMap && settings.contactSection.mapEmbedCode && (
              <div className="mt-5">
                <Card className="shadow-sm">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="fas fa-map me-2"></i>
                      Find Us
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div 
                      dangerouslySetInnerHTML={{ __html: settings.contactSection.mapEmbedCode }}
                      style={{ width: '100%', height: '300px' }}
                    />
                  </Card.Body>
                </Card>
              </div>
            )}
          </Container>
        </div>
      )}

      {/* Rules Section */}
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
        <Container 
          className="position-relative" 
          style={{ 
            textAlign: settings.rulesSection.textStyle.textAlign,
            maxWidth: '900px'
          }}
        >
          <h3 
            className="mb-4"
            style={{
              color: settings.rulesSection.textStyle.titleColor,
              fontSize: settings.rulesSection.textStyle.titleFontSize,
              fontFamily: settings.rulesSection.textStyle.fontFamily,
              textAlign: settings.rulesSection.textStyle.textAlign
            }}
          >
            {settings.rulesSection.title}
          </h3>
          <Row>
            <Col md={6}>
              {settings.rulesSection.depositRule && (
                <div className="mb-3">
                  <i className="fas fa-credit-card text-success me-2"></i>
                  <span 
                    style={{
                      color: settings.rulesSection.textStyle.textColor,
                      fontSize: settings.rulesSection.textStyle.textFontSize,
                      fontFamily: settings.rulesSection.textStyle.fontFamily
                    }}
                  >
                    {settings.rulesSection.depositRule}
                  </span>
                </div>
              )}
              {settings.rulesSection.latenessRule && (
                <div className="mb-3">
                  <i className="fas fa-clock text-warning me-2"></i>
                  <span 
                    style={{
                      color: settings.rulesSection.textStyle.textColor,
                      fontSize: settings.rulesSection.textStyle.textFontSize,
                      fontFamily: settings.rulesSection.textStyle.fontFamily
                    }}
                  >
                    {settings.rulesSection.latenessRule}
                  </span>
                </div>
              )}
            </Col>
            <Col md={6}>
              {settings.rulesSection.noshowRule && (
                <div className="mb-3">
                  <i className="fas fa-user-times text-danger me-2"></i>
                  <span 
                    style={{
                      color: settings.rulesSection.textStyle.textColor,
                      fontSize: settings.rulesSection.textStyle.textFontSize,
                      fontFamily: settings.rulesSection.textStyle.fontFamily
                    }}
                  >
                    {settings.rulesSection.noshowRule}
                  </span>
                </div>
              )}
              {settings.rulesSection.cancellationRule && (
                <div className="mb-3">
                  <i className="fas fa-ban text-info me-2"></i>
                  <span 
                    style={{
                      color: settings.rulesSection.textStyle.textColor,
                      fontSize: settings.rulesSection.textStyle.textFontSize,
                      fontFamily: settings.rulesSection.textStyle.fontFamily
                    }}
                  >
                    {settings.rulesSection.cancellationRule}
                  </span>
                </div>
              )}
            </Col>
          </Row>
          {settings.rulesSection.additionalRules && (
            <div className="mt-4 pt-3 border-top">
              <p 
                style={{
                  color: settings.rulesSection.textStyle.textColor,
                  fontSize: settings.rulesSection.textStyle.textFontSize,
                  fontFamily: settings.rulesSection.textStyle.fontFamily
                }}
              >
                {settings.rulesSection.additionalRules}
              </p>
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
              <div className="d-flex gap-3 mb-3 flex-wrap">
                {settings.socialMedia.facebook && (
                  <a href={settings.socialMedia.facebook} style={{ color: settings.footerSection.textColor, fontSize: '1.5rem' }} title="Facebook">
                    <i className="fab fa-facebook"></i>
                  </a>
                )}
                {settings.socialMedia.instagram && (
                  <a href={settings.socialMedia.instagram} style={{ color: settings.footerSection.textColor, fontSize: '1.5rem' }} title="Instagram">
                    <i className="fab fa-instagram"></i>
                  </a>
                )}
                {settings.socialMedia.tiktok && (
                  <a href={settings.socialMedia.tiktok} style={{ color: settings.footerSection.textColor, fontSize: '1.5rem' }} title="TikTok">
                    <i className="fab fa-tiktok"></i>
                  </a>
                )}
                {settings.socialMedia.linkedin && (
                  <a href={settings.socialMedia.linkedin} style={{ color: settings.footerSection.textColor, fontSize: '1.5rem' }} title="LinkedIn">
                    <i className="fab fa-linkedin"></i>
                  </a>
                )}
                {settings.socialMedia.whatsapp && (
                  <a href={`https://wa.me/${settings.socialMedia.whatsapp}`} style={{ color: settings.footerSection.textColor, fontSize: '1.5rem' }} title="WhatsApp">
                    <i className="fab fa-whatsapp"></i>
                  </a>
                )}
                {settings.socialMedia.website && (
                  <a href={settings.socialMedia.website} style={{ color: settings.footerSection.textColor, fontSize: '1.5rem' }} title="Website">
                    <i className="fas fa-globe"></i>
                  </a>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Powered by BookIt by Zewo */}
      <div 
        className="py-3 text-center border-top"
        style={{ 
          backgroundColor: '#f8f9fa',
          borderColor: '#e9ecef !important'
        }}
      >
        <div className="container">
          <p className="mb-0 text-muted" style={{ fontSize: '0.85rem' }}>
            Powered by{' '}
            <a 
              href="/"
              className="text-decoration-none"
              style={{ 
                color: '#6c757d', 
                fontWeight: '500',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLAnchorElement
                target.style.color = '#0d6efd'
                target.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLAnchorElement
                target.style.color = '#6c757d'
                target.style.textDecoration = 'none'
              }}
            >
              BookIt by Zewo
            </a>
            {' '}- Professional Booking Management
          </p>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-calendar-alt me-2"></i>
            Book Appointment
            {selectedService && ` - ${selectedService.name}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedService ? (
            <div>
              <div className="mb-4 p-3 bg-light rounded">
                <h5>{selectedService.name}</h5>
                <p className="text-muted mb-2">{selectedService.description}</p>
                <div className="d-flex justify-content-between">
                  <span>Duration: {selectedService.duration_min} minutes</span>
                  <strong>Price: ${(selectedService.price_cents / 100).toFixed(2)}</strong>
                </div>
              </div>
              {business && (
                <TimeSlotPicker
                  businessSlug={business.slug}
                  serviceId={selectedService.id}
                  onSelectSlot={(datetime) => {
                    // Navigate to full booking page with pre-selected service and time
                    window.location.href = `/book/${business.slug}?service=${selectedService.id}&datetime=${encodeURIComponent(datetime)}`
                  }}
                  locale="en"
                />
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p>Choose how you'd like to book your appointment:</p>
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => {
                    setShowBookingModal(false)
                    window.location.href = `/book/${businessSlug}`
                  }}
                >
                  <i className="fas fa-calendar-check me-2"></i>
                  Full Booking Page
                </Button>
                {settings.socialMedia.whatsapp && (
                  <Button 
                    variant="success" 
                    href={`https://wa.me/${settings.socialMedia.whatsapp}?text=Hi! I'd like to book an appointment.`}
                    target="_blank"
                  >
                    <i className="fab fa-whatsapp me-2"></i>
                    Book via WhatsApp
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
            Close
          </Button>
          {!selectedService && (
            <Button 
              variant="primary" 
              onClick={() => window.location.href = `/book/${businessSlug}`}
            >
              Go to Full Booking
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  )
}