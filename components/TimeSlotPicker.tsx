'use client'

import { useState, useEffect } from 'react'
import { Row, Col, Button, Spinner, Alert } from 'react-bootstrap'
import { format, addDays, startOfDay, parseISO } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

interface TimeSlot {
  datetime: string
  available: boolean
}

interface TimeSlotPickerProps {
  businessSlug: string
  serviceId: string
  staffId?: string
  onSelectSlot: (datetime: string) => void
  selectedSlot?: string
  locale: 'en' | 'es'
}

export default function TimeSlotPicker({ 
  businessSlug, 
  serviceId, 
  staffId, 
  onSelectSlot, 
  selectedSlot,
  locale 
}: TimeSlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const dateLocale = locale === 'es' ? es : enUS

  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(startOfDay(new Date()), i)
    return {
      date: format(date, 'yyyy-MM-dd'),
      display: format(date, i === 0 ? "'Today'" : i === 1 ? "'Tomorrow'" : 'EEE, MMM d', { locale: dateLocale }),
      fullDisplay: format(date, 'EEEE, MMMM d', { locale: dateLocale })
    }
  })

  const fetchTimeSlots = async () => {
    setLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        serviceId,
        ...(staffId && { staffId })
      })

      const response = await fetch(`/api/slots/${businessSlug}?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch time slots')
      }

      setTimeSlots(data.slots || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load time slots')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (serviceId) {
      fetchTimeSlots()
    }
  }, [selectedDate, serviceId, staffId])

  const formatTime = (datetime: string) => {
    return format(parseISO(datetime), 'h:mm a')
  }

  return (
    <div>
      {/* Date Picker */}
      <div className="mb-4">
        <h6 className="mb-3">
          {locale === 'es' ? 'Selecciona una fecha' : 'Choose a date'}
        </h6>
        <Row className="g-2">
          {availableDates.map(({ date, display }) => (
            <Col key={date} xs={6} md={4} lg={3}>
              <Button
                variant={selectedDate === date ? 'success' : 'outline-secondary'}
                size="sm"
                className="w-100"
                onClick={() => setSelectedDate(date)}
              >
                {display}
              </Button>
            </Col>
          ))}
        </Row>
      </div>

      {/* Time Slots */}
      <div>
        <h6 className="mb-3">
          {locale === 'es' ? 'Hora disponible' : 'Available times'}
          {selectedDate && (
            <span className="text-muted ms-2">
              ({availableDates.find(d => d.date === selectedDate)?.fullDisplay})
            </span>
          )}
        </h6>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="success" />
            <p className="mt-2 text-muted">
              {locale === 'es' ? 'Cargando horarios...' : 'Loading times...'}
            </p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            {error}
            <Button 
              variant="link" 
              size="sm" 
              onClick={fetchTimeSlots}
              className="p-0 ms-2"
            >
              {locale === 'es' ? 'Reintentar' : 'Retry'}
            </Button>
          </Alert>
        ) : timeSlots.length === 0 ? (
          <Alert variant="info">
            {locale === 'es' 
              ? 'No hay horarios disponibles para esta fecha. Intenta con otra fecha.' 
              : 'No time slots available for this date. Try a different date.'
            }
          </Alert>
        ) : (
          <Row className="g-2">
            {timeSlots.map((slot) => (
              <Col key={slot.datetime} xs={6} md={4} lg={3}>
                <Button
                  variant={selectedSlot === slot.datetime ? 'success' : 'outline-primary'}
                  size="sm"
                  className="w-100"
                  disabled={!slot.available}
                  onClick={() => slot.available && onSelectSlot(slot.datetime)}
                >
                  {formatTime(slot.datetime)}
                </Button>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  )
}