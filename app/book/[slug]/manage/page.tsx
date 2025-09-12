'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Container, Row, Col, Card, Alert, Button, Spinner, Badge, Modal, Form } from 'react-bootstrap'
import { format, parseISO } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import TimeSlotPicker from '@/components/TimeSlotPicker'

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
  service_id: string
  staff_id?: string
}

export default function ManageAppointmentPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const businessSlug = params.slug as string
  const appointmentId = searchParams.get('apt')
  const action = searchParams.get('action')
  
  const [appointment, setAppointment] = useState<AppointmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showReschedule, setShowReschedule] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [newSlot, setNewSlot] = useState('')

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment()
    }
    
    // Auto-trigger action if specified
    if (action === 'cancel') {
      setShowCancel(true)
    } else if (action === 'reschedule') {
      setShowReschedule(true)
    }
  }, [appointmentId, action])

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Appointment not found')
      }

      setAppointment(data.appointment)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointment')
    } finally {
      setLoading(false)
    }
  }

  const handleReschedule = async () => {
    if (!newSlot || !appointment) return

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/appointments/${appointment.id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datetime: newSlot })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Reschedule failed')
      }

      // Show success and refresh
      setShowReschedule(false)
      fetchAppointment()
      alert(appointment.customer_locale.startsWith('es') 
        ? 'Cita reprogramada exitosamente' 
        : 'Appointment rescheduled successfully'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reschedule failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!appointment) return

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/appointments/${appointment.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Cancellation failed')
      }

      // Show success
      setShowCancel(false)
      fetchAppointment()
      alert(appointment.customer_locale.startsWith('es') 
        ? 'Cita cancelada exitosamente' 
        : 'Appointment cancelled successfully'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancellation failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="mt-2">Loading appointment...</p>
        </div>
      </Container>
    )
  }

  if (error && !appointment) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Alert variant="danger" className="text-center">
              <h5>Appointment Not Found</h5>
              <p>{error}</p>
            </Alert>
          </Col>
        </Row>
      </Container>
    )
  }

  if (!appointment) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Alert variant="warning" className="text-center">
              <h5>Invalid Link</h5>
              <p>This appointment management link is not valid.</p>
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
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="fw-bold">
              {locale === 'es' ? 'Administrar Cita' : 'Manage Appointment'}
            </h2>
            <p className="text-muted">
              {appointment.business_name}
            </p>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4" dismissible onClose={() => setError('')}>
              {error}
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

              <Row className="mb-3">
                <Col sm={4} className="text-muted">
                  {locale === 'es' ? 'Estado:' : 'Status:'}
                </Col>
                <Col sm={8}>
                  <Badge bg={appointment.status === 'confirmed' ? 'success' : 
                           appointment.status === 'canceled' ? 'danger' : 'warning'}>
                    {appointment.status === 'confirmed' 
                      ? (locale === 'es' ? 'Confirmada' : 'Confirmed')
                      : appointment.status === 'canceled'
                      ? (locale === 'es' ? 'Cancelada' : 'Cancelled')
                      : (locale === 'es' ? 'Pendiente' : 'Pending')
                    }
                  </Badge>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Action Buttons */}
          {appointment.status !== 'canceled' && (
            <div className="d-grid gap-3">
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => setShowReschedule(true)}
                disabled={submitting}
              >
                <i className="fas fa-calendar-alt me-2"></i>
                {locale === 'es' ? 'Reprogramar Cita' : 'Reschedule Appointment'}
              </Button>

              <Button 
                variant="outline-danger" 
                size="lg"
                onClick={() => setShowCancel(true)}
                disabled={submitting}
              >
                <i className="fas fa-times me-2"></i>
                {locale === 'es' ? 'Cancelar Cita' : 'Cancel Appointment'}
              </Button>
            </div>
          )}

          {/* Reschedule Modal */}
          <Modal show={showReschedule} onHide={() => setShowReschedule(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>
                {locale === 'es' ? 'Reprogramar Cita' : 'Reschedule Appointment'}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <TimeSlotPicker
                businessSlug={businessSlug}
                serviceId={appointment.service_id}
                staffId={appointment.staff_id}
                onSelectSlot={setNewSlot}
                selectedSlot={newSlot}
                locale={locale}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowReschedule(false)}>
                {locale === 'es' ? 'Cerrar' : 'Close'}
              </Button>
              <Button 
                variant="primary" 
                onClick={handleReschedule}
                disabled={!newSlot || submitting}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    {locale === 'es' ? 'Reprogramando...' : 'Rescheduling...'}
                  </>
                ) : (
                  locale === 'es' ? 'Confirmar' : 'Confirm'
                )}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Cancel Modal */}
          <Modal show={showCancel} onHide={() => setShowCancel(false)}>
            <Modal.Header closeButton>
              <Modal.Title>
                {locale === 'es' ? 'Cancelar Cita' : 'Cancel Appointment'}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>
                {locale === 'es' 
                  ? '¿Estás seguro de que quieres cancelar esta cita?' 
                  : 'Are you sure you want to cancel this appointment?'
                }
              </p>
              <div className="bg-light p-3 rounded">
                <strong>{appointment.service_name}</strong><br />
                {format(parseISO(appointment.starts_at), 'PPP p', { locale: dateLocale })}
              </div>
              {appointment.deposit_amount && (
                <Alert variant="info" className="mt-3">
                  {locale === 'es' 
                    ? 'Tu depósito será reembolsado según las políticas del negocio.' 
                    : 'Your deposit will be refunded according to business policies.'
                  }
                </Alert>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowCancel(false)}>
                {locale === 'es' ? 'No, mantener cita' : 'No, keep appointment'}
              </Button>
              <Button 
                variant="danger" 
                onClick={handleCancel}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    {locale === 'es' ? 'Cancelando...' : 'Cancelling...'}
                  </>
                ) : (
                  locale === 'es' ? 'Sí, cancelar' : 'Yes, cancel'
                )}
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Container>
  )
}