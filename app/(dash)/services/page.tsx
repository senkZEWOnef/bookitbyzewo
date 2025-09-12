'use client'

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap'
import { createSupabaseClient } from '@/lib/supabase'
import { Service } from '@/types/database'

interface ServiceFormData {
  name: string
  description: string
  duration_min: number
  price_cents: number
  deposit_cents: number
  buffer_before_min: number
  buffer_after_min: number
  max_per_slot: number
}

const initialFormData: ServiceFormData = {
  name: '',
  description: '',
  duration_min: 60,
  price_cents: 5000,
  deposit_cents: 1000,
  buffer_before_min: 0,
  buffer_after_min: 15,
  max_per_slot: 1
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [businessId, setBusinessId] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState<ServiceFormData>(initialFormData)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's business
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!business) return

      setBusinessId(business.id)

      // Get services
      const { data: servicesData, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', business.id)
        .order('name')

      if (error) throw error
      setServices(servicesData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update(formData)
          .eq('id', editingService.id)

        if (error) throw error
      } else {
        // Create new service
        const { error } = await supabase
          .from('services')
          .insert({
            ...formData,
            business_id: businessId
          })

        if (error) throw error
      }

      setShowModal(false)
      setEditingService(null)
      setFormData(initialFormData)
      fetchServices()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save service')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      duration_min: service.duration_min,
      price_cents: service.price_cents,
      deposit_cents: service.deposit_cents,
      buffer_before_min: service.buffer_before_min,
      buffer_after_min: service.buffer_after_min,
      max_per_slot: service.max_per_slot
    })
    setShowModal(true)
  }

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (error) throw error
      fetchServices()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service')
    }
  }

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    if (remainingMins === 0) return `${hours}h`
    return `${hours}h ${remainingMins}min`
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p className="mt-2">Loading services...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Services</h1>
          <p className="text-muted">Manage your service offerings and pricing</p>
        </div>
        <Button 
          variant="success" 
          onClick={() => {
            setEditingService(null)
            setFormData(initialFormData)
            setShowModal(true)
          }}
        >
          <i className="fas fa-plus me-1"></i>
          Add Service
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {services.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <i className="fas fa-cogs fa-3x text-muted mb-3"></i>
            <h5>No Services Yet</h5>
            <p className="text-muted">Create your first service to start accepting bookings</p>
            <Button 
              variant="success" 
              onClick={() => {
                setEditingService(null)
                setFormData(initialFormData)
                setShowModal(true)
              }}
            >
              <i className="fas fa-plus me-1"></i>
              Create First Service
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body className="p-0">
            <Table responsive className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Service</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Deposit</th>
                  <th>Buffer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map(service => (
                  <tr key={service.id}>
                    <td>
                      <div className="fw-bold">{service.name}</div>
                      {service.description && (
                        <small className="text-muted">{service.description}</small>
                      )}
                    </td>
                    <td>{formatDuration(service.duration_min)}</td>
                    <td>{formatPrice(service.price_cents)}</td>
                    <td>
                      {service.deposit_cents > 0 ? (
                        <Badge bg="warning" text="dark">
                          {formatPrice(service.deposit_cents)}
                        </Badge>
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </td>
                    <td>
                      <small className="text-muted">
                        {service.buffer_before_min > 0 && `${service.buffer_before_min}m before`}
                        {service.buffer_before_min > 0 && service.buffer_after_min > 0 && ', '}
                        {service.buffer_after_min > 0 && `${service.buffer_after_min}m after`}
                        {service.buffer_before_min === 0 && service.buffer_after_min === 0 && 'None'}
                      </small>
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-1"
                        onClick={() => handleEdit(service)}
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(service.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Add/Edit Service Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingService ? 'Edit Service' : 'Add New Service'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Service Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Haircut"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Duration (minutes) *</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.duration_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_min: parseInt(e.target.value) }))}
                    min="5"
                    max="600"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the service"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price ($)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={(formData.price_cents / 100).toFixed(2)}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      price_cents: Math.round(parseFloat(e.target.value) * 100) 
                    }))}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Deposit ($)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={(formData.deposit_cents / 100).toFixed(2)}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      deposit_cents: Math.round(parseFloat(e.target.value) * 100) 
                    }))}
                    min="0"
                  />
                  <Form.Text className="text-muted">
                    Required upfront payment to secure booking
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Buffer Before (min)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.buffer_before_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, buffer_before_min: parseInt(e.target.value) }))}
                    min="0"
                  />
                  <Form.Text className="text-muted">
                    Prep time before appointment
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Buffer After (min)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.buffer_after_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, buffer_after_min: parseInt(e.target.value) }))}
                    min="0"
                  />
                  <Form.Text className="text-muted">
                    Cleanup time after appointment
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Max per Slot</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.max_per_slot}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_per_slot: parseInt(e.target.value) }))}
                    min="1"
                    max="10"
                  />
                  <Form.Text className="text-muted">
                    Multiple customers per time slot
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" disabled={submitting}>
              {submitting ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}