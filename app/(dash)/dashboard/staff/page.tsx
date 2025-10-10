'use client'

import { useState, useEffect } from 'react'
import { Row, Col, Button, Badge, Alert, Modal, Form } from 'react-bootstrap'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'

export const dynamic = 'force-dynamic'

interface Staff {
  id: string
  user_id?: string
  display_name: string
  email?: string
  phone?: string
  role: 'admin' | 'staff'
  is_active: boolean
  created_at: string
}

export default function StaffPage() {
  const { language } = useLanguage()
  const locale = language === 'es' ? 'es' : 'en'
  
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    phone: '',
    role: 'staff' as 'admin' | 'staff',
    is_active: true
  })

  useEffect(() => {
    // TEMP: Use mock data for development
    setBusiness({
      id: 'dev-business-id',
      name: 'Dev Hair Salon',
      slug: 'dev-salon'
    })
    setStaff([
      {
        id: '1',
        display_name: 'Dev User (Owner)',
        phone: '+1787555001',
        role: 'admin',
        user_id: 'dev-user',
        business_id: 'dev-business-id',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        display_name: 'Maria Gonzalez',
        phone: '+1787555002',
        role: 'member',
        user_id: null,
        business_id: 'dev-business-id',
        created_at: new Date().toISOString()
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

      // TODO: Implement staff API endpoint
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
      // TODO: Implement staff create/update API endpoints
      if (editingStaff) {
        // Update existing staff in mock data
        setStaff(prev => prev.map(s => 
          s.id === editingStaff.id 
            ? { ...s, ...formData }
            : s
        ))
      } else {
        // Add new staff to mock data
        const newStaff: Staff = {
          ...formData,
          id: Date.now().toString(),
          created_at: new Date().toISOString()
        }
        setStaff(prev => [newStaff, ...prev])
      }

      setShowModal(false)
      setEditingStaff(null)
      resetForm()
    } catch (error) {
      console.error('Error saving staff:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      display_name: '',
      email: '',
      phone: '',
      role: 'staff',
      is_active: true
    })
  }

  const openEditModal = (staffMember: Staff) => {
    setEditingStaff(staffMember)
    setFormData({
      display_name: staffMember.display_name,
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      role: staffMember.role,
      is_active: staffMember.is_active
    })
    setShowModal(true)
  }

  const toggleStaffStatus = async (staffMember: Staff) => {
    try {
      // TODO: Implement staff status update API endpoint
      // For now, update in mock data
      setStaff(prev => prev.map(s => 
        s.id === staffMember.id 
          ? { ...s, is_active: !s.is_active }
          : s
      ))
    } catch (error) {
      console.error('Error updating staff:', error)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge bg="success">{locale === 'es' ? 'Administrador' : 'Admin'}</Badge>
      case 'staff':
        return <Badge bg="primary">{locale === 'es' ? 'Personal' : 'Staff'}</Badge>
      default:
        return <Badge bg="secondary">{role}</Badge>
    }
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
          {locale === 'es' ? 'Por favor crea un negocio primero para gestionar personal.' : 'Please create a business first to manage staff.'}
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
            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' }}
          >
            <i className="fas fa-users fs-4"></i>
          </div>
          <div>
            <h2 className="mb-0 fw-bold text-gray-900">
              {locale === 'es' ? 'Personal' : 'Staff'}
            </h2>
            <p className="text-muted mb-0">
              {locale === 'es' ? 'Gestiona los miembros de tu equipo' : 'Manage your team members'}
            </p>
          </div>
        </div>
        <Button 
          variant="success"
          onClick={() => {
            resetForm()
            setEditingStaff(null)
            setShowModal(true)
          }}
        >
          <i className="fas fa-user-plus me-1"></i>
          {locale === 'es' ? 'Agregar Miembro del Personal' : 'Add Staff Member'}
        </Button>
      </div>

      {staff.length === 0 ? (
        <div className="text-center py-5">
          <div 
            className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
            style={{ 
              width: '120px', 
              height: '120px',
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(190, 24, 93, 0.05) 100%)',
              border: '2px dashed #ec4899'
            }}
          >
            <i className="fas fa-users fs-1" style={{ color: '#be185d' }}></i>
          </div>
          <h4 className="fw-bold mb-3">
            {locale === 'es' ? 'No Hay Miembros del Personal Aún' : 'No Staff Members Yet'}
          </h4>
          <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '500px' }}>
            {locale === 'es' 
              ? 'Agrega miembros del equipo para ayudar a gestionar citas y servicios. Puedes asignar diferentes roles y permisos.'
              : 'Add team members to help manage appointments and services. You can assign different roles and permissions.'
            }
          </p>
          <Button 
            variant="success" 
            size="lg"
            onClick={() => {
              resetForm()
              setEditingStaff(null)
              setShowModal(true)
            }}
          >
            <i className="fas fa-user-plus me-2"></i>
            {locale === 'es' ? 'Agregar Tu Primer Miembro del Equipo' : 'Add Your First Team Member'}
          </Button>
        </div>
      ) : (
        <Row className="g-4">
          {staff.map(member => (
            <Col key={member.id} lg={4} md={6}>
              <div 
                className="glass-card p-4 rounded-4 h-100 position-relative"
                style={{
                  background: member.is_active 
                    ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(190, 24, 93, 0.02) 100%)'
                    : 'linear-gradient(135deg, rgba(156, 163, 175, 0.05) 0%, rgba(107, 114, 128, 0.02) 100%)',
                  border: member.is_active 
                    ? '1px solid rgba(236, 72, 153, 0.1)'
                    : '1px solid rgba(156, 163, 175, 0.1)',
                  opacity: member.is_active ? 1 : 0.7
                }}
              >
                {/* Status Badge */}
                <div className="position-absolute top-0 end-0 m-3">
                  <Badge bg={member.is_active ? 'success' : 'secondary'}>
                    {member.is_active ? (locale === 'es' ? 'Activo' : 'Active') : (locale === 'es' ? 'Inactivo' : 'Inactive')}
                  </Badge>
                </div>

                {/* Avatar */}
                <div className="text-center mb-3">
                  <div 
                    className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '80px', 
                      height: '80px',
                      background: member.is_active 
                        ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                        : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                      color: 'white'
                    }}
                  >
                    <i className="fas fa-user fs-2"></i>
                  </div>
                  <h5 className="fw-bold mb-1">{member.display_name}</h5>
                  {getRoleBadge(member.role)}
                </div>

                {/* Contact Info */}
                <div className="mb-4">
                  {member.email && (
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-envelope me-2 text-muted" style={{ width: '16px' }}></i>
                      <small className="text-muted">{member.email}</small>
                    </div>
                  )}
                  {member.phone && (
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-phone me-2 text-muted" style={{ width: '16px' }}></i>
                      <small className="text-muted">{member.phone}</small>
                    </div>
                  )}
                  <div className="d-flex align-items-center">
                    <i className="fas fa-calendar me-2 text-muted" style={{ width: '16px' }}></i>
                    <small className="text-muted">
                      {locale === 'es' ? 'Se unió el' : 'Joined'} {new Date(member.created_at).toLocaleDateString()}
                    </small>
                  </div>
                </div>

                {/* Actions */}
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => openEditModal(member)}
                    className="flex-grow-1"
                  >
                    <i className="fas fa-edit me-1"></i>
                    {locale === 'es' ? 'Editar' : 'Edit'}
                  </Button>
                  <Button 
                    variant={member.is_active ? 'outline-warning' : 'outline-success'}
                    size="sm"
                    onClick={() => toggleStaffStatus(member)}
                  >
                    <i className={`fas ${member.is_active ? 'fa-pause' : 'fa-play'} me-1`}></i>
                    {member.is_active ? (locale === 'es' ? 'Desactivar' : 'Deactivate') : (locale === 'es' ? 'Activar' : 'Activate')}
                  </Button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* Staff Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-users me-2"></i>
            {editingStaff ? (locale === 'es' ? 'Editar Miembro del Personal' : 'Edit Staff Member') : (locale === 'es' ? 'Agregar Nuevo Miembro del Personal' : 'Add New Staff Member')}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    {locale === 'es' ? 'Nombre a Mostrar *' : 'Display Name *'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    required
                    placeholder={locale === 'es' ? 'ej., Juan Pérez' : 'e.g., John Smith'}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    {locale === 'es' ? 'Rol *' : 'Role *'}
                  </Form.Label>
                  <Form.Select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'staff' }))}
                    required
                  >
                    <option value="staff">{locale === 'es' ? 'Personal' : 'Staff'}</option>
                    <option value="admin">{locale === 'es' ? 'Administrador' : 'Admin'}</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    {locale === 'es' ? 'Los administradores pueden gestionar toda la configuración del negocio y personal' : 'Admins can manage all business settings and staff'}
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    {locale === 'es' ? 'Correo Electrónico' : 'Email'}
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={locale === 'es' ? 'juan@ejemplo.com' : 'john@example.com'}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    {locale === 'es' ? 'Teléfono' : 'Phone'}
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (787) 555-1234"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <div className="d-flex align-items-center">
                    <Form.Check
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="me-2"
                    />
                    <Form.Label htmlFor="is_active" className="mb-0">
                      {locale === 'es' ? 'Miembro del personal activo' : 'Active staff member'}
                    </Form.Label>
                  </div>
                  <Form.Text className="text-muted">
                    {locale === 'es' ? 'Los miembros del personal inactivos no pueden aceptar nuevas citas' : 'Inactive staff members cannot accept new appointments'}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            {!editingStaff && (
              <Alert variant="info" className="mt-3">
                <i className="fas fa-info-circle me-2"></i>
                <strong>{locale === 'es' ? 'Nota:' : 'Note:'}</strong> {locale === 'es' ? 'Los miembros del personal necesitarán crear una cuenta para acceder a su panel. Pueden usar la misma dirección de correo que proporciones aquí.' : 'Staff members will need to create an account to access their dashboard. They can use the same email address you provide here.'}
              </Alert>
            )}
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
                  {editingStaff ? (locale === 'es' ? 'Actualizar Miembro del Personal' : 'Update Staff Member') : (locale === 'es' ? 'Agregar Miembro del Personal' : 'Add Staff Member')}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}