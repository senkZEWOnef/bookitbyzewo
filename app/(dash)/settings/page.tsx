'use client'

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Table, Modal, Badge } from 'react-bootstrap'
import { createSupabaseClient } from '@/lib/supabase'
import { AvailabilityRule, AvailabilityException, Business } from '@/types/database'

interface AvailabilityFormData {
  weekday: number
  start_time: string
  end_time: string
}

interface ExceptionFormData {
  date: string
  is_closed: boolean
  start_time: string
  end_time: string
}

const weekdays = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function SettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([])
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([])
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [showExceptionModal, setShowExceptionModal] = useState(false)
  const [availabilityForm, setAvailabilityForm] = useState<AvailabilityFormData>({
    weekday: 1,
    start_time: '09:00',
    end_time: '17:00'
  })
  const [exceptionForm, setExceptionForm] = useState<ExceptionFormData>({
    date: '',
    is_closed: true,
    start_time: '09:00',
    end_time: '17:00'
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get business
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (businessError) throw businessError
      setBusiness(businessData)

      // Get availability rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('business_id', businessData.id)
        .is('staff_id', null)
        .order('weekday')

      if (rulesError) throw rulesError
      setAvailabilityRules(rulesData || [])

      // Get exceptions
      const { data: exceptionsData, error: exceptionsError } = await supabase
        .from('availability_exceptions')
        .select('*')
        .eq('business_id', businessData.id)
        .is('staff_id', null)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date')

      if (exceptionsError) throw exceptionsError
      setExceptions(exceptionsData || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleBusinessUpdate = async (field: string, value: string) => {
    if (!business) return

    try {
      const { error } = await supabase
        .from('businesses')
        .update({ [field]: value })
        .eq('id', business.id)

      if (error) throw error
      
      setBusiness(prev => prev ? { ...prev, [field]: value } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update business')
    }
  }

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('availability_rules')
        .insert({
          business_id: business.id,
          staff_id: null,
          weekday: availabilityForm.weekday,
          start_time: availabilityForm.start_time,
          end_time: availabilityForm.end_time
        })

      if (error) throw error
      
      setShowAvailabilityModal(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add availability')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAvailability = async (id: string) => {
    if (!confirm('Delete this availability rule?')) return

    try {
      const { error } = await supabase
        .from('availability_rules')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete availability')
    }
  }

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('availability_exceptions')
        .insert({
          business_id: business.id,
          staff_id: null,
          date: exceptionForm.date,
          is_closed: exceptionForm.is_closed,
          start_time: exceptionForm.is_closed ? null : exceptionForm.start_time,
          end_time: exceptionForm.is_closed ? null : exceptionForm.end_time
        })

      if (error) throw error
      
      setShowExceptionModal(false)
      setExceptionForm({
        date: '',
        is_closed: true,
        start_time: '09:00',
        end_time: '17:00'
      })
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add exception')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteException = async (id: string) => {
    if (!confirm('Delete this date exception?')) return

    try {
      const { error } = await supabase
        .from('availability_exceptions')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete exception')
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p className="mt-2">Loading settings...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="mb-4">
        <h1 className="h3 mb-1">Settings</h1>
        <p className="text-muted">Manage your business settings and availability</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col lg={8}>
          {/* Business Information */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Business Information</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Business Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={business?.name || ''}
                        onChange={(e) => handleBusinessUpdate('name', e.target.value)}
                        onBlur={(e) => handleBusinessUpdate('name', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Booking URL</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">bookitbyzewo.com/book/</span>
                        <Form.Control
                          type="text"
                          value={business?.slug || ''}
                          onChange={(e) => handleBusinessUpdate('slug', e.target.value)}
                          onBlur={(e) => handleBusinessUpdate('slug', e.target.value)}
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    value={business?.location || ''}
                    onChange={(e) => handleBusinessUpdate('location', e.target.value)}
                    onBlur={(e) => handleBusinessUpdate('location', e.target.value)}
                    placeholder="Business address or area"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Timezone</Form.Label>
                  <Form.Select
                    value={business?.timezone || 'America/Puerto_Rico'}
                    onChange={(e) => handleBusinessUpdate('timezone', e.target.value)}
                  >
                    <option value="America/Puerto_Rico">Puerto Rico (AST)</option>
                    <option value="America/New_York">Eastern Time (EST/EDT)</option>
                    <option value="America/Chicago">Central Time (CST/CDT)</option>
                    <option value="America/Denver">Mountain Time (MST/MDT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          {/* Weekly Availability */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Weekly Availability</h5>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => setShowAvailabilityModal(true)}
              >
                <i className="fas fa-plus me-1"></i>
                Add Hours
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {availabilityRules.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No availability set</p>
                  <Button variant="primary" onClick={() => setShowAvailabilityModal(true)}>
                    Set Your Hours
                  </Button>
                </div>
              ) : (
                <Table className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Day</th>
                      <th>Hours</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availabilityRules.map(rule => (
                      <tr key={rule.id}>
                        <td>
                          <strong>{weekdays.find(d => d.value === rule.weekday)?.label}</strong>
                        </td>
                        <td>
                          {rule.start_time} - {rule.end_time}
                        </td>
                        <td>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteAvailability(rule.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          {/* Date Exceptions */}
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Date Exceptions</h5>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => setShowExceptionModal(true)}
              >
                <i className="fas fa-plus me-1"></i>
                Add Exception
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {exceptions.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No exceptions set</p>
                  <Button variant="outline-primary" onClick={() => setShowExceptionModal(true)}>
                    Add Holiday/Closure
                  </Button>
                </div>
              ) : (
                <Table className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Hours</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exceptions.map(exception => (
                      <tr key={exception.id}>
                        <td>{exception.date}</td>
                        <td>
                          <Badge bg={exception.is_closed ? 'danger' : 'warning'}>
                            {exception.is_closed ? 'Closed' : 'Modified Hours'}
                          </Badge>
                        </td>
                        <td>
                          {exception.is_closed 
                            ? 'Closed all day' 
                            : `${exception.start_time} - ${exception.end_time}`
                          }
                        </td>
                        <td>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteException(exception.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Quick Links */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Links</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  variant="outline-success" 
                  href={`/book/${business?.slug}`}
                  target="_blank"
                >
                  <i className="fas fa-external-link-alt me-1"></i>
                  View Booking Page
                </Button>
                <Button 
                  variant="outline-primary"
                  onClick={() => {
                    const url = `${window.location.origin}/book/${business?.slug}`
                    navigator.clipboard.writeText(url)
                    alert('Booking URL copied to clipboard!')
                  }}
                >
                  <i className="fas fa-copy me-1"></i>
                  Copy Booking URL
                </Button>
                <Button variant="outline-info" href="/services">
                  <i className="fas fa-cogs me-1"></i>
                  Manage Services
                </Button>
                <Button variant="outline-warning" href="/staff">
                  <i className="fas fa-users me-1"></i>
                  Manage Staff
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Availability Modal */}
      <Modal show={showAvailabilityModal} onHide={() => setShowAvailabilityModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Availability</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddAvailability}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Day of Week</Form.Label>
              <Form.Select
                value={availabilityForm.weekday}
                onChange={(e) => setAvailabilityForm(prev => ({ ...prev, weekday: parseInt(e.target.value) }))}
                required
              >
                {weekdays.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={availabilityForm.start_time}
                    onChange={(e) => setAvailabilityForm(prev => ({ ...prev, start_time: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={availabilityForm.end_time}
                    onChange={(e) => setAvailabilityForm(prev => ({ ...prev, end_time: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAvailabilityModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Availability'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Add Exception Modal */}
      <Modal show={showExceptionModal} onHide={() => setShowExceptionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Date Exception</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddException}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={exceptionForm.date}
                onChange={(e) => setExceptionForm(prev => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="radio"
                label="Closed all day"
                name="exceptionType"
                checked={exceptionForm.is_closed}
                onChange={() => setExceptionForm(prev => ({ ...prev, is_closed: true }))}
              />
              <Form.Check
                type="radio"
                label="Modified hours"
                name="exceptionType"
                checked={!exceptionForm.is_closed}
                onChange={() => setExceptionForm(prev => ({ ...prev, is_closed: false }))}
              />
            </Form.Group>

            {!exceptionForm.is_closed && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={exceptionForm.start_time}
                      onChange={(e) => setExceptionForm(prev => ({ ...prev, start_time: e.target.value }))}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>End Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={exceptionForm.end_time}
                      onChange={(e) => setExceptionForm(prev => ({ ...prev, end_time: e.target.value }))}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowExceptionModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Exception'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}