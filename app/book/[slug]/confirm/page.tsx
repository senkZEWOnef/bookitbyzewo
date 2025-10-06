'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Container, Row, Col, Card, Alert, Button, Spinner, Badge } from 'react-bootstrap'
import { format, parseISO } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { createWhatsAppLink, getTemplate } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

interface AppointmentData {
  id: string
  service_name: string
  starts_at: string
  customer_name: string
  customer_phone: string
  customer_locale: string
  business_name: string
  business_location?: string
  deposit_amount?: number
  total_amount?: number
  status: string
}

export default function ConfirmationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const businessSlug = params.slug as string
  const appointmentId = searchParams.get('id')
  const paymentMethod = searchParams.get('payment')
  
  const [appointment, setAppointment] = useState<AppointmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [whatsAppLink, setWhatsAppLink] = useState('')

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment()
    }
  }, [appointmentId])

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Appointment not found')
      }

      setAppointment(data.appointment)
      generateWhatsAppLink(data.appointment)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointment')
    } finally {
      setLoading(false)
    }
  }

  const generateWhatsAppLink = (apt: AppointmentData) => {
    const locale = apt.customer_locale.startsWith('es') ? 'es' : 'en'
    const dateLocale = locale === 'es' ? es : enUS
    
    const formattedDate = format(parseISO(apt.starts_at), 'EEEE, MMMM d', { locale: dateLocale })
    const formattedTime = format(parseISO(apt.starts_at), 'h:mm a')
    
    const rescheduleLink = `${window.location.origin}/book/${businessSlug}/manage?apt=${apt.id}`
    const cancelLink = `${window.location.origin}/book/${businessSlug}/manage?apt=${apt.id}&action=cancel`
    const icsLink = `${window.location.origin}/api/calendar/${apt.id}.ics`

    const message = getTemplate(locale, 'confirmation', {
      name: apt.customer_name,
      service: apt.service_name,
      date: formattedDate,
      time: formattedTime,
      location: apt.business_location || '',
      rescheduleLink,
      cancelLink,
      icsLink
    })

    const link = createWhatsAppLink({
      phone: apt.customer_phone,
      message
    })

    setWhatsAppLink(link)
  }

  const downloadICS = async () => {
    if (!appointment) return
    
    try {
      const response = await fetch(`/api/calendar/${appointment.id}.ics`)
      const icsContent = await response.text()
      
      const blob = new Blob([icsContent], { type: 'text/calendar' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `appointment-${appointment.id}.ics`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download calendar file:', err)
    }
  }

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="mt-2">Loading confirmation...</p>
        </div>
      </Container>
    )
  }

  if (error || !appointment) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Alert variant="danger" className="text-center">
              <h5>Confirmation Not Found</h5>
              <p>{error || 'Unable to load appointment confirmation'}</p>
            </Alert>
          </Col>
        </Row>
      </Container>
    )
  }

  const locale = appointment.customer_locale.startsWith('es') ? 'es' : 'en'
  const dateLocale = locale === 'es' ? es : enUS

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          {/* Success Header */}
          <div className="text-center mb-4">
            <div className="mb-3">
              <i className="fas fa-check-circle fa-4x text-success"></i>
            </div>
            <h2 className="fw-bold text-success">
              {locale === 'es' ? '¡Reserva Confirmada!' : 'Booking Confirmed!'}
            </h2>
            <p className="lead text-muted">
              {locale === 'es' 
                ? 'Tu cita ha sido reservada exitosamente'
                : 'Your appointment has been successfully booked'
              }
            </p>
          </div>

          {/* Payment Status */}
          {paymentMethod && (
            <Alert variant={paymentMethod === 'ath' ? 'warning' : 'success'} className="mb-4">
              {paymentMethod === 'ath' ? (
                <>
                  <strong>
                    {locale === 'es' ? 'Pago Pendiente - ATH Móvil' : 'Payment Pending - ATH Móvil'}
                  </strong>
                  <br />
                  {locale === 'es' 
                    ? 'Por favor envía la referencia de pago por WhatsApp para confirmar tu reserva.'
                    : 'Please send your payment reference via WhatsApp to confirm your booking.'
                  }
                </>
              ) : (
                <>
                  <strong>
                    {locale === 'es' ? 'Pago Confirmado' : 'Payment Confirmed'}
                  </strong>
                  <br />
                  {locale === 'es' 
                    ? 'Tu depósito ha sido procesado exitosamente.'
                    : 'Your deposit has been processed successfully.'
                  }
                </>
              )}
            </Alert>
          )}

          <Card className="mb-4">
            <Card.Body className="p-4">
              <h5 className="mb-4">
                {locale === 'es' ? 'Detalles de la Cita' : 'Appointment Details'}
              </h5>
              
              <Row className="mb-3">
                <Col sm={4} className="text-muted">
                  {locale === 'es' ? 'Servicio:' : 'Service:'}
                </Col>
                <Col sm={8}>
                  <strong>{appointment.service_name}</strong>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col sm={4} className="text-muted">
                  {locale === 'es' ? 'Fecha:' : 'Date:'}
                </Col>
                <Col sm={8}>
                  <strong>
                    {format(parseISO(appointment.starts_at), 'EEEE, MMMM d, yyyy', { locale: dateLocale })}
                  </strong>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col sm={4} className="text-muted">
                  {locale === 'es' ? 'Hora:' : 'Time:'}
                </Col>
                <Col sm={8}>
                  <strong>
                    {format(parseISO(appointment.starts_at), 'h:mm a')}
                  </strong>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col sm={4} className="text-muted">
                  {locale === 'es' ? 'Cliente:' : 'Customer:'}
                </Col>
                <Col sm={8}>
                  <strong>{appointment.customer_name}</strong>
                </Col>
              </Row>

              {appointment.business_location && (
                <Row className="mb-3">
                  <Col sm={4} className="text-muted">
                    {locale === 'es' ? 'Ubicación:' : 'Location:'}
                  </Col>
                  <Col sm={8}>
                    <strong>{appointment.business_location}</strong>
                  </Col>
                </Row>
              )}

              {appointment.deposit_amount && (
                <Row className="mb-3">
                  <Col sm={4} className="text-muted">
                    {locale === 'es' ? 'Depósito:' : 'Deposit:'}
                  </Col>
                  <Col sm={8}>
                    <Badge bg="success">
                      ${(appointment.deposit_amount / 100).toFixed(2)}
                    </Badge>
                  </Col>
                </Row>
              )}

              <Row className="mb-3">
                <Col sm={4} className="text-muted">
                  {locale === 'es' ? 'Estado:' : 'Status:'}
                </Col>
                <Col sm={8}>
                  <Badge bg={appointment.status === 'confirmed' ? 'success' : 'warning'}>
                    {appointment.status === 'confirmed' 
                      ? (locale === 'es' ? 'Confirmada' : 'Confirmed')
                      : (locale === 'es' ? 'Pendiente' : 'Pending')
                    }
                  </Badge>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Action Buttons */}
          <div className="d-grid gap-3">
            {/* WhatsApp Button */}
            <Button 
              variant="success" 
              size="lg"
              href={whatsAppLink}
              target="_blank"
              className="d-flex align-items-center justify-content-center"
            >
              <i className="fab fa-whatsapp me-2"></i>
              {locale === 'es' ? 'Abrir WhatsApp' : 'Open WhatsApp'}
            </Button>

            {/* Calendar Download */}
            <Button 
              variant="outline-primary" 
              onClick={downloadICS}
              className="d-flex align-items-center justify-content-center"
            >
              <i className="fas fa-calendar-plus me-2"></i>
              {locale === 'es' ? 'Agregar al Calendario' : 'Add to Calendar'}
            </Button>

            {/* Manage Appointment */}
            <Button 
              variant="outline-secondary"
              href={`/book/${businessSlug}/manage?apt=${appointment.id}`}
              className="d-flex align-items-center justify-content-center"
            >
              <i className="fas fa-edit me-2"></i>
              {locale === 'es' ? 'Administrar Cita' : 'Manage Appointment'}
            </Button>
          </div>

          {/* What's Next */}
          <Card className="mt-4 border-0 bg-light">
            <Card.Body>
              <h6 className="fw-bold mb-3">
                {locale === 'es' ? '¿Qué sigue?' : "What's next?"}
              </h6>
              <ul className="mb-0">
                <li className="mb-2">
                  {locale === 'es' 
                    ? 'Recibirás un recordatorio 24 horas antes de tu cita'
                    : "You'll receive a reminder 24 hours before your appointment"
                  }
                </li>
                <li className="mb-2">
                  {locale === 'es' 
                    ? 'Otro recordatorio 2 horas antes de la hora programada'
                    : "Another reminder 2 hours before your scheduled time"
                  }
                </li>
                <li className="mb-2">
                  {locale === 'es' 
                    ? 'Puedes reprogramar o cancelar usando los enlaces en WhatsApp'
                    : "You can reschedule or cancel using the links in WhatsApp"
                  }
                </li>
                <li>
                  {locale === 'es' 
                    ? 'Si tienes preguntas, responde al mensaje de WhatsApp'
                    : "If you have questions, reply to the WhatsApp message"
                  }
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}