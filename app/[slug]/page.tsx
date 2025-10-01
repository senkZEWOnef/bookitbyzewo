'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Row, Col, Card, Button, Badge, Modal } from 'react-bootstrap'
import { supabase } from '@/lib/supabase'

interface Business {
  id: string
  name: string
  slug: string
  location: string
  timezone: string
  logo_url: string
  primary_color: string
  secondary_color: string
  has_hero_section: boolean
  hero_title: string
  hero_subtitle: string
  hero_image_url: string
  branding_completed: boolean
}

interface Service {
  id: string
  name: string
  description: string
  duration_min: number
  price_cents: number
  deposit_cents: number
}

export default function BusinessLandingPage() {
  const { slug } = useParams()
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showServiceModal, setShowServiceModal] = useState(false)

  useEffect(() => {
    if (slug) {
      loadBusinessData()
    }
  }, [slug])

  const loadBusinessData = async () => {
    try {
      // Load business data
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', slug)
        .single()

      if (businessError || !businessData) {
        setError('Business not found')
        setLoading(false)
        return
      }

      setBusiness(businessData)

      // If branding not completed, redirect to basic booking
      if (!businessData.branding_completed) {
        router.push(`/book/${businessData.slug}`)
        return
      }

      // Load services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessData.id)
        .order('price_cents', { ascending: true })

      if (!servicesError && servicesData) {
        setServices(servicesData)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading business:', err)
      setError('Failed to load business information')
      setLoading(false)
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setShowServiceModal(true)
  }

  const handleBookService = () => {
    if (selectedService && business) {
      // Redirect to the existing booking flow with the selected service
      router.push(`/book/${business.slug}?service=${selectedService.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <h3 className="text-muted">Business Not Found</h3>
          <p>The business you're looking for doesn't exist or is not available.</p>
        </div>
      </div>
    )
  }

  const customStyles = {
    '--primary-color': business.primary_color || '#007bff',
    '--secondary-color': business.secondary_color || '#6c757d',
  } as React.CSSProperties

  return (
    <div style={customStyles}>
      <style jsx global>{`
        .btn-primary {
          background-color: var(--primary-color) !important;
          border-color: var(--primary-color) !important;
        }
        .btn-primary:hover {
          background-color: var(--primary-color) !important;
          border-color: var(--primary-color) !important;
          opacity: 0.9;
        }
        .text-primary {
          color: var(--primary-color) !important;
        }
        .border-primary {
          border-color: var(--primary-color) !important;
        }
        .bg-primary {
          background-color: var(--primary-color) !important;
        }
      `}</style>

      {/* Hero Section */}
      {business.has_hero_section && (
        <div 
          className="hero-section position-relative"
          style={{
            backgroundColor: business.primary_color,
            backgroundImage: business.hero_image_url ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${business.hero_image_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '70vh',
            color: 'white'
          }}
        >
          <Container className="h-100">
            <Row className="h-100 align-items-center text-center py-5" style={{ minHeight: '70vh' }}>
              <Col>
                {business.logo_url && (
                  <img 
                    src={business.logo_url} 
                    alt={business.name}
                    style={{ maxHeight: '100px', marginBottom: '30px' }}
                    className="mb-4"
                  />
                )}
                <h1 className="display-3 fw-bold mb-4">
                  {business.hero_title || `Welcome to ${business.name}`}
                </h1>
                <p className="lead mb-5 fs-4">
                  {business.hero_subtitle || 'Book your appointment in just a few clicks'}
                </p>
                <Button 
                  variant="light" 
                  size="lg" 
                  onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-5 py-3 fs-5"
                  style={{ borderRadius: '50px' }}
                >
                  Book Now →
                </Button>
              </Col>
            </Row>
          </Container>
        </div>
      )}

      {/* Business Header (if no hero section) */}
      {!business.has_hero_section && (
        <div className="bg-primary text-white py-5">
          <Container>
            <Row className="align-items-center text-center py-4">
              <Col>
                {business.logo_url && (
                  <img 
                    src={business.logo_url} 
                    alt={business.name}
                    style={{ maxHeight: '80px' }}
                    className="mb-3"
                  />
                )}
                <h1 className="display-4 fw-bold">{business.name}</h1>
                {business.location && (
                  <p className="lead mt-3">
                    <i className="fas fa-map-marker-alt me-2"></i>
                    {business.location}
                  </p>
                )}
                <Button 
                  variant="light" 
                  size="lg" 
                  onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                  className="mt-3 px-4 py-2"
                >
                  Book Now
                </Button>
              </Col>
            </Row>
          </Container>
        </div>
      )}

      {/* Services Section */}
      <section id="services" className="py-5 bg-light">
        <Container>
          <Row>
            <Col lg={8} className="mx-auto text-center mb-5">
              <h2 className="display-5 fw-bold">Our Services</h2>
              <p className="lead text-muted">Choose a service to book your appointment</p>
            </Col>
          </Row>

          <Row>
            {services.length === 0 ? (
              <Col className="text-center">
                <p className="text-muted">No services available at the moment.</p>
              </Col>
            ) : (
              services.map((service) => (
                <Col md={6} lg={4} key={service.id} className="mb-4">
                  <Card 
                    className="h-100 shadow-sm border-0 service-card"
                    style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                    onClick={() => handleServiceSelect(service)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-10px)'
                      e.currentTarget.style.boxShadow = '0 1rem 2rem rgba(0,0,0,0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0,0,0,0.075)'
                    }}
                  >
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="fw-bold text-primary mb-0">{service.name}</h5>
                        <Badge 
                          style={{ backgroundColor: business.primary_color }} 
                          className="fs-6 px-3 py-2"
                        >
                          {formatPrice(service.price_cents)}
                        </Badge>
                      </div>
                      
                      {service.description && (
                        <p className="text-muted mb-4">{service.description}</p>
                      )}
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className="fas fa-clock me-1"></i>
                          {formatDuration(service.duration_min)}
                        </small>
                        {service.deposit_cents > 0 && (
                          <small className="text-muted">
                            Deposit: {formatPrice(service.deposit_cents)}
                          </small>
                        )}
                      </div>
                      
                      <div className="text-center mt-3">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          style={{ borderRadius: '25px' }}
                        >
                          Select Service
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </Container>
      </section>

      {/* About Section */}
      <section className="py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h3 className="fw-bold text-primary mb-4">About {business.name}</h3>
              <p className="lead text-muted mb-4">
                We provide professional services with a focus on quality and customer satisfaction. 
                Book your appointment today and experience the difference.
              </p>
              {business.location && (
                <div className="d-flex align-items-center mb-3">
                  <i className="fas fa-map-marker-alt text-primary me-3"></i>
                  <span>{business.location}</span>
                </div>
              )}
              <div className="d-flex align-items-center">
                <i className="fas fa-mobile-alt text-primary me-3"></i>
                <span>Easy WhatsApp booking & confirmations</span>
              </div>
            </Col>
            <Col md={6} className="text-center">
              {business.hero_image_url && (
                <img 
                  src={business.hero_image_url} 
                  alt="About us"
                  className="img-fluid rounded shadow"
                  style={{ maxHeight: '400px' }}
                />
              )}
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h5 className="fw-bold">{business.name}</h5>
              {business.location && (
                <p className="mb-2 text-muted">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  {business.location}
                </p>
              )}
            </Col>
            <Col md={6} className="text-md-end">
              <p className="mb-0 text-muted">
                Powered by <strong>BookIt by Zewo</strong>
              </p>
              <small className="text-muted">Professional booking system</small>
            </Col>
          </Row>
        </Container>
      </footer>

      {/* Service Selection Modal */}
      <Modal show={showServiceModal} onHide={() => setShowServiceModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ borderColor: business.primary_color }}>
          <Modal.Title className="text-primary">Book {selectedService?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedService && (
            <div>
              <div className="text-center mb-4">
                <h3 className="text-primary fw-bold mb-2">
                  {formatPrice(selectedService.price_cents)}
                </h3>
                <p className="text-muted mb-0">
                  <i className="fas fa-clock me-2"></i>
                  {formatDuration(selectedService.duration_min)}
                </p>
              </div>

              {selectedService.description && (
                <div className="mb-4">
                  <h6 className="fw-bold">About this service:</h6>
                  <p className="text-muted">{selectedService.description}</p>
                </div>
              )}

              {selectedService.deposit_cents > 0 && (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  A deposit of {formatPrice(selectedService.deposit_cents)} is required to secure your booking.
                </div>
              )}

              <div className="text-center">
                <p className="text-muted mb-4">
                  <i className="fas fa-mobile-alt me-2"></i>
                  You'll receive booking confirmation via WhatsApp
                </p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="outline-secondary" onClick={() => setShowServiceModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleBookService}
            size="lg"
            className="px-4"
          >
            Continue to Book →
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}