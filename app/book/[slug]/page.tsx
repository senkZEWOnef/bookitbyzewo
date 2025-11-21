'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap'
import ServiceCard from '@/components/ServiceCard'
import MonthlyCalendar from '@/components/MonthlyCalendar'
import TimeSlotPicker from '@/components/TimeSlotPicker'
import ATHMovilPayment from '@/components/ATHMovilPayment'
import StripePayment from '@/components/StripePayment'
import { Service, Business } from '@/types/database'

export const dynamic = 'force-dynamic'

interface BookingData {
  serviceId: string
  staffId?: string
  datetime: string
  customerName: string
  customerPhone: string
  customerLocale: string
  paymentData?: any
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const businessSlug = params.slug as string
  
  const [step, setStep] = useState<'service' | 'time' | 'details' | 'payment'>('service')
  const [pendingBooking, setPendingBooking] = useState<any>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'ath' | 'stripe' | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    locale: 'es-PR'
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedSlot('') // Reset slot when date changes
  }

  const handleSlotSelect = (datetime: string) => {
    setSelectedSlot(datetime)
  }

  const handleContinueToDetails = () => {
    if (!selectedSlot) {
      setError(locale === 'es' ? 'Selecciona una fecha y hora' : 'Please select a date and time')
      return
    }
    setStep('details')
  }

  const handleSubmitBooking = async () => {
    if (!selectedService || !selectedSlot || !customerData.name || !customerData.phone) {
      setError(locale === 'es' ? 'Completa todos los campos' : 'Please fill all required fields')
      return
    }

    // If deposit required and payment methods enabled, go to payment step
    if ((selectedService?.deposit_cents ?? 0) > 0 && (business?.ath_movil_enabled || business?.stripe_enabled)) {
      const bookingData: BookingData = {
        serviceId: selectedService.id,
        staffId: selectedStaff || undefined,
        datetime: selectedSlot,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerLocale: customerData.locale
      }
      setPendingBooking(bookingData)
      setStep('payment')
      return
    }

    // Otherwise, submit booking directly
    await submitBooking()
  }

  const submitBooking = async (paymentData?: any) => {
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
        customerLocale: customerData.locale,
        paymentData
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

      // Redirect to confirmation
      if (paymentData) {
        router.push(`/book/${businessSlug}/confirm?id=${result.appointmentId}&payment=ath`)
      } else if ((selectedService?.deposit_cents ?? 0) > 0) {
        if (result.stripeUrl) {
          window.location.href = result.stripeUrl
        } else {
          router.push(`/book/${businessSlug}/confirm?id=${result.appointmentId}&payment=pending`)
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

  const handlePaymentSuccess = async (paymentResponse: any) => {
    console.log('Payment successful:', paymentResponse)
    await submitBooking(paymentResponse)
  }

  const handlePaymentCancel = () => {
    setError(locale === 'es' ? 'Pago cancelado' : 'Payment cancelled')
  }

  const handlePaymentExpired = () => {
    setError(locale === 'es' ? 'Sesión de pago expirada' : 'Payment session expired')
  }

  const handlePaymentError = (error: string) => {
    setError(error)
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

  return (
    <Container className="py-3 py-md-4" style={{ marginTop: '80px' }}>
      <Row className="justify-content-center">
        <Col xs={12} lg={8}>
          {/* Header */}
          <div className="text-center mb-3 mb-md-4">
            <h2 className="fw-bold fs-3 fs-md-2">{business?.name}</h2>
            <p className="text-muted mb-0">
              {locale === 'es' ? 'Reserva tu cita' : 'Book your appointment'}
            </p>
          </div>

          {/* Demo Banner */}
          {businessSlug === 'demo' && (
            <Alert variant="info" className="mb-3 mb-md-4 border-0 shadow-sm">
              <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center">
                <div className="me-0 me-md-3 mb-2 mb-md-0">
                  <i className="fas fa-play-circle fa-2x text-primary"></i>
                </div>
                <div>
                  <h6 className="mb-1 fs-6">
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
          <div className="d-flex flex-wrap justify-content-center mb-3 mb-md-4 gap-2">
            {[
              { key: 'service', label: locale === 'es' ? 'Servicio' : 'Service' },
              { key: 'time', label: locale === 'es' ? 'Horario' : 'Time' },
              { key: 'details', label: locale === 'es' ? 'Detalles' : 'Details' },
              ...(((selectedService?.deposit_cents ?? 0) > 0 && (business?.ath_movil_enabled || business?.stripe_enabled)) ? 
                [{ key: 'payment', label: locale === 'es' ? 'Pago' : 'Payment' }] : [])
            ].map((stepInfo, index, array) => (
              <div key={stepInfo.key} className="d-flex align-items-center">
                <Badge 
                  bg={step === stepInfo.key ? 'success' : 'secondary'}
                  className="rounded-circle p-2"
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {index + 1}
                </Badge>
                <span className={`ms-2 small ${step === stepInfo.key ? 'fw-bold' : 'text-muted'}`}>
                  {stepInfo.label}
                </span>
                {index < array.length - 1 && <span className="mx-2 mx-md-3 text-muted d-none d-sm-inline">→</span>}
              </div>
            ))}
          </div>

          {error && (
            <Alert variant="danger" className="mb-4" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Card className="border-0 shadow">
            <Card.Body className="p-3 p-md-4">
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
                      {locale === 'es' ? 'Selecciona fecha y hora' : 'Choose date and time'}
                    </h5>
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => setStep('service')}
                    >
                      ← {locale === 'es' ? 'Cambiar servicio' : 'Change service'}
                    </Button>
                  </div>

                  <div className="mb-3 mb-md-4 p-3 bg-light rounded">
                    <strong className="d-block">{selectedService.name}</strong>
                    <div className="small text-muted mt-1 d-flex flex-wrap gap-2">
                      <span><i className="fas fa-clock me-1"></i>{selectedService.duration_min} min</span>
                      <span><i className="fas fa-dollar-sign me-1"></i>{formatPrice(selectedService.price_cents)}</span>
                      {(selectedService?.deposit_cents ?? 0) > 0 && (
                        <span><i className="fas fa-credit-card me-1"></i>{locale === 'es' ? 'Depósito' : 'Deposit'} {formatPrice(selectedService?.deposit_cents ?? 0)}</span>
                      )}
                    </div>
                  </div>

                  {/* Calendar for date selection */}
                  <div className="mb-3 mb-md-4">
                    <h6 className="mb-3 fs-6">
                      <span className="badge bg-primary me-2">1</span>
                      {locale === 'es' ? 'Selecciona una fecha' : 'Select a date'}
                    </h6>
                    <div className="calendar-container">
                      <MonthlyCalendar
                        businessId={business?.id || ''}
                        staffId={selectedStaff}
                        onDateSelect={handleDateSelect}
                        readOnly={false}
                        publicView={true}
                      />
                    </div>
                  </div>

                  {/* Time slots for selected date */}
                  {selectedDate && (
                    <div className="mb-3 mb-md-4">
                      <h6 className="mb-3 fs-6">
                        <span className="badge bg-primary me-2">2</span>
                        {locale === 'es' ? 'Selecciona una hora' : 'Select a time'}
                        <div className="text-muted mt-1 small">
                          <i className="fas fa-calendar-day me-1"></i>
                          {new Date(selectedDate).toLocaleDateString(locale === 'es' ? 'es-PR' : 'en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </h6>
                      <TimeSlotPicker
                        businessSlug={businessSlug}
                        serviceId={selectedService.id}
                        staffId={selectedStaff}
                        onSelectSlot={handleSlotSelect}
                        selectedSlot={selectedSlot}
                        locale={locale}
                        selectedDate={selectedDate}
                      />
                    </div>
                  )}

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

              {/* Step 4: Payment */}
              {step === 'payment' && selectedService && business && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">
                      {locale === 'es' ? 'Pagar depósito' : 'Pay deposit'}
                    </h5>
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => setStep('details')}
                    >
                      ← {locale === 'es' ? 'Volver' : 'Back'}
                    </Button>
                  </div>

                  {/* Booking Summary */}
                  <div className="mb-4 p-3 bg-light rounded">
                    <h6 className="fw-bold mb-3">
                      {locale === 'es' ? 'Resumen de reserva' : 'Booking summary'}
                    </h6>
                    <div className="mb-2">
                      <strong>{selectedService.name}</strong>
                    </div>
                    <div className="mb-2 text-muted">
                      {selectedSlot && new Date(selectedSlot).toLocaleDateString(locale === 'es' ? 'es-PR' : 'en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="mb-2 text-muted">
                      {customerData.name} • {customerData.phone}
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between">
                      <span>{locale === 'es' ? 'Depósito requerido:' : 'Required deposit:'}</span>
                      <strong>{formatPrice(selectedService.deposit_cents || 0)}</strong>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  {!selectedPaymentMethod && (business.ath_movil_enabled && business.stripe_enabled) && (
                    <div className="mb-4">
                      <h6 className="mb-3 fs-6">
                        {locale === 'es' ? 'Selecciona método de pago' : 'Choose payment method'}
                      </h6>
                      <Row className="g-2 g-md-3">
                        {business.ath_movil_enabled && (
                          <Col xs={12} md={6}>
                            <Card 
                              className="h-100 border-2 payment-method-card"
                              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                              onClick={() => setSelectedPaymentMethod('ath')}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = ''
                              }}
                            >
                              <Card.Body className="text-center p-3 p-md-4">
                                <div 
                                  className="mb-2 mb-md-3 mx-auto"
                                  style={{
                                    width: '50px',
                                    height: '50px',
                                    backgroundColor: '#ff6b35',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '14px'
                                  }}
                                >
                                  ATH
                                </div>
                                <h6 className="mb-2 fs-6">ATH Móvil</h6>
                                <small className="text-muted">
                                  {locale === 'es' 
                                    ? 'Paga con tu app ATH Móvil' 
                                    : 'Pay with your ATH Móvil app'}
                                </small>
                              </Card.Body>
                            </Card>
                          </Col>
                        )}
                        {business.stripe_enabled && (
                          <Col xs={12} md={6}>
                            <Card 
                              className="h-100 border-2 payment-method-card"
                              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                              onClick={() => setSelectedPaymentMethod('stripe')}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = ''
                              }}
                            >
                              <Card.Body className="text-center p-3 p-md-4">
                                <div 
                                  className="mb-2 mb-md-3 mx-auto"
                                  style={{
                                    width: '50px',
                                    height: '50px',
                                    backgroundColor: '#635BFF',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '20px'
                                  }}
                                >
                                  <i className="fas fa-credit-card"></i>
                                </div>
                                <h6 className="mb-2 fs-6">
                                  {locale === 'es' ? 'Tarjeta' : 'Credit/Debit Card'}
                                </h6>
                                <small className="text-muted">
                                  {locale === 'es' 
                                    ? 'Visa, Mastercard, Amex' 
                                    : 'Visa, Mastercard, Amex'}
                                </small>
                              </Card.Body>
                            </Card>
                          </Col>
                        )}
                      </Row>
                    </div>
                  )}

                  {/* ATH Móvil Payment */}
                  {(selectedPaymentMethod === 'ath' || (!selectedPaymentMethod && business.ath_movil_enabled && !business.stripe_enabled)) && business.ath_movil_enabled && (
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">ATH Móvil Payment</h6>
                        <Button 
                          variant="link" 
                          size="sm"
                          onClick={() => setSelectedPaymentMethod(null)}
                        >
                          ← {locale === 'es' ? 'Cambiar método' : 'Change method'}
                        </Button>
                      </div>
                      <ATHMovilPayment
                        amount={(selectedService.deposit_cents || 0) / 100}
                        description={`${locale === 'es' ? 'Depósito para' : 'Deposit for'} ${selectedService.name}`}
                        publicToken={business.ath_movil_public_token || ''}
                        onSuccess={handlePaymentSuccess}
                        onCancel={handlePaymentCancel}
                        onExpired={handlePaymentExpired}
                        onError={handlePaymentError}
                        disabled={submitting}
                        clientName={customerData.name}
                        appointmentId={`booking-${Date.now()}`}
                      />
                    </div>
                  )}

                  {/* Stripe Payment */}
                  {(selectedPaymentMethod === 'stripe' || (!selectedPaymentMethod && business.stripe_enabled && !business.ath_movil_enabled)) && business.stripe_enabled && (
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">
                          {locale === 'es' ? 'Pago con Tarjeta' : 'Card Payment'}
                        </h6>
                        <Button 
                          variant="link" 
                          size="sm"
                          onClick={() => setSelectedPaymentMethod(null)}
                        >
                          ← {locale === 'es' ? 'Cambiar método' : 'Change method'}
                        </Button>
                      </div>
                      <StripePayment
                        amount={(selectedService.deposit_cents || 0) / 100}
                        description={`${locale === 'es' ? 'Depósito para' : 'Deposit for'} ${selectedService.name}`}
                        publishableKey={business.stripe_publishable_key || ''}
                        onSuccess={handlePaymentSuccess}
                        onCancel={() => setSelectedPaymentMethod(null)}
                        onError={handlePaymentError}
                        disabled={submitting}
                        clientName={customerData.name}
                        appointmentId={`booking-${Date.now()}`}
                        businessSlug={businessSlug}
                      />
                    </div>
                  )}

                  {/* Alternative Payment Notice */}
                  <div className="mt-4 p-3 border rounded bg-light">
                    <small className="text-muted">
                      <i className="fas fa-info-circle me-2"></i>
                      {locale === 'es' 
                        ? 'Si prefieres pagar en efectivo o tienes problemas con el pago, puedes reservar sin depósito y coordinar el pago directamente con el negocio.'
                        : 'If you prefer to pay cash or have payment issues, you can book without deposit and coordinate payment directly with the business.'
                      }
                    </small>
                    <div className="mt-2">
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => submitBooking()}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            {locale === 'es' ? 'Reservando...' : 'Booking...'}
                          </>
                        ) : (
                          locale === 'es' ? 'Reservar sin depósito' : 'Book without deposit'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}