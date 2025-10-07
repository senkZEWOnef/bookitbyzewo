'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap'
import ServiceCard from '@/components/ServiceCard'
import TimeSlotPicker from '@/components/TimeSlotPicker'
import { Service, Business } from '@/types/database'

export const dynamic = 'force-dynamic'

interface BookingData {
  serviceId: string
  staffId?: string
  datetime: string
  customerName: string
  customerPhone: string
  customerLocale: string
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const businessSlug = params.slug as string
  
  const [step, setStep] = useState<'service' | 'time' | 'details' | 'payment'>('service')
  const [business, setBusiness] = useState<Business | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    locale: 'es-PR'
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [webpageSettings, setWebpageSettings] = useState<any>(null)

  const locale = customerData.locale.startsWith('es') ? 'es' : 'en'

  useEffect(() => {
    fetchBusinessData()
  }, [businessSlug])

  const fetchBusinessData = async () => {
    try {
      const response = await fetch(`/api/business/${businessSlug}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Business not found')
      }

      setBusiness(data.business)
      setServices(data.services || [])
      setWebpageSettings(data.business?.webpage_settings || {})
      
      // Auto-select service if only one
      if ((data.services?.length ?? 0) === 1) {
        setSelectedService(data.services[0])
        setStep('time')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business')
    } finally {
      setLoading(false)
    }
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setStep('time')
  }

  const handleSlotSelect = (datetime: string) => {
    setSelectedSlot(datetime)
  }

  const handleContinueToDetails = () => {
    if (!selectedSlot) {
      setError(locale === 'es' ? 'Selecciona un horario' : 'Please select a time slot')
      return
    }
    setStep('details')
  }

  const handleSubmitBooking = async () => {
    if (!selectedService || !selectedSlot || !customerData.name || !customerData.phone) {
      setError(locale === 'es' ? 'Completa todos los campos' : 'Please fill all required fields')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const bookingData: BookingData = {
        serviceId: selectedService.id,
        staffId: selectedStaff || undefined,
        datetime: selectedSlot,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerLocale: customerData.locale
      }

      const response = await fetch(`/api/book/${businessSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Booking failed')
      }

      // If deposit required, redirect to payment
      if ((selectedService?.deposit_cents ?? 0) > 0) {
        if (result.stripeUrl) {
          window.location.href = result.stripeUrl
        } else {
          router.push(`/book/${businessSlug}/confirm?id=${result.appointmentId}&payment=ath`)
        }
      } else {
        router.push(`/book/${businessSlug}/confirm?id=${result.appointmentId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setSubmitting(false)
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
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="mt-2">Loading...</p>
        </div>
      </Container>
    )
  }

  if (error && !business) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Alert variant="danger" className="text-center">
              <h5>Business Not Found</h5>
              <p>{error}</p>
            </Alert>
          </Col>
        </Row>
      </Container>
    )
  }

  const heroSettings = webpageSettings || {}
  const socialMedia = webpageSettings?.socialMedia || {}

  return (
    <div>
      {/* Hero Section */}
      <div
        className="text-white d-flex align-items-center justify-content-center"
        style={{
          minHeight: '400px',
          backgroundColor: heroSettings.heroBackgroundColor || '#10b981',
          backgroundImage: heroSettings.heroBackgroundImage ? `url(${heroSettings.heroBackgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}
      >
        {heroSettings.heroBackgroundImage && (
          <div 
            className="position-absolute w-100 h-100" 
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          />
        )}
        <Container className="position-relative text-center">
          <h1 className="display-4 fw-bold mb-3">
            {heroSettings.heroTitle || (locale === 'es' ? 'Reserva tu cita' : 'Book Your Appointment')}
          </h1>
          <p className="lead mb-4">
            {heroSettings.heroSubtitle || (locale === 'es' ? 'Servicios profesionales a tu conveniencia' : 'Professional services at your convenience')}
          </p>
          <h2 className="fw-bold">{business?.name}</h2>
        </Container>
      </div>

      <Container className="py-4">
        <Row className="justify-content-center">
          <Col lg={8}>

          {/* Demo Banner */}
          {businessSlug === 'demo' && (
            <Alert variant="info" className="mb-4 border-0 shadow-sm">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <i className="fas fa-play-circle fa-2x text-primary"></i>
                </div>
                <div>
                  <h6 className="mb-1">
                    <i className="fas fa-magic me-2"></i>
                    {locale === 'es' ? '¡Esta es una demostración!' : 'This is a live demo!'}
                  </h6>
                  <p className="mb-0 small">
                    {locale === 'es' 
                      ? 'Explora cómo funciona nuestro sistema de reservas por WhatsApp. Todos los servicios y horarios son reales.' 
                      : 'Explore how our WhatsApp booking system works. All services and time slots are real examples.'
                    }
                  </p>
                </div>
              </div>
            </Alert>
          )}

          {/* Progress Steps */}
          <div className="d-flex justify-content-center mb-4">
            {[
              { key: 'service', label: locale === 'es' ? 'Servicio' : 'Service' },
              { key: 'time', label: locale === 'es' ? 'Horario' : 'Time' },
              { key: 'details', label: locale === 'es' ? 'Detalles' : 'Details' }
            ].map((stepInfo, index) => (
              <div key={stepInfo.key} className="d-flex align-items-center">
                <Badge 
                  bg={step === stepInfo.key ? 'success' : 'secondary'}
                  className="rounded-circle p-2"
                >
                  {index + 1}
                </Badge>
                <span className={`ms-2 ${step === stepInfo.key ? 'fw-bold' : 'text-muted'}`}>
                  {stepInfo.label}
                </span>
                {index < 2 && <span className="mx-3 text-muted">→</span>}
              </div>
            ))}
          </div>

          {error && (
            <Alert variant="danger" className="mb-4" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Card>
            <Card.Body className="p-4">
              {/* Step 1: Service Selection */}
              {step === 'service' && (
                <div>
                  <h5 className="mb-4">
                    {locale === 'es' ? 'Selecciona un servicio' : 'Choose a service'}
                  </h5>
                  {services.map(service => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onSelect={handleServiceSelect}
                      isSelected={selectedService?.id === service.id}
                      locale={locale}
                    />
                  ))}
                </div>
              )}

              {/* Step 2: Time Selection */}
              {step === 'time' && selectedService && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">
                      {locale === 'es' ? 'Selecciona horario' : 'Choose time'}
                    </h5>
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => setStep('service')}
                    >
                      ← {locale === 'es' ? 'Cambiar servicio' : 'Change service'}
                    </Button>
                  </div>

                  <div className="mb-4 p-3 bg-light rounded">
                    <strong>{selectedService.name}</strong>
                    <div className="small text-muted mt-1">
                      {selectedService.duration_min} min • {formatPrice(selectedService.price_cents)}
                      {(selectedService?.deposit_cents ?? 0) > 0 && (
                        <> • {locale === 'es' ? 'Depósito' : 'Deposit'} {formatPrice(selectedService?.deposit_cents ?? 0)}</>
                      )}
                    </div>
                  </div>

                  <TimeSlotPicker
                    businessSlug={businessSlug}
                    serviceId={selectedService.id}
                    staffId={selectedStaff}
                    onSelectSlot={handleSlotSelect}
                    selectedSlot={selectedSlot}
                    locale={locale}
                  />

                  {selectedSlot && (
                    <div className="text-end mt-4">
                      <Button variant="success" onClick={handleContinueToDetails}>
                        {locale === 'es' ? 'Continuar' : 'Continue'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Customer Details */}
              {step === 'details' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">
                      {locale === 'es' ? 'Tus datos' : 'Your information'}
                    </h5>
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => setStep('time')}
                    >
                      ← {locale === 'es' ? 'Cambiar horario' : 'Change time'}
                    </Button>
                  </div>

                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {locale === 'es' ? 'Nombre completo' : 'Full name'} *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={customerData.name}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={locale === 'es' ? 'Tu nombre' : 'Your name'}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        {locale === 'es' ? 'Número de WhatsApp' : 'WhatsApp number'} *
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        value={customerData.phone}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 787 555 0123"
                        required
                      />
                      <Form.Text className="text-muted">
                        {locale === 'es' 
                          ? 'Usaremos este número para enviarte confirmaciones y recordatorios'
                          : 'We\'ll use this number to send confirmations and reminders'
                        }
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>
                        {locale === 'es' ? 'Idioma preferido' : 'Preferred language'}
                      </Form.Label>
                      <Form.Select
                        value={customerData.locale}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, locale: e.target.value }))}
                      >
                        <option value="es-PR">Español</option>
                        <option value="en-US">English</option>
                      </Form.Select>
                    </Form.Group>

                    <div className="text-end">
                      <Button 
                        variant="success" 
                        onClick={handleSubmitBooking}
                        disabled={submitting || !customerData.name || !customerData.phone}
                      >
                        {submitting ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            {locale === 'es' ? 'Reservando...' : 'Booking...'}
                          </>
                        ) : (selectedService?.deposit_cents ?? 0) > 0 ? (
                          locale === 'es' ? 'Continuar al pago' : 'Continue to payment'
                        ) : (
                          locale === 'es' ? 'Confirmar reserva' : 'Confirm booking'
                        )}
                      </Button>
                    </div>
                  </Form>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>

    {/* Footer */}
    <footer className="bg-dark text-white py-4 mt-5">
      <Container>
        <Row>
          <Col md={6}>
            <h5>{heroSettings.businessName || business?.name}</h5>
            <p className="mb-0">
              {heroSettings.businessDescription || business?.description || 
                (locale === 'es' ? 'Reservas profesionales hechas fácil' : 'Professional booking made easy')}
            </p>
          </Col>
          <Col md={6}>
            <h6>{locale === 'es' ? 'Síguenos' : 'Follow Us'}</h6>
            <div className="d-flex gap-3">
              {socialMedia.facebook && (
                <a href={socialMedia.facebook} className="text-white" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-facebook fa-lg"></i>
                </a>
              )}
              {socialMedia.instagram && (
                <a href={socialMedia.instagram} className="text-white" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram fa-lg"></i>
                </a>
              )}
              {socialMedia.whatsapp && (
                <a href={`https://wa.me/${socialMedia.whatsapp}`} className="text-white" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-whatsapp fa-lg"></i>
                </a>
              )}
              {socialMedia.website && (
                <a href={socialMedia.website} className="text-white" target="_blank" rel="noopener noreferrer">
                  <i className="fas fa-globe fa-lg"></i>
                </a>
              )}
            </div>
            <p className="mt-3 mb-0 small text-muted">
              Powered by <strong>BookIt by Zewo</strong>
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  </div>
  )
}