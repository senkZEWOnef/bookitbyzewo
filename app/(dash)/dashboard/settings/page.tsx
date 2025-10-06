'use client'

import { useState, useEffect } from 'react'
import { Row, Col, Button, Alert, Form, Card } from 'react-bootstrap'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import { useLanguage } from '@/lib/language-context'
import ProfilePictureUpload from '@/components/ProfilePictureUpload'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const { language } = useLanguage()
  const locale = language === 'es' ? 'es' : 'en'
  
  const [business, setBusiness] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', content: '' })

  const [businessForm, setBusinessForm] = useState({
    name: '',
    slug: '',
    timezone: '',
    location: '',
    messaging_mode: 'manual'
  })

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      setUser(user)

      // Get profile data from database
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Set profile form with current user data
      setProfileForm({
        full_name: profileData?.full_name || user.user_metadata?.full_name || '',
        phone: profileData?.phone || user.user_metadata?.phone || '',
        avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url || ''
      })

      // Get business
      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (businessData) {
        setBusiness(businessData)
        setBusinessForm({
          name: businessData.name,
          slug: businessData.slug,
          timezone: businessData.timezone,
          location: businessData.location || '',
          messaging_mode: businessData.messaging_mode || 'manual'
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBusinessUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) return

    setSubmitting(true)
    setMessage({ type: '', content: '' })

    try {
      const supabase = createSupabaseClient()
      
      const { error } = await supabase
        .from('businesses')
        .update({
          ...businessForm,
          updated_at: new Date().toISOString()
        })
        .eq('id', business.id)

      if (error) throw error

      setMessage({ 
        type: 'success', 
        content: locale === 'es' ? '¡Configuración del negocio actualizada exitosamente!' : 'Business settings updated successfully!' 
      })
      setBusiness((prev: any) => ({ ...prev, ...businessForm }))
    } catch (error) {
      console.error('Error updating business:', error)
      setMessage({ 
        type: 'error', 
        content: locale === 'es' ? 'Error al actualizar configuración del negocio.' : 'Failed to update business settings.' 
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    setMessage({ type: '', content: '' })

    try {
      const supabase = createSupabaseClient()
      
      // Update profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          avatar_url: profileForm.avatar_url,
          updated_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          avatar_url: profileForm.avatar_url
        }
      })

      if (authError) throw authError

      setMessage({ 
        type: 'success', 
        content: locale === 'es' ? '¡Perfil actualizado exitosamente!' : 'Profile updated successfully!' 
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ 
        type: 'error', 
        content: locale === 'es' ? 'Error al actualizar perfil.' : 'Failed to update profile.' 
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    try {
      const supabase = createSupabaseClient()
      
      // Note: In a real app, you'd want to handle this server-side
      // This is just for demo purposes
      setMessage({ 
        type: 'error', 
        content: locale === 'es' ? 'La eliminación de cuenta no está disponible en modo demo.' : 'Account deletion is not available in demo mode.' 
      })
    } catch (error) {
      console.error('Error deleting account:', error)
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

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <div 
            className="rounded-3 bg-gradient p-3 text-white d-flex align-items-center"
            style={{ background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' }}
          >
            <i className="fas fa-cog fs-4"></i>
          </div>
          <div>
            <h2 className="mb-0 fw-bold text-gray-900">
              {locale === 'es' ? 'Configuración' : 'Settings'}
            </h2>
            <p className="text-muted mb-0">
              {locale === 'es' ? 'Gestiona tu cuenta y preferencias del negocio' : 'Manage your account and business preferences'}
            </p>
          </div>
        </div>
      </div>

      {message.content && (
        <Alert variant={message.type === 'success' ? 'success' : 'danger'} className="mb-4">
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2`}></i>
          {message.content}
        </Alert>
      )}

      <Row className="g-4">
        {/* Profile Settings */}
        <Col lg={6}>
          <div className="glass-card p-4 rounded-4">
            <div className="d-flex align-items-center mb-4">
              <div className="me-3">
                {user && (
                  <ProfilePictureUpload
                    currentPictureUrl={profileForm.avatar_url}
                    onPictureUpdate={(url) => setProfileForm(prev => ({ ...prev, avatar_url: url }))}
                    userId={user.id}
                  />
                )}
              </div>
              <div>
                <h5 className="mb-0 fw-bold">
                  {locale === 'es' ? 'Configuración del Perfil' : 'Profile Settings'}
                </h5>
                <small className="text-muted">
                  {locale === 'es' ? 'Actualiza tu información personal y foto' : 'Update your personal information and photo'}
                </small>
              </div>
            </div>

            <Form onSubmit={handleProfileUpdate}>
              <Form.Group className="mb-3">
                <Form.Label>
                  {locale === 'es' ? 'Nombre Completo' : 'Full Name'}
                </Form.Label>
                <Form.Control
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder={locale === 'es' ? 'Tu nombre completo' : 'Your full name'}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  {locale === 'es' ? 'Número de Teléfono' : 'Phone Number'}
                </Form.Label>
                <Form.Control
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (787) 555-1234"
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>
                  {locale === 'es' ? 'Dirección de Correo' : 'Email Address'}
                </Form.Label>
                <Form.Control
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <Form.Text className="text-muted">
                  {locale === 'es' ? 'El correo no se puede cambiar. Contacta soporte si es necesario.' : 'Email cannot be changed. Contact support if needed.'}
                </Form.Text>
              </Form.Group>

              <Button variant="success" type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    {locale === 'es' ? 'Actualizando...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-1"></i>
                    {locale === 'es' ? 'Actualizar Perfil' : 'Update Profile'}
                  </>
                )}
              </Button>
            </Form>
          </div>
        </Col>

        {/* Business Settings */}
        <Col lg={6}>
          {business ? (
            <div className="glass-card p-4 rounded-4">
              <div className="d-flex align-items-center mb-4">
                <div 
                  className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '50px', 
                    height: '50px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: 'white'
                  }}
                >
                  <i className="fas fa-store fs-5"></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">
                    {locale === 'es' ? 'Configuración del Negocio' : 'Business Settings'}
                  </h5>
                  <small className="text-muted">
                    {locale === 'es' ? 'Configura los detalles de tu negocio' : 'Configure your business details'}
                  </small>
                </div>
              </div>

              <Form onSubmit={handleBusinessUpdate}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {locale === 'es' ? 'Nombre del Negocio' : 'Business Name'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    {locale === 'es' ? 'Identificador del Negocio' : 'Business Slug'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={businessForm.slug}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, slug: e.target.value }))}
                    required
                  />
                  <Form.Text className="text-muted">
                    {locale === 'es' ? 'Tu URL de reservas: /book/' : 'Your booking URL: /book/'}{businessForm.slug}
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    {locale === 'es' ? 'Ubicación' : 'Location'}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={businessForm.location}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={locale === 'es' ? '123 Calle Principal, Ciudad, Estado' : '123 Main St, City, State'}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    {locale === 'es' ? 'Zona Horaria' : 'Timezone'}
                  </Form.Label>
                  <Form.Select
                    value={businessForm.timezone}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, timezone: e.target.value }))}
                    required
                  >
                    <option value="">{locale === 'es' ? 'Selecciona zona horaria' : 'Select timezone'}</option>
                    <option value="America/New_York">{locale === 'es' ? 'Hora del Este' : 'Eastern Time'}</option>
                    <option value="America/Chicago">{locale === 'es' ? 'Hora Central' : 'Central Time'}</option>
                    <option value="America/Denver">{locale === 'es' ? 'Hora de la Montaña' : 'Mountain Time'}</option>
                    <option value="America/Los_Angeles">{locale === 'es' ? 'Hora del Pacífico' : 'Pacific Time'}</option>
                    <option value="America/Puerto_Rico">{locale === 'es' ? 'Hora de Puerto Rico' : 'Puerto Rico Time'}</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    {locale === 'es' ? 'Modo de Mensajería' : 'Messaging Mode'}
                  </Form.Label>
                  <Form.Select
                    value={businessForm.messaging_mode}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, messaging_mode: e.target.value }))}
                  >
                    <option value="manual">{locale === 'es' ? 'Manual' : 'Manual'}</option>
                    <option value="auto">{locale === 'es' ? 'Automático' : 'Automatic'}</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    {locale === 'es' ? 'Cómo se manejan los mensajes de WhatsApp' : 'How WhatsApp messages are handled'}
                  </Form.Text>
                </Form.Group>

                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      {locale === 'es' ? 'Actualizando...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-1"></i>
                      {locale === 'es' ? 'Actualizar Negocio' : 'Update Business'}
                    </>
                  )}
                </Button>
              </Form>
            </div>
          ) : (
            <div className="glass-card p-4 rounded-4 text-center">
              <div 
                className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{ 
                  width: '80px', 
                  height: '80px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)',
                  border: '2px dashed #6366f1'
                }}
              >
                <i className="fas fa-store fs-2 text-primary"></i>
              </div>
              <h5 className="fw-bold mb-2">No Business Found</h5>
              <p className="text-muted mb-3">Create a business to configure settings</p>
              <Link href="/dashboard/onboarding">
                <Button variant="primary">
                  <i className="fas fa-plus me-1"></i>
                  Create Business
                </Button>
              </Link>
            </div>
          )}
        </Col>

        {/* Quick Actions */}
        <Col lg={6}>
          <div className="glass-card p-4 rounded-4">
            <div className="d-flex align-items-center mb-4">
              <div 
                className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                style={{ 
                  width: '50px', 
                  height: '50px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white'
                }}
              >
                <i className="fas fa-bolt fs-5"></i>
              </div>
              <div>
                <h5 className="mb-0 fw-bold">Quick Actions</h5>
                <small className="text-muted">Common tasks and shortcuts</small>
              </div>
            </div>

            <div className="d-grid gap-3">
              {business && (
                <Link href={`/book/${business.slug}`} target="_blank" className="text-decoration-none">
                  <div 
                    className="p-3 rounded-3 border-0 w-100 text-start hover-lift"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.1) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <i className="fas fa-external-link-alt fs-4 text-success me-3"></i>
                      <div>
                        <div className="fw-semibold text-dark">View Booking Page</div>
                        <small className="text-muted">See how customers book appointments</small>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              <Link href="/dashboard/services" className="text-decoration-none">
                <div 
                  className="p-3 rounded-3 border-0 w-100 text-start hover-lift"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(79, 70, 229, 0.1) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div className="d-flex align-items-center">
                    <i className="fas fa-cogs fs-4 text-primary me-3"></i>
                    <div>
                      <div className="fw-semibold text-dark">Manage Services</div>
                      <small className="text-muted">Add, edit, or remove services</small>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/staff" className="text-decoration-none">
                <div 
                  className="p-3 rounded-3 border-0 w-100 text-start hover-lift"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.1) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div className="d-flex align-items-center">
                    <i className="fas fa-users fs-4 text-warning me-3"></i>
                    <div>
                      <div className="fw-semibold text-dark">Manage Staff</div>
                      <small className="text-muted">Add team members and set permissions</small>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </Col>

        {/* Danger Zone */}
        <Col lg={6}>
          <div 
            className="glass-card p-4 rounded-4"
            style={{ 
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.02) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.1)'
            }}
          >
            <div className="d-flex align-items-center mb-4">
              <div 
                className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                style={{ 
                  width: '50px', 
                  height: '50px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white'
                }}
              >
                <i className="fas fa-exclamation-triangle fs-5"></i>
              </div>
              <div>
                <h5 className="mb-0 fw-bold text-danger">
                  {locale === 'es' ? 'Zona de Peligro' : 'Danger Zone'}
                </h5>
                <small className="text-muted">
                  {locale === 'es' ? 'Acciones irreversibles' : 'Irreversible actions'}
                </small>
              </div>
            </div>

            <p className="text-muted mb-3">
              {locale === 'es' 
                ? 'Una vez que elimines tu cuenta, no hay marcha atrás. Por favor asegúrate.'
                : 'Once you delete your account, there is no going back. Please be certain.'
              }
            </p>

            <Button 
              variant="outline-danger" 
              onClick={handleDeleteAccount}
            >
              <i className="fas fa-trash me-1"></i>
              {locale === 'es' ? 'Eliminar Cuenta' : 'Delete Account'}
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  )
}