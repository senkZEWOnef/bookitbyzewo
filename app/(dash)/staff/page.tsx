'use client'

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap'
import { createSupabaseClient } from '@/lib/supabase'
import { Staff, Service } from '@/types/database'

interface StaffFormData {
  display_name: string
  phone: string
  role: 'member' | 'admin'
  serviceIds: string[]
}

const initialFormData: StaffFormData = {
  display_name: '',
  phone: '',
  role: 'member',
  serviceIds: []
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [businessId, setBusinessId] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [formData, setFormData] = useState<StaffFormData>(initialFormData)
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

      // Get user's business
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!business) return

      setBusinessId(business.id)

      // Get staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('business_id', business.id)
        .order('display_name')

      if (staffError) throw staffError
      setStaff(staffData || [])

      // Get services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', business.id)
        .order('name')

      if (servicesError) throw servicesError
      setServices(servicesData || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  const fetchStaffServices = async (staffId: string) => {
    const { data } = await supabase
      .from('service_staff')
      .select('service_id')
      .eq('staff_id', staffId)

    return data?.map((item: any) => item.service_id) || []
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (editingStaff) {
        // Update existing staff
        const { error: updateError } = await supabase
          .from('staff')
          .update({
            display_name: formData.display_name,
            phone: formData.phone,
            role: formData.role
          })
          .eq('id', editingStaff.id)

        if (updateError) throw updateError

        // Update service assignments
        // First delete existing assignments
        await supabase
          .from('service_staff')
          .delete()
          .eq('staff_id', editingStaff.id)

        // Then insert new assignments
        if (formData.serviceIds.length > 0) {
          const serviceAssignments = formData.serviceIds.map(serviceId => ({
            staff_id: editingStaff.id,
            service_id: serviceId
          }))

          const { error: assignError } = await supabase
            .from('service_staff')
            .insert(serviceAssignments)

          if (assignError) throw assignError
        }
      } else {
        // Create new staff
        console.log('Creating staff with data:', {
          ...formData,
          business_id: businessId,
          user_id: null
        })
        
        const { data: newStaff, error: insertError } = await supabase
          .from('staff')
          .insert({
            display_name: formData.display_name,
            phone: formData.phone,
            role: formData.role,
            business_id: businessId,
            user_id: null // For now, staff are not linked to user accounts
          })
          .select()
          .single()

        console.log('Staff creation result:', { newStaff, insertError })
        
        if (insertError) {
          console.error('Staff insert error details:', {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint
          })
          throw new Error(`Failed to create staff: ${insertError.message}`)
        }

        // Add service assignments
        if (formData.serviceIds.length > 0) {
          const serviceAssignments = formData.serviceIds.map(serviceId => ({
            staff_id: newStaff.id,
            service_id: serviceId
          }))

          const { error: assignError } = await supabase
            .from('service_staff')
            .insert(serviceAssignments)

          if (assignError) throw assignError
        }
      }

      setShowModal(false)
      setEditingStaff(null)
      setFormData(initialFormData)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save staff member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (staffMember: Staff) => {
    setEditingStaff(staffMember)
    
    // Fetch staff services
    const serviceIds = await fetchStaffServices(staffMember.id)
    
    setFormData({
      display_name: staffMember.display_name,
      phone: staffMember.phone || '',
      role: staffMember.role,
      serviceIds
    })
    setShowModal(true)
  }

  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return

    try {
      // Delete service assignments first
      await supabase
        .from('service_staff')
        .delete()
        .eq('staff_id', staffId)

      // Delete staff member
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId)

      if (error) throw error
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff member')
    }
  }

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId]
    }))
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p className="mt-2">Loading staff...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Staff Management</h1>
          <p className="text-muted">Manage your team members and their service assignments</p>
        </div>
        <Button 
          variant="success" 
          onClick={() => {
            setEditingStaff(null)
            setFormData(initialFormData)
            setShowModal(true)
          }}
        >
          <i className="fas fa-user-plus me-1"></i>
          Add Staff Member
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {staff.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <i className="fas fa-users fa-3x text-muted mb-3"></i>
            <h5>No Staff Members Yet</h5>
            <p className="text-muted">Add your first team member to start scheduling appointments</p>
            <Button 
              variant="success" 
              onClick={() => {
                setEditingStaff(null)
                setFormData(initialFormData)
                setShowModal(true)
              }}
            >
              <i className="fas fa-user-plus me-1"></i>
              Add First Staff Member
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {staff.map(staffMember => (
            <Col md={6} lg={4} key={staffMember.id} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="mb-1">{staffMember.display_name}</h5>
                      <Badge bg={staffMember.role === 'admin' ? 'primary' : 'secondary'}>
                        {staffMember.role === 'admin' ? 'Admin' : 'Member'}
                      </Badge>
                    </div>
                    <div className="dropdown">
                      <Button variant="link" size="sm" data-bs-toggle="dropdown">
                        <i className="fas fa-ellipsis-v"></i>
                      </Button>
                      <ul className="dropdown-menu">
                        <li>
                          <button 
                            className="dropdown-item" 
                            onClick={() => handleEdit(staffMember)}
                          >
                            <i className="fas fa-edit me-2"></i>
                            Edit
                          </button>
                        </li>
                        <li>
                          <button 
                            className="dropdown-item text-danger" 
                            onClick={() => handleDelete(staffMember.id)}
                          >
                            <i className="fas fa-trash me-2"></i>
                            Remove
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {staffMember.phone && (
                    <div className="mb-3">
                      <small className="text-muted">Phone:</small><br />
                      <span>{staffMember.phone}</span>
                    </div>
                  )}

                  <div className="mb-3">
                    <small className="text-muted">Services:</small><br />
                    <StaffServices staffId={staffMember.id} services={services} />
                  </div>
                </Card.Body>
                <Card.Footer className="bg-transparent">
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => handleEdit(staffMember)}
                    >
                      <i className="fas fa-edit me-1"></i>
                      Edit
                    </Button>
                    {staffMember.phone && (
                      <Button 
                        variant="outline-success" 
                        size="sm"
                        href={`https://wa.me/${staffMember.phone.replace(/[^\d]/g, '')}`}
                        target="_blank"
                      >
                        <i className="fab fa-whatsapp me-1"></i>
                        Message
                      </Button>
                    )}
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Add/Edit Staff Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Display Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="e.g., Maria Rodriguez"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 787 555 0123"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'member' | 'admin' }))}
              >
                <option value="member">Member - Can view and manage their own appointments</option>
                <option value="admin">Admin - Can manage all business settings</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Services</Form.Label>
              <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {services.length === 0 ? (
                  <p className="text-muted mb-0">No services available. Create services first.</p>
                ) : (
                  services.map(service => (
                    <Form.Check
                      key={service.id}
                      type="checkbox"
                      id={`service-${service.id}`}
                      label={service.name}
                      checked={formData.serviceIds.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="mb-2"
                    />
                  ))
                )}
              </div>
              <Form.Text className="text-muted">
                Select which services this staff member can perform
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" disabled={submitting}>
              {submitting ? 'Saving...' : editingStaff ? 'Update Staff Member' : 'Add Staff Member'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

// Component to display staff services
function StaffServices({ staffId, services }: { staffId: string, services: Service[] }) {
  const [staffServices, setStaffServices] = useState<string[]>([])
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchStaffServices()
  }, [staffId])

  const fetchStaffServices = async () => {
    const { data } = await supabase
      .from('service_staff')
      .select('service_id')
      .eq('staff_id', staffId)

    if (data) {
      setStaffServices(data.map((item: any) => item.service_id))
    }
  }

  const assignedServices = services.filter(service => 
    staffServices.includes(service.id)
  )

  if (assignedServices.length === 0) {
    return <span className="text-muted">No services assigned</span>
  }

  return (
    <div className="d-flex flex-wrap gap-1">
      {assignedServices.map(service => (
        <Badge key={service.id} bg="light" text="dark" className="small">
          {service.name}
        </Badge>
      ))}
    </div>
  )
}