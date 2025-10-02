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
  slogan: string
  phone: string
  email: string
  whatsapp_number: string
  about_text: string
  social_facebook: string
  social_instagram: string
  social_twitter: string
  social_tiktok: string
  business_hours: any
  show_business_hours: boolean
  call_to_action_text: string
  hero_overlay_opacity: number
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

  const formatBusinessHours = (hours: any) => {
    if (!hours) return null
    
    const formatTime = (time: string) => {
      const [hour, minute] = time.split(':')
      const hourNum = parseInt(hour)
      const ampm = hourNum >= 12 ? 'PM' : 'AM'
      const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
      return `${displayHour}:${minute} ${ampm}`
    }

    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const dayNames = {
      monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', 
      thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
    }

    return daysOrder.map(day => {
      const dayInfo = hours[day]
      if (!dayInfo) return null
      
      return {
        day: dayNames[day as keyof typeof dayNames],
        closed: dayInfo.closed,
        hours: dayInfo.closed ? 'Closed' : `${formatTime(dayInfo.open)} - ${formatTime(dayInfo.close)}`
      }
    }).filter(Boolean)
  }

  const getSocialLinks = () => {
    if (!business) return []
    
    const links = []
    if (business.social_facebook) links.push({ platform: 'Facebook', url: business.social_facebook, icon: 'fab fa-facebook', color: '#1877f2' })
    if (business.social_instagram) links.push({ platform: 'Instagram', url: business.social_instagram, icon: 'fab fa-instagram', color: '#E4405F' })
    if (business.social_twitter) links.push({ platform: 'Twitter', url: business.social_twitter, icon: 'fab fa-twitter', color: '#1DA1F2' })
    if (business.social_tiktok) links.push({ platform: 'TikTok', url: business.social_tiktok, icon: 'fab fa-tiktok', color: '#000000' })
    
    return links
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
    <div style={customStyles} className="min-vh-100">
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
        .social-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          color: white;
          text-decoration: none;
          transition: transform 0.2s ease;
          margin: 0 8px;
        }
        .social-link:hover {
          transform: scale(1.1);
          color: white;
        }
      `}</style>

      {/* Header */}
      <header className="bg-white shadow-sm sticky-top">
        <Container>
          <div className="d-flex justify-content-between align-items-center py-3">
            <h2 className="mb-0 fw-bold text-primary">{business.name}</h2>
            <div className="d-flex gap-3">
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => window.location.href = `/${business.slug}`}
              >
                <i className="fas fa-home me-1"></i>
                Home
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => router.push(`/book/${business.slug}`)}
              >
                <i className="fas fa-calendar-check me-1"></i>
                Book Now
              </Button>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <main className="flex-grow-1">
        {/* Hero Section - Simple Text Only */}
        <section 
          className="py-5"
          style={{
            backgroundColor: business.primary_color,
            color: 'white',
            minHeight: '50vh'
          }}
        >
          <Container className="h-100">
            <Row className="h-100 align-items-center justify-content-center text-center py-5">
              <Col lg={8}>
                <h1 className="display-4 fw-bold mb-4">
                  {business.hero_title || `Welcome to ${business.name}`}
                </h1>
                {business.slogan && (
                  <p className="h4 mb-4 fw-light" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    "{business.slogan}"
                  </p>
                )}
                <p className="lead mb-4">
                  {business.hero_subtitle || 'Book your appointment in just a few clicks'}
                </p>
                <Button 
                  variant="light" 
                  size="lg" 
                  onClick={() => router.push(`/book/${business.slug}`)}
                  className="px-5 py-3 fs-5"
                  style={{ borderRadius: '50px' }}
                >
                  {business.call_to_action_text || 'Book Now'} →
                </Button>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Services Section */}
        <section className="py-5 bg-light">
          <Container>
            <Row>
              <Col lg={8} className="mx-auto text-center mb-5">
                <h2 className="display-5 fw-bold">Our Services</h2>
                <p className="lead text-muted">Book your appointment today</p>
              </Col>
            </Row>

            <Row>
              {services.length === 0 ? (
                <Col className="text-center">
                  <p className="text-muted mb-4">Services coming soon!</p>
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={() => router.push(`/book/${business.slug}`)}
                  >
                    Book Appointment
                  </Button>
                </Col>
              ) : (
                services.slice(0, 6).map((service) => (
                  <Col md={6} lg={4} key={service.id} className="mb-4">
                    <Card className="h-100 shadow-sm border-0">
                      <Card.Body className="p-4 text-center">
                        <h5 className="fw-bold text-primary mb-2">{service.name}</h5>
                        <p className="text-muted mb-3">{service.description}</p>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <small className="text-muted">
                            <i className="fas fa-clock me-1"></i>
                            {formatDuration(service.duration_min)}
                          </small>
                          <Badge bg="primary" className="fs-6">
                            {formatPrice(service.price_cents)}
                          </Badge>
                        </div>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => router.push(`/book/${business.slug}?service=${service.id}`)}
                          className="w-100"
                        >
                          Book This Service
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
              ))
            )}
          </Row>
        </Container>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <Container>
          <Row className="align-items-start">
            {/* Left side - Contact Info */}
            <Col md={6}>
              <div className="d-flex flex-column">
                {business.email && (
                  <div className="mb-2">
                    <a href={`mailto:${business.email}`} className="text-white text-decoration-none">
                      <i className="fas fa-envelope me-2"></i>
                      {business.email}
                    </a>
                  </div>
                )}
                {business.phone && (
                  <div className="mb-2">
                    <a href={`tel:${business.phone}`} className="text-white text-decoration-none">
                      <i className="fas fa-phone me-2"></i>
                      {business.phone}
                    </a>
                  </div>
                )}
              </div>
            </Col>

            {/* Right side - Site Title and Social Media */}
            <Col md={6} className="text-md-end">
              <h5 className="mb-2">{business.name}</h5>
              {getSocialLinks().length > 0 && (
                <div className="mb-2">
                  {getSocialLinks().map((social, index) => (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link me-2"
                      style={{ backgroundColor: social.color }}
                      title={social.platform}
                    >
                      <i className={social.icon}></i>
                    </a>
                  ))}
                </div>
              )}
              <small className="text-muted">
                Powered by <strong className="text-white">BookIt by Zewo</strong>
              </small>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  )
}