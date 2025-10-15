'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, Form, Row, Col, Badge, Alert, Tabs, Tab } from 'react-bootstrap'
import { format, parseISO, startOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { useLanguage } from '@/lib/language-context'

interface AvailabilityRule {
  id?: string
  weekday: number
  start_time: string
  end_time: string
}

interface AvailabilityException {
  id?: string
  date: string
  is_closed: boolean
  start_time?: string
  end_time?: string
  reason?: string
}

interface AvailabilityManagerProps {
  show: boolean
  onHide: () => void
  businessId: string
  onUpdate: () => void
}

export default function AvailabilityManager({ show, onHide, businessId, onUpdate }: AvailabilityManagerProps) {
  const { language } = useLanguage()
  const locale = language === 'es' ? 'es' : 'en'
  const dateLocale = language === 'es' ? es : undefined

  const [activeTab, setActiveTab] = useState('hours')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Operating Hours State
  const [weeklyHours, setWeeklyHours] = useState<AvailabilityRule[]>([])
  
  // Exceptions State
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([])
  const [newException, setNewException] = useState<AvailabilityException>({
    date: '',
    is_closed: true,
    reason: ''
  })

  const weekdays = locale === 'es' 
    ? ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const reasonOptions = locale === 'es' 
    ? [
        { value: 'vacation', label: 'Vacaciones' },
        { value: 'sick', label: 'Enfermedad' },
        { value: 'holiday', label: 'Feriado' },
        { value: 'maintenance', label: 'Mantenimiento' },
        { value: 'other', label: 'Otro' }
      ]
    : [
        { value: 'vacation', label: 'Vacation' },
        { value: 'sick', label: 'Sick Day' },
        { value: 'holiday', label: 'Holiday' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'other', label: 'Other' }
      ]

  useEffect(() => {
    if (show && businessId) {
      fetchAvailability()
    }
  }, [show, businessId])

  const fetchAvailability = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/availability`)
      const result = await response.json()
      
      if (result.success && result.availability) {
        const { rules, exceptions } = result.availability
        
        // Initialize with default hours if none exist
        if (!rules || rules.length === 0) {
          const defaultHours = Array.from({ length: 7 }, (_, i) => ({
            weekday: i,
            start_time: i === 0 || i === 6 ? '' : '09:00', // Closed on weekends by default
            end_time: i === 0 || i === 6 ? '' : '17:00'
          }))
          setWeeklyHours(defaultHours)
        } else {
          setWeeklyHours(rules)
        }

        // Filter exceptions to only future dates
        const today = new Date().toISOString().split('T')[0]
        const futureExceptions = exceptions.filter((ex: any) => ex.date >= today)
        setExceptions(futureExceptions || [])
      } else {
        console.error('Failed to fetch availability:', result.error)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveWeeklyHours = async () => {
    setSaving(true)
    try {
      // Delete existing rules first
      await fetch(`/api/businesses/${businessId}/availability`, {
        method: 'DELETE'
      })
      
      // Insert new rules (only for days with hours set)
      const rulesToInsert = weeklyHours.filter(rule => rule.start_time && rule.end_time)
      
      for (const rule of rulesToInsert) {
        const response = await fetch(`/api/businesses/${businessId}/availability`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'rule',
            data: {
              weekday: rule.weekday,
              start_time: rule.start_time,
              end_time: rule.end_time
            }
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save rule')
        }
      }

      onUpdate()
    } catch (error) {
      console.error('Error saving weekly hours:', error)
    } finally {
      setSaving(false)
    }
  }

  const addException = async () => {
    if (!newException.date) return

    setSaving(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'exception',
          data: {
            date: newException.date,
            is_closed: newException.is_closed,
            start_time: newException.is_closed ? null : newException.start_time,
            end_time: newException.is_closed ? null : newException.end_time,
            reason: newException.reason
          }
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add exception')
      }
      
      const result = await response.json()
      
      if (result.success && result.exception) {
        setExceptions([...exceptions, result.exception])
        setNewException({ date: '', is_closed: true, reason: '' })
        onUpdate()
      }
    } catch (error) {
      console.error('Error adding exception:', error)
    } finally {
      setSaving(false)
    }
  }

  const removeException = async (id: string) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/availability/exceptions/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove exception')
      }

      setExceptions(exceptions.filter(ex => ex.id !== id))
      onUpdate()
    } catch (error) {
      console.error('Error removing exception:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateWeeklyHour = (weekday: number, field: 'start_time' | 'end_time', value: string) => {
    setWeeklyHours(prev => 
      prev.map(rule => 
        rule.weekday === weekday 
          ? { ...rule, [field]: value }
          : rule
      )
    )
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-clock me-2"></i>
          {locale === 'es' ? 'Configurar Disponibilidad' : 'Manage Availability'}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'hours')}
            className="mb-4"
          >
            {/* Operating Hours Tab */}
            <Tab 
              eventKey="hours" 
              title={
                <span>
                  <i className="fas fa-business-time me-2"></i>
                  {locale === 'es' ? 'Horarios' : 'Operating Hours'}
                </span>
              }
            >
              <div className="space-y-3">
                {weekdays.map((day, index) => (
                  <Row key={index} className="align-items-center mb-3">
                    <Col md={3}>
                      <strong>{day}</strong>
                    </Col>
                    <Col md={4}>
                      <Form.Control
                        type="time"
                        value={weeklyHours[index]?.start_time || ''}
                        onChange={(e) => updateWeeklyHour(index, 'start_time', e.target.value)}
                        placeholder={locale === 'es' ? 'Hora inicio' : 'Start time'}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Control
                        type="time"
                        value={weeklyHours[index]?.end_time || ''}
                        onChange={(e) => updateWeeklyHour(index, 'end_time', e.target.value)}
                        placeholder={locale === 'es' ? 'Hora fin' : 'End time'}
                      />
                    </Col>
                    <Col md={1}>
                      {(!weeklyHours[index]?.start_time || !weeklyHours[index]?.end_time) && (
                        <Badge bg="secondary" className="small">
                          {locale === 'es' ? 'Cerrado' : 'Closed'}
                        </Badge>
                      )}
                    </Col>
                  </Row>
                ))}
                
                <Alert variant="info" className="small">
                  <i className="fas fa-info-circle me-2"></i>
                  {locale === 'es' 
                    ? 'Deja los campos vacíos para días cerrados. Los horarios se aplicarán a todas las semanas.'
                    : 'Leave fields empty for closed days. Hours will apply to all weeks.'
                  }
                </Alert>

                <div className="d-flex justify-content-end">
                  <Button 
                    variant="primary" 
                    onClick={saveWeeklyHours}
                    disabled={saving}
                  >
                    {saving && <span className="spinner-border spinner-border-sm me-2" />}
                    {locale === 'es' ? 'Guardar Horarios' : 'Save Hours'}
                  </Button>
                </div>
              </div>
            </Tab>

            {/* Exceptions Tab */}
            <Tab 
              eventKey="exceptions" 
              title={
                <span>
                  <i className="fas fa-calendar-times me-2"></i>
                  {locale === 'es' ? 'Excepciones' : 'Exceptions'}
                  {exceptions.length > 0 && (
                    <Badge bg="primary" className="ms-1">{exceptions.length}</Badge>
                  )}
                </span>
              }
            >
              {/* Add New Exception */}
              <div className="border rounded-3 p-3 mb-4 bg-light">
                <h6 className="mb-3">
                  {locale === 'es' ? 'Agregar Excepción' : 'Add Exception'}
                </h6>
                
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label>{locale === 'es' ? 'Fecha' : 'Date'}</Form.Label>
                    <Form.Control
                      type="date"
                      value={newException.date}
                      onChange={(e) => setNewException({ ...newException, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </Col>
                  
                  <Col md={6}>
                    <Form.Label>{locale === 'es' ? 'Tipo' : 'Type'}</Form.Label>
                    <Form.Select
                      value={newException.is_closed ? 'closed' : 'custom'}
                      onChange={(e) => setNewException({ 
                        ...newException, 
                        is_closed: e.target.value === 'closed',
                        start_time: e.target.value === 'closed' ? '' : newException.start_time,
                        end_time: e.target.value === 'closed' ? '' : newException.end_time
                      })}
                    >
                      <option value="closed">
                        {locale === 'es' ? 'Cerrado todo el día' : 'Closed all day'}
                      </option>
                      <option value="custom">
                        {locale === 'es' ? 'Horario especial' : 'Custom hours'}
                      </option>
                    </Form.Select>
                  </Col>

                  {!newException.is_closed && (
                    <>
                      <Col md={4}>
                        <Form.Label>{locale === 'es' ? 'Hora inicio' : 'Start time'}</Form.Label>
                        <Form.Control
                          type="time"
                          value={newException.start_time || ''}
                          onChange={(e) => setNewException({ ...newException, start_time: e.target.value })}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label>{locale === 'es' ? 'Hora fin' : 'End time'}</Form.Label>
                        <Form.Control
                          type="time"
                          value={newException.end_time || ''}
                          onChange={(e) => setNewException({ ...newException, end_time: e.target.value })}
                        />
                      </Col>
                    </>
                  )}

                  <Col md={newException.is_closed ? 6 : 4}>
                    <Form.Label>{locale === 'es' ? 'Motivo' : 'Reason'}</Form.Label>
                    <Form.Select
                      value={newException.reason || ''}
                      onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
                    >
                      <option value="">{locale === 'es' ? 'Seleccionar...' : 'Select...'}</option>
                      {reasonOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end mt-3">
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={addException}
                    disabled={!newException.date || saving}
                  >
                    {saving && <span className="spinner-border spinner-border-sm me-2" />}
                    <i className="fas fa-plus me-1"></i>
                    {locale === 'es' ? 'Agregar' : 'Add'}
                  </Button>
                </div>
              </div>

              {/* Existing Exceptions */}
              <div className="space-y-2">
                {exceptions.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="fas fa-calendar-check fs-2 mb-3"></i>
                    <p>{locale === 'es' ? 'No hay excepciones programadas' : 'No exceptions scheduled'}</p>
                  </div>
                ) : (
                  exceptions.map(exception => (
                    <div key={exception.id} className="d-flex justify-content-between align-items-center p-3 border rounded-3">
                      <div>
                        <div className="fw-semibold">
                          {format(parseISO(exception.date), 'EEEE, MMMM d, yyyy', { locale: dateLocale })}
                        </div>
                        <div className="small text-muted">
                          {exception.is_closed ? (
                            <Badge bg="danger">
                              {locale === 'es' ? 'Cerrado' : 'Closed'}
                            </Badge>
                          ) : (
                            <Badge bg="warning">
                              {exception.start_time} - {exception.end_time}
                            </Badge>
                          )}
                          {exception.reason && (
                            <span className="ms-2">
                              {reasonOptions.find(r => r.value === exception.reason)?.label || exception.reason}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeException(exception.id!)}
                        disabled={saving}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Tab>
          </Tabs>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          {locale === 'es' ? 'Cerrar' : 'Close'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}