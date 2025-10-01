'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Row, Col, Card, Button, Alert, Badge, Modal, Form } from 'react-bootstrap'
import { supabase } from '@/lib/supabase'

interface Business {
  id: string
  name: string
  slug: string
  location: string
  logo_url: string
  primary_color: string
  secondary_color: string
  has_hero_section: boolean
  hero_title: string
  hero_subtitle: string
  hero_image_url: string
  branding_completed: boolean
}

interface Service {
  id: string
  name: string
  description: string
  duration_min: number
  price_cents: number
}

export default function LandingPageManagement() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    loadBusinessData()
    
    // Check if we just updated branding
    if (searchParams.get('updated') === 'true') {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [])

  const loadBusinessData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (businessError) {
        console.error('Error loading business:', businessError)
        return
      }

      setBusiness(businessData)

      // Load services for preview
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessData.id)
        .order('price_cents', { ascending: true })

      if (servicesData) {
        setServices(servicesData)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setLoading(false)
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const generateQRCode = (url: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
  }

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    )
  }

  if (!business) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <h5>No Business Found</h5>
          <p>You need to create a business first.</p>
          <Button href="/dashboard/onboarding">Create Business</Button>
        </Alert>
      </Container>
    )
  }

  const landingPageUrl = `${window.location.origin}/${business.slug}`
  const bookingUrl = `${window.location.origin}/book/${business.slug}`

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold">Landing Page</h2>
              <p className="text-muted mb-0">Manage your business landing page and QR codes</p>
            </div>
            <div>
              <Button 
                variant="outline-primary" 
                className="me-2"
                href={`/${business.slug}`}
                target="_blank"
              >
                <i className="fas fa-external-link-alt me-2"></i>
                View Live Page
              </Button>
              <Button 
                variant="primary"
                onClick={() => router.push('/dashboard/branding-setup')}
              >
                <i className="fas fa-edit me-2"></i>
                Edit Branding
              </Button>
            </div>
          </div>

          {showSuccess && (
            <Alert variant="success" className="mb-4" dismissible onClose={() => setShowSuccess(false)}>
              <i className="fas fa-check-circle me-2"></i>
              <strong>Branding updated successfully!</strong> Your landing page has been updated with your new branding.
            </Alert>
          )}

          <Row>
            {/* Landing Page Status */}
            <Col lg={8}>
              <Card className="mb-4">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="fw-bold">Landing Page Status</h5>
                      <p className="text-muted mb-0">Your branded booking page</p>
                    </div>
                    <Badge bg={business.branding_completed ? 'success' : 'warning'}>
                      {business.branding_completed ? 'Active' : 'Basic'}
                    </Badge>
                  </div>

                  {business.branding_completed ? (
                    <div>
                      <div className="row align-items-center">
                        <div className="col-md-8">
                          <h6 className="text-success">✅ Your landing page is live!</h6>
                          <p className="mb-3">
                            Customers who scan your QR code will see a beautiful branded page 
                            with your logo, colors, and hero section.
                          </p>
                          <div className="mb-3">
                            <strong>Landing Page URL:</strong>
                            <div className="input-group mt-1">
                              <input 
                                type="text" 
                                className="form-control" 
                                value={landingPageUrl}
                                readOnly 
                              />
                              <Button 
                                variant="outline-secondary"
                                onClick={() => copyToClipboard(landingPageUrl)}
                              >
                                Copy
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4 text-center">
                          {business.logo_url && (
                            <img 
                              src={business.logo_url} 
                              alt="Logo"
                              style={{ maxHeight: '60px' }}
                              className="mb-2"
                            />
                          )}
                          <div 
                            className="p-2 rounded text-white small"
                            style={{ backgroundColor: business.primary_color }}
                          >
                            Preview Colors
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="alert alert-warning">
                        <h6>⚠️ Using basic booking page</h6>
                        <p className="mb-2">
                          Your QR code currently shows a basic booking form. Complete your branding 
                          setup to create a professional landing page.
                        </p>
                        <Button 
                          variant="warning" 
                          size="sm"
                          onClick={() => router.push('/dashboard/branding-setup')}
                        >
                          Complete Branding Setup
                        </Button>
                      </div>
                      <div className="mb-3">
                        <strong>Current Booking URL:</strong>
                        <div className="input-group mt-1">
                          <input 
                            type="text" 
                            className="form-control" 
                            value={bookingUrl}
                            readOnly 
                          />
                          <Button 
                            variant="outline-secondary"
                            onClick={() => copyToClipboard(bookingUrl)}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="d-flex gap-2 mt-3">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => setShowPreview(true)}
                    >
                      <i className="fas fa-eye me-1"></i>
                      Preview
                    </Button>
                    <Button 
                      variant="outline-success" 
                      size="sm"
                      onClick={() => setShowQRCode(true)}
                    >
                      <i className="fas fa-qrcode me-1"></i>
                      QR Code
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              {/* Services Preview */}
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Services on Landing Page</h6>
                </Card.Header>
                <Card.Body>
                  {services.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="fas fa-plus-circle fa-2x mb-3"></i>
                      <p>No services added yet</p>
                      <Button 
                        variant="primary" 
                        size="sm"
                        href="/dashboard/services"
                      >
                        Add Services
                      </Button>
                    </div>
                  ) : (
                    <div className="row">
                      {services.slice(0, 3).map((service) => (
                        <div key={service.id} className="col-md-4 mb-3">
                          <div className="border rounded p-3 h-100">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="mb-0">{service.name}</h6>
                              <Badge bg="success">{formatPrice(service.price_cents)}</Badge>
                            </div>
                            {service.description && (
                              <p className="small text-muted mb-2">{service.description}</p>
                            )}
                            <small className="text-muted">
                              <i className="fas fa-clock me-1"></i>
                              {formatDuration(service.duration_min)}
                            </small>
                          </div>
                        </div>
                      ))}
                      {services.length > 3 && (
                        <div className="col-md-4 mb-3">
                          <div className="border rounded p-3 h-100 d-flex align-items-center justify-content-center text-muted">
                            <div className="text-center">
                              <div>+{services.length - 3} more</div>
                              <small>services</small>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Quick Actions */}
            <Col lg={4}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Quick Actions</h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button 
                      variant="outline-primary"
                      onClick={() => router.push('/dashboard/branding-setup')}
                    >
                      <i className="fas fa-palette me-2"></i>
                      Edit Branding
                    </Button>
                    <Button 
                      variant="outline-secondary"
                      href={`/${business.slug}`}
                      target="_blank"
                    >
                      <i className="fas fa-external-link-alt me-2"></i>
                      View Live Page
                    </Button>
                    <Button 
                      variant="outline-success"
                      onClick={() => setShowQRCode(true)}
                    >
                      <i className="fas fa-qrcode me-2"></i>
                      Download QR Code
                    </Button>
                    <Button 
                      variant="outline-info"
                      href="/dashboard/services"
                    >
                      <i className="fas fa-cog me-2"></i>
                      Manage Services
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              {/* Landing Page Tips */}
              <Card className="mt-3">
                <Card.Header>
                  <h6 className="mb-0">💡 Tips</h6>
                </Card.Header>
                <Card.Body>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <small>
                        <i className="fas fa-lightbulb text-warning me-2"></i>
                        Use a high-quality logo for best results
                      </small>
                    </li>
                    <li className="mb-2">
                      <small>
                        <i className="fas fa-palette text-info me-2"></i>
                        Choose colors that match your brand
                      </small>
                    </li>
                    <li className="mb-2">
                      <small>
                        <i className="fas fa-camera text-success me-2"></i>
                        Add a hero image to make a great first impression
                      </small>
                    </li>
                    <li>
                      <small>
                        <i className="fas fa-mobile-alt text-primary me-2"></i>
                        Test your page on mobile devices
                      </small>
                    </li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Preview Modal */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Landing Page Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            <Badge bg="info">This is how your page looks to customers</Badge>
          </div>
          <iframe 
            src={`/${business.slug}`}
            style={{ width: '100%', height: '600px', border: '1px solid #dee2e6' }}
            title="Landing Page Preview"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
          <Button 
            variant="primary"
            href={`/${business.slug}`}
            target="_blank"
          >
            Open in New Tab
          </Button>
        </Modal.Footer>
      </Modal>

      {/* QR Code Modal */}
      <Modal show={showQRCode} onHide={() => setShowQRCode(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="mb-4">
            <img 
              src={generateQRCode(business.branding_completed ? landingPageUrl : bookingUrl)}
              alt="QR Code"
              className="img-fluid"
              style={{ maxWidth: '200px' }}
            />
          </div>
          <p className="mb-3">
            <strong>Scan to visit:</strong><br />
            <code>{business.branding_completed ? landingPageUrl : bookingUrl}</code>
          </p>
          <div className="d-grid gap-2">
            <Button 
              variant="primary"
              onClick={() => {
                const link = document.createElement('a')
                link.href = generateQRCode(business.branding_completed ? landingPageUrl : bookingUrl)
                link.download = `${business.name}-qr-code.png`
                link.click()
              }}
            >
              <i className="fas fa-download me-2"></i>
              Download QR Code
            </Button>
            <Button 
              variant="outline-secondary"
              onClick={() => copyToClipboard(business.branding_completed ? landingPageUrl : bookingUrl)}
            >
              <i className="fas fa-copy me-2"></i>
              Copy URL
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  )
}