'use client'

import { useState, useEffect } from 'react'
import { Row, Col, Button, Card, Badge, Alert, Modal, Form } from 'react-bootstrap'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'

export const dynamic = 'force-dynamic'

interface Service {
  id: string
  name: string
  description: string
  duration_min: number
  price_cents: number
  deposit_cents: number
  buffer_before_min: number
  buffer_after_min: number
  max_per_slot: number
  is_active: boolean
}

export default function ServicesPage() {
  const { language } = useLanguage()
  const locale = language === 'es' ? 'es' : 'en'
  
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_min: 60,
    price_cents: 5000,
    deposit_cents: 0,
    buffer_before_min: 15,
    buffer_after_min: 15,
    max_per_slot: 1,
    is_active: true
  })

  useEffect(() => {
    // TEMP: Use mock data for development
    setBusiness({
      id: 'dev-business-id',
      name: 'Dev Hair Salon',
      slug: 'dev-salon'
    })
    setServices([
      {
        id: '1',
        name: 'Haircut',
        description: 'Professional haircut service',
        duration_min: 45,
        price_cents: 3500,
        deposit_cents: 1000,
        buffer_before_min: 15,
        buffer_after_min: 15,
        max_per_slot: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        business_id: 'dev-business-id'
      },
      {
        id: '2',
        name: 'Beard Trim',
        description: 'Beard trimming and styling',
        duration_min: 20,
        price_cents: 1500,
        deposit_cents: 500,
        buffer_before_min: 10,
        buffer_after_min: 10,
        max_per_slot: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        business_id: 'dev-business-id'
      }
    ])
    setLoading(false)
  }, [])

  const fetchData = async () => {
    try {
      // Get user from localStorage
      const userString = localStorage.getItem('user')
      if (!userString) {
        window.location.href = '/login'
        return
      }
      
      const user = JSON.parse(userString)

      // Get business using Neon API
      const response = await fetch('/api/debug/businesses')
      const result = await response.json()
      
      if (response.ok && result.businesses && result.businesses.length > 0) {
        const userBusiness = result.businesses.find((b: any) => b.owner_id === user.id)
        if (userBusiness) {
          setBusiness(userBusiness)
        }
      }

      // TODO: Implement services API endpoint
      // For now, keep using mock data
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) return

    setSubmitting(true)

    try {
      // TODO: Implement service create/update API endpoints
      if (editingService) {
        // Update existing service in mock data
        setServices(prev => prev.map(s => 
          s.id === editingService.id 
            ? { ...s, ...formData }
            : s
        ))
      } else {
        // Add new service to mock data
        const newService: Service = {
          ...formData,
          id: Date.now().toString(),
        }
        setServices(prev => [newService, ...prev])
      }

      setShowModal(false)
      setEditingService(null)
      resetForm()
    } catch (error) {
      console.error('Error saving service:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration_min: 60,
      price_cents: 5000,
      deposit_cents: 0,
      buffer_before_min: 15,
      buffer_after_min: 15,
      max_per_slot: 1,
      is_active: true
    })
  }

  const openEditModal = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description,
      duration_min: service.duration_min,
      price_cents: service.price_cents,
      deposit_cents: service.deposit_cents,
      buffer_before_min: service.buffer_before_min,
      buffer_after_min: service.buffer_after_min,
      max_per_slot: service.max_per_slot,
      is_active: service.is_active
    })
    setShowModal(true)
  }

  const toggleServiceStatus = async (service: Service) => {
    try {
      // TODO: Implement service status update API endpoint
      // For now, update in mock data
      setServices(prev => prev.map(s => 
        s.id === service.id 
          ? { ...s, is_active: !s.is_active }
          : s
      ))
    } catch (error) {
      console.error('Error updating service:', error)
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
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="text-center py-5">
        <Alert variant="warning">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {locale === 'es' ? 'Por favor crea un negocio primero para gestionar servicios.' : 'Please create a business first to manage services.'}
        </Alert>
        <Link href="/dashboard/onboarding">
          <Button variant="success">
            {locale === 'es' ? 'Crear Negocio' : 'Create Business'}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <div 
            className="rounded-3 bg-gradient p-3 text-white d-flex align-items-center"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
          >
            <i className="fas fa-cogs fs-4"></i>
          </div>
          <div>
            <h2 className="mb-0 fw-bold text-gray-900">
              {locale === 'es' ? 'Servicios' : 'Services'}
            </h2>
            <p className="text-muted mb-0">
              {locale === 'es' ? 'Gestiona tus ofertas de servicios' : 'Manage your service offerings'}
            </p>
          </div>
        </div>
        <Button 
          variant="success"
          onClick={() => {
            resetForm()
            setEditingService(null)
            setShowModal(true)
          }}
        >
          <i className="fas fa-plus me-1"></i>
          {locale === 'es' ? 'Agregar Servicio' : 'Add Service'}
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-5">
          <div 
            className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
            style={{ 
              width: '120px', 
              height: '120px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
              border: '2px dashed #f59e0b'
            }}
          >
            <i className="fas fa-cogs fs-1 text-warning"></i>
          </div>
          <h4 className="fw-bold mb-3">
            {locale === 'es' ? 'No Hay Servicios Aún' : 'No Services Yet'}
          </h4>
          <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '500px' }}>
            {locale === 'es' 
              ? 'Crea tu primer servicio para empezar a aceptar reservas. Define lo que ofreces, precios, duración y disponibilidad.'
              : 'Create your first service to start accepting bookings. Define what you offer, pricing, duration, and availability.'
            }
          </p>
          <Button 
            variant="success" 
            size="lg"
            onClick={() => {
              resetForm()
              setEditingService(null)
              setShowModal(true)
            }}
          >
            <i className="fas fa-plus me-2"></i>
            {locale === 'es' ? 'Crear Tu Primer Servicio' : 'Create Your First Service'}
          </Button>
        </div>
      ) : (
        <Row className="g-4">
          {services.map(service => (
            <Col key={service.id} lg={4} md={6}>
              <div 
                className="glass-card p-4 rounded-4 h-100 position-relative"
                style={{
                  background: service.is_active 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)'
                    : 'linear-gradient(135deg, rgba(156, 163, 175, 0.05) 0%, rgba(107, 114, 128, 0.02) 100%)',
                  border: service.is_active 
                    ? '1px solid rgba(16, 185, 129, 0.1)'
                    : '1px solid rgba(156, 163, 175, 0.1)',
                  opacity: service.is_active ? 1 : 0.7
                }}
              >
                {/* Status Badge */}
                <div className="position-absolute top-0 end-0 m-3">
                  <Badge bg={service.is_active ? 'success' : 'secondary'}>
                    {service.is_active ? (locale === 'es' ? 'Activo' : 'Active') : (locale === 'es' ? 'Inactivo' : 'Inactive')}
                  </Badge>
                </div>

                <div className="mb-3">
                  <h5 className="fw-bold mb-2">{service.name}</h5>
                  <p className="text-muted small mb-0" style={{ minHeight: '40px' }}>
                    {service.description}
                  </p>
                </div>

                {/* Service Details */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">
                      <i className="fas fa-clock me-1"></i>
                      {locale === 'es' ? 'Duración' : 'Duration'}
                    </small>
                    <span className="fw-medium">{service.duration_min} min</span>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">
                      <i className="fas fa-dollar-sign me-1"></i>
                      {locale === 'es' ? 'Precio' : 'Price'}
                    </small>
                    <span className="fw-medium">{formatPrice(service.price_cents)}</span>
                  </div>

                  {service.deposit_cents > 0 && (
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <small className="text-muted">
                        <i className="fas fa-credit-card me-1"></i>
                        {locale === 'es' ? 'Depósito' : 'Deposit'}
                      </small>
                      <span className="fw-medium">{formatPrice(service.deposit_cents)}</span>
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      <i className="fas fa-users me-1"></i>
                      {locale === 'es' ? 'Máx por horario' : 'Max per slot'}
                    </small>
                    <span className="fw-medium">{service.max_per_slot}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => openEditModal(service)}
                    className="flex-grow-1"
                  >
                    <i className="fas fa-edit me-1"></i>
                    {locale === 'es' ? 'Editar' : 'Edit'}
                  </Button>
                  <Button 
                    variant={service.is_active ? 'outline-warning' : 'outline-success'}
                    size="sm"
                    onClick={() => toggleServiceStatus(service)}
                  >
                    <i className={`fas ${service.is_active ? 'fa-pause' : 'fa-play'} me-1`}></i>
                    {service.is_active ? (locale === 'es' ? 'Pausar' : 'Pause') : (locale === 'es' ? 'Activar' : 'Activate')}
                  </Button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* Service Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-cogs me-2"></i>
            {editingService ? (locale === 'es' ? 'Editar Servicio' : 'Edit Service') : (locale === 'es' ? 'Agregar Nuevo Servicio' : 'Add New Service')}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    {locale === 'es' ? 'Nombre del Servicio *' : 'Service Name *'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder={locale === 'es' ? 'ej., Corte de pelo, Masaje, Consulta' : 'e.g., Haircut, Massage, Consultation'}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    {locale === 'es' ? 'Duración (minutos) *' : 'Duration (minutes) *'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.duration_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_min: parseInt(e.target.value) }))}
                    required
                    min="15"
                    step="15"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>
                    {locale === 'es' ? 'Descripción' : 'Description'}
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={locale === 'es' ? 'Describe tu servicio...' : 'Describe your service...'}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    {locale === 'es' ? 'Precio (USD) *' : 'Price (USD) *'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.price_cents / 100}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_cents: parseFloat(e.target.value) * 100 }))}
                    required
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    {locale === 'es' ? 'Depósito Requerido (USD)' : 'Deposit Required (USD)'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.deposit_cents / 100}
                    onChange={(e) => setFormData(prev => ({ ...prev, deposit_cents: parseFloat(e.target.value) * 100 }))}
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Buffer Before (min)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.buffer_before_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, buffer_before_min: parseInt(e.target.value) }))}
                    min="0"
                    step="5"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Buffer After (min)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.buffer_after_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, buffer_after_min: parseInt(e.target.value) }))}
                    min="0"
                    step="5"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Max per Slot</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.max_per_slot}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_per_slot: parseInt(e.target.value) }))}
                    min="1"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              {locale === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button variant="success" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  {locale === 'es' ? 'Guardando...' : 'Saving...'}
                </>
              ) : (
                <>
                  <i className="fas fa-save me-1"></i>
                  {editingService ? (locale === 'es' ? 'Actualizar Servicio' : 'Update Service') : (locale === 'es' ? 'Crear Servicio' : 'Create Service')}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}