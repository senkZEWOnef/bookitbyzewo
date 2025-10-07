'use client'

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Nav, Tab, Alert } from 'react-bootstrap'
import { createSupabaseClient } from '@/lib/supabase'

interface WebpageSettings {
  heroBackgroundColor: string
  heroBackgroundImage: string
  heroTitle: string
  heroSubtitle: string
  businessName: string
  businessDescription: string
  socialMedia: {
    facebook: string
    instagram: string
    whatsapp: string
    website: string
  }
}

const defaultSettings: WebpageSettings = {
  heroBackgroundColor: '#10b981',
  heroBackgroundImage: '',
  heroTitle: 'Book Your Appointment',
  heroSubtitle: 'Professional services at your convenience',
  businessName: '',
  businessDescription: '',
  socialMedia: {
    facebook: '',
    instagram: '',
    whatsapp: '',
    website: ''
  }
}

export default function WebpagePage() {
  const [settings, setSettings] = useState<WebpageSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [business, setBusiness] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const supabase = createSupabaseClient()

  useEffect(() => {
    loadBusinessData()
  }, [])

  const loadBusinessData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get business data
      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (businessData) {
        setBusiness(businessData)
        
        // Load existing webpage settings or use defaults
        const savedSettings = businessData.webpage_settings || {}
        setSettings({
          ...defaultSettings,
          businessName: businessData.name,
          businessDescription: businessData.description || '',
          ...savedSettings
        })

        // Get services
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('business_id', businessData.id)
          .order('name')

        setServices(servicesData || [])
      }
    } catch (error) {
      console.error('Error loading business data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!business) return
    
    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          webpage_settings: settings,
          description: settings.businessDescription
        })
        .eq('id', business.id)

      if (error) throw error

      setMessage('Webpage settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage('Error saving settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (updates: Partial<WebpageSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  const updateSocialMedia = (platform: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }))
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container fluid>
      <Row>
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-edit me-2"></i>
                Webpage Editor
              </h5>
            </Card.Header>
            <Card.Body>
              {message && (
                <Alert variant={message.includes('Error') ? 'danger' : 'success'}>
                  {message}
                </Alert>
              )}

              <Tab.Container defaultActiveKey="hero">
                <Nav variant="tabs" className="mb-4">
                  <Nav.Item>
                    <Nav.Link eventKey="hero">
                      <i className="fas fa-star me-1"></i>
                      Hero Section
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="business">
                      <i className="fas fa-building me-1"></i>
                      Business Info
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="social">
                      <i className="fas fa-share-alt me-1"></i>
                      Social Media
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                <Tab.Content>
                  <Tab.Pane eventKey="hero">
                    <Form.Group className="mb-3">
                      <Form.Label>Hero Title</Form.Label>
                      <Form.Control
                        type="text"
                        value={settings.heroTitle}
                        onChange={(e) => updateSettings({ heroTitle: e.target.value })}
                        placeholder="Book Your Appointment"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Hero Subtitle</Form.Label>
                      <Form.Control
                        type="text"
                        value={settings.heroSubtitle}
                        onChange={(e) => updateSettings({ heroSubtitle: e.target.value })}
                        placeholder="Professional services at your convenience"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Background Color</Form.Label>
                      <div className="d-flex align-items-center gap-2">
                        <Form.Control
                          type="color"
                          value={settings.heroBackgroundColor}
                          onChange={(e) => updateSettings({ heroBackgroundColor: e.target.value })}
                          style={{ width: '60px' }}
                        />
                        <Form.Control
                          type="text"
                          value={settings.heroBackgroundColor}
                          onChange={(e) => updateSettings({ heroBackgroundColor: e.target.value })}
                          placeholder="#10b981"
                        />
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Background Image URL (optional)</Form.Label>
                      <Form.Control
                        type="url"
                        value={settings.heroBackgroundImage}
                        onChange={(e) => updateSettings({ heroBackgroundImage: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                      <Form.Text className="text-muted">
                        Leave empty to use background color only
                      </Form.Text>
                    </Form.Group>
                  </Tab.Pane>

                  <Tab.Pane eventKey="business">
                    <Form.Group className="mb-3">
                      <Form.Label>Business Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={settings.businessName}
                        onChange={(e) => updateSettings({ businessName: e.target.value })}
                        placeholder="Your Business Name"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Business Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={settings.businessDescription}
                        onChange={(e) => updateSettings({ businessDescription: e.target.value })}
                        placeholder="Describe your business and services..."
                      />
                    </Form.Group>
                  </Tab.Pane>

                  <Tab.Pane eventKey="social">
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="fab fa-facebook text-primary me-2"></i>
                        Facebook URL
                      </Form.Label>
                      <Form.Control
                        type="url"
                        value={settings.socialMedia.facebook}
                        onChange={(e) => updateSocialMedia('facebook', e.target.value)}
                        placeholder="https://facebook.com/yourbusiness"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="fab fa-instagram text-danger me-2"></i>
                        Instagram URL
                      </Form.Label>
                      <Form.Control
                        type="url"
                        value={settings.socialMedia.instagram}
                        onChange={(e) => updateSocialMedia('instagram', e.target.value)}
                        placeholder="https://instagram.com/yourbusiness"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="fab fa-whatsapp text-success me-2"></i>
                        WhatsApp Number
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        value={settings.socialMedia.whatsapp}
                        onChange={(e) => updateSocialMedia('whatsapp', e.target.value)}
                        placeholder="+1234567890"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="fas fa-globe text-info me-2"></i>
                        Website URL
                      </Form.Label>
                      <Form.Control
                        type="url"
                        value={settings.socialMedia.website}
                        onChange={(e) => updateSocialMedia('website', e.target.value)}
                        placeholder="https://yourbusiness.com"
                      />
                    </Form.Group>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>

              <div className="d-flex justify-content-between align-items-center">
                <Button
                  variant="success"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-2"></i>
                      Save Changes
                    </>
                  )}
                </Button>

                {business && (
                  <a
                    href={`/book/${business.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary"
                  >
                    <i className="fas fa-external-link-alt me-2"></i>
                    View Live Page
                  </a>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-eye me-2"></i>
                Live Preview
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="preview-container" style={{ height: '600px', overflow: 'auto' }}>
                {/* Hero Section Preview */}
                <div
                  className="text-white d-flex align-items-center justify-content-center"
                  style={{
                    height: '300px',
                    backgroundColor: settings.heroBackgroundColor,
                    backgroundImage: settings.heroBackgroundImage ? `url(${settings.heroBackgroundImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}
                >
                  {settings.heroBackgroundImage && (
                    <div 
                      className="position-absolute w-100 h-100" 
                      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                    />
                  )}
                  <div className="text-center position-relative">
                    <h1 className="display-5 fw-bold mb-3">{settings.heroTitle}</h1>
                    <p className="lead mb-4">{settings.heroSubtitle}</p>
                    <Button variant="light" size="lg">
                      Book Now
                    </Button>
                  </div>
                </div>

                {/* Services Section Preview */}
                <div className="p-4 bg-light">
                  <div className="text-center mb-4">
                    <h2 className="fw-bold">{settings.businessName}</h2>
                    {settings.businessDescription && (
                      <p className="text-muted">{settings.businessDescription}</p>
                    )}
                  </div>

                  <Row>
                    <Col md={6}>
                      <h4 className="mb-3">Our Services</h4>
                      {services.length > 0 ? (
                        services.slice(0, 3).map((service) => (
                          <Card key={service.id} className="mb-2">
                            <Card.Body className="py-2">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <h6 className="mb-1">{service.name}</h6>
                                  <small className="text-muted">{service.duration_min} min</small>
                                </div>
                                <div className="text-end">
                                  <strong>${(service.price_cents / 100).toFixed(2)}</strong>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        ))
                      ) : (
                        <p className="text-muted">No services available</p>
                      )}
                    </Col>
                    <Col md={6}>
                      <h4 className="mb-3">Book Appointment</h4>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-muted text-center">
                          <i className="fas fa-calendar-alt fa-2x mb-2 d-block"></i>
                          Interactive calendar will appear here
                        </p>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Footer Preview */}
                <div className="bg-dark text-white p-4">
                  <Row>
                    <Col md={6}>
                      <h5>{settings.businessName}</h5>
                      <p className="mb-0">Professional booking made easy</p>
                    </Col>
                    <Col md={6}>
                      <h6>Follow Us</h6>
                      <div className="d-flex gap-3">
                        {settings.socialMedia.facebook && (
                          <a href={settings.socialMedia.facebook} className="text-white">
                            <i className="fab fa-facebook fa-lg"></i>
                          </a>
                        )}
                        {settings.socialMedia.instagram && (
                          <a href={settings.socialMedia.instagram} className="text-white">
                            <i className="fab fa-instagram fa-lg"></i>
                          </a>
                        )}
                        {settings.socialMedia.whatsapp && (
                          <a href={`https://wa.me/${settings.socialMedia.whatsapp}`} className="text-white">
                            <i className="fab fa-whatsapp fa-lg"></i>
                          </a>
                        )}
                        {settings.socialMedia.website && (
                          <a href={settings.socialMedia.website} className="text-white">
                            <i className="fas fa-globe fa-lg"></i>
                          </a>
                        )}
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}