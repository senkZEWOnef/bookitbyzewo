'use client'

import { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Form, Modal, Alert, Badge, Table, Spinner } from 'react-bootstrap'
import { format, addDays, parseISO } from 'date-fns'

interface Service {
  id: string
  name: string
  duration_min: number
  price_cents: number
}

interface Staff {
  id: string
  display_name: string
}

interface RecurringAppointment {
  id: string
  service_name: string
  staff_name?: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  frequency: 'weekly' | 'bi-weekly' | 'monthly'
  start_date: string
  end_date?: string
  time_of_day: string
  duration_minutes: number
  notes?: string
  is_active: boolean
  total_appointments: number
  last_appointment_date?: string
  created_at: string
}

interface RecurringAppointmentsProps {
  businessId: string
  services: Service[]
  staff: Staff[]
}

export default function RecurringAppointments({ 
  businessId, 
  services, 
  staff 
}: RecurringAppointmentsProps) {
  const [recurringAppointments, setRecurringAppointments] = useState<RecurringAppointment[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<RecurringAppointment | null>(null)
  const [message, setMessage] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    serviceId: '',
    staffId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    frequency: 'weekly' as 'weekly' | 'bi-weekly' | 'monthly',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    timeOfDay: '10:00',
    notes: ''
  })

  useEffect(() => {
    fetchRecurringAppointments()
  }, [businessId])

  const fetchRecurringAppointments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/calendar/recurring-appointments?businessId=${businessId}`)
      const data = await response.json()

      if (response.ok) {
        setRecurringAppointments(data.recurringAppointments || [])
      } else {
        console.error('Failed to fetch recurring appointments:', data.error)
      }
    } catch (error) {
      console.error('Error fetching recurring appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      serviceId: '',
      staffId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      frequency: 'weekly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      timeOfDay: '10:00',
      notes: ''
    })
  }

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/calendar/recurring-appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          serviceId: formData.serviceId,
          staffId: formData.staffId || null,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail || null,
          frequency: formData.frequency,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          timeOfDay: formData.timeOfDay,
          notes: formData.notes || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateModal(false)
        resetForm()
        await fetchRecurringAppointments()
        setMessage(`Recurring appointment created for ${formData.customerName}`)
        setTimeout(() => setMessage(''), 5000)
      } else {
        alert(data.error || 'Failed to create recurring appointment')
      }
    } catch (error) {
      console.error('Error creating recurring appointment:', error)
      alert('Failed to create recurring appointment')
    }
  }

  const handleEdit = (appointment: RecurringAppointment) => {
    setEditingAppointment(appointment)
    setFormData({
      serviceId: '', // We don't have service_id in the response, would need to add it
      staffId: '', // We don't have staff_id in the response, would need to add it
      customerName: appointment.customer_name,
      customerPhone: appointment.customer_phone,
      customerEmail: appointment.customer_email || '',
      frequency: appointment.frequency,
      startDate: appointment.start_date,
      endDate: appointment.end_date || '',
      timeOfDay: appointment.time_of_day,
      notes: appointment.notes || ''
    })
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!editingAppointment) return

    try {
      const response = await fetch('/api/calendar/recurring-appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAppointment.id,
          businessId,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail || null,
          frequency: formData.frequency,
          endDate: formData.endDate || null,
          timeOfDay: formData.timeOfDay,
          notes: formData.notes || null,
          isActive: editingAppointment.is_active
        })
      })

      const data = await response.json()

      if (response.ok) {
        setShowEditModal(false)
        setEditingAppointment(null)
        resetForm()
        await fetchRecurringAppointments()
        setMessage(`Recurring appointment updated for ${formData.customerName}`)
        setTimeout(() => setMessage(''), 5000)
      } else {
        alert(data.error || 'Failed to update recurring appointment')
      }
    } catch (error) {
      console.error('Error updating recurring appointment:', error)
      alert('Failed to update recurring appointment')
    }
  }

  const handleToggleActive = async (appointment: RecurringAppointment) => {
    try {
      const response = await fetch('/api/calendar/recurring-appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appointment.id,
          businessId,
          isActive: !appointment.is_active
        })
      })

      const data = await response.json()

      if (response.ok) {
        await fetchRecurringAppointments()
        setMessage(`Recurring appointment ${!appointment.is_active ? 'activated' : 'deactivated'}`)
        setTimeout(() => setMessage(''), 3000)
      } else {
        alert(data.error || 'Failed to update appointment status')
      }
    } catch (error) {
      console.error('Error toggling appointment status:', error)
      alert('Failed to update appointment status')
    }
  }

  const handleDelete = async (appointment: RecurringAppointment) => {
    if (!confirm(`Are you sure you want to delete the recurring appointment for ${appointment.customer_name}? This will also cancel all future appointments.`)) {
      return
    }

    try {
      const response = await fetch(`/api/calendar/recurring-appointments?id=${appointment.id}&businessId=${businessId}&cancelFuture=true`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchRecurringAppointments()
        setMessage(`Recurring appointment deleted for ${appointment.customer_name}`)
        setTimeout(() => setMessage(''), 3000)
      } else {
        alert(data.error || 'Failed to delete recurring appointment')
      }
    } catch (error) {
      console.error('Error deleting recurring appointment:', error)
      alert('Failed to delete recurring appointment')
    }
  }

  const getFrequencyBadge = (frequency: string) => {
    const variants = {
      'weekly': 'primary',
      'bi-weekly': 'success', 
      'monthly': 'warning'
    }
    return <Badge bg={variants[frequency as keyof typeof variants]}>{frequency}</Badge>
  }

  const getNextAppointmentDate = (startDate: string, frequency: string, lastDate?: string) => {
    const base = lastDate ? parseISO(lastDate) : parseISO(startDate)
    let nextDate = base

    switch (frequency) {
      case 'weekly':
        nextDate = addDays(base, 7)
        break
      case 'bi-weekly':
        nextDate = addDays(base, 14)
        break
      case 'monthly':
        nextDate = new Date(base.getFullYear(), base.getMonth() + 1, base.getDate())
        break
    }

    return format(nextDate, 'MMM d, yyyy')
  }

  return (
    <div>
      {message && <Alert variant="success" className="mb-3">{message}</Alert>}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <i className="fas fa-repeat me-2"></i>
          Recurring Appointments
        </h4>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <i className="fas fa-plus me-1"></i>
          Add Recurring Appointment
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2 text-muted">Loading recurring appointments...</p>
        </div>
      ) : recurringAppointments.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <i className="fas fa-repeat fa-3x text-muted mb-3"></i>
            <h5>No Recurring Appointments</h5>
            <p className="text-muted">Set up weekly, bi-weekly, or monthly appointments for regular customers.</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <i className="fas fa-plus me-1"></i>
              Create First Recurring Appointment
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Frequency</th>
                  <th>Time</th>
                  <th>Next Appointment</th>
                  <th>Total Booked</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recurringAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      <div>
                        <strong>{appointment.customer_name}</strong>
                        <br />
                        <small className="text-muted">{appointment.customer_phone}</small>
                        {appointment.customer_email && (
                          <><br /><small className="text-muted">{appointment.customer_email}</small></>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{appointment.service_name}</strong>
                        {appointment.staff_name && (
                          <><br /><small className="text-muted">with {appointment.staff_name}</small></>
                        )}
                      </div>
                    </td>
                    <td>{getFrequencyBadge(appointment.frequency)}</td>
                    <td>
                      <div>
                        <strong>{format(new Date(`2000-01-01T${appointment.time_of_day}`), 'h:mm a')}</strong>
                        <br />
                        <small className="text-muted">{appointment.duration_minutes} min</small>
                      </div>
                    </td>
                    <td>
                      {appointment.is_active ? (
                        <div>
                          <strong>{getNextAppointmentDate(appointment.start_date, appointment.frequency, appointment.last_appointment_date)}</strong>
                          {appointment.end_date && (
                            <><br /><small className="text-muted">Ends: {format(parseISO(appointment.end_date), 'MMM d, yyyy')}</small></>
                          )}
                        </div>
                      ) : (
                        <Badge bg="secondary">Inactive</Badge>
                      )}
                    </td>
                    <td>
                      <Badge bg="info">{appointment.total_appointments}</Badge>
                    </td>
                    <td>
                      <Badge bg={appointment.is_active ? 'success' : 'secondary'}>
                        {appointment.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleEdit(appointment)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button
                          size="sm"
                          variant={appointment.is_active ? 'outline-warning' : 'outline-success'}
                          onClick={() => handleToggleActive(appointment)}
                          title={appointment.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <i className={`fas fa-${appointment.is_active ? 'pause' : 'play'}`}></i>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(appointment)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Create Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-repeat me-2"></i>
            Create Recurring Appointment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Service *</Form.Label>
                <Form.Select
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  required
                >
                  <option value="">Select a service</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.duration_min} min - ${(service.price_cents / 100).toFixed(2)})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Staff (Optional)</Form.Label>
                <Form.Select
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                >
                  <option value="">Any available staff</option>
                  {staff.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.display_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Customer Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                  placeholder="John Doe"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Customer Phone *</Form.Label>
                <Form.Control
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  required
                  placeholder="+1 (555) 123-4567"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Customer Email (Optional)</Form.Label>
            <Form.Control
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              placeholder="john@example.com"
            />
          </Form.Group>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Frequency *</Form.Label>
                <Form.Select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                  required
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Start Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>End Date (Optional)</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Time *</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.timeOfDay}
                  onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Notes (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special notes or requirements..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreate}
            disabled={!formData.serviceId || !formData.customerName || !formData.customerPhone}
          >
            <i className="fas fa-plus me-1"></i>
            Create Recurring Appointment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-edit me-2"></i>
            Edit Recurring Appointment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <i className="fas fa-info-circle me-2"></i>
            Editing will only affect future appointments. Past appointments remain unchanged.
          </Alert>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Customer Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Customer Phone *</Form.Label>
                <Form.Control
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Customer Email (Optional)</Form.Label>
            <Form.Control
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            />
          </Form.Group>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Frequency *</Form.Label>
                <Form.Select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>End Date (Optional)</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Time *</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.timeOfDay}
                  onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Notes (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdate}
            disabled={!formData.customerName || !formData.customerPhone}
          >
            <i className="fas fa-save me-1"></i>
            Update Recurring Appointment
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}