'use client'

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Nav, Tab, Alert } from 'react-bootstrap'

interface WebpageSettings {
  headerSection: {
    backgroundColor: string
    textColor: string
    showSocialIcons: boolean
    showNavigationButtons: boolean
  }
  heroBackgroundColor: string
  heroBackgroundImage: string
  heroTitle: string
  heroSubtitle: string
  businessName: string
  businessDescription: string
  rulesSection: {
    backgroundColor: string
    backgroundImage: string
    title: string
    depositRule: string
    latenessRule: string
    noshowRule: string
    cancellationRule: string
    additionalRules: string
  }
  footerSection: {
    backgroundColor: string
    backgroundImage: string
    textColor: string
    showPoweredBy: boolean
    customFooterText: string
    contactInfo: {
      address: string
      phone: string
      email: string
      hours: string
    }
  }
  socialMedia: {
    facebook: string
    instagram: string
    whatsapp: string
    website: string
  }
}

const defaultSettings: WebpageSettings = {
  headerSection: {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    showSocialIcons: true,
    showNavigationButtons: true
  },
  heroBackgroundColor: '#10b981',
  heroBackgroundImage: '',
  heroTitle: 'Book Your Appointment',
  heroSubtitle: 'Professional services at your convenience',
  businessName: 'Dev Hair Salon',
  businessDescription: 'Professional hair and beauty services',
  rulesSection: {
    backgroundColor: '#f8f9fa',
    backgroundImage: '',
    title: 'Booking Policies',
    depositRule: 'A $10 deposit is required to confirm your appointment',
    latenessRule: 'Please arrive on time. Late arrivals may result in shortened service',
    noshowRule: 'No-show appointments will forfeit their deposit',
    cancellationRule: 'Cancellations must be made 24 hours in advance for full refund',
    additionalRules: ''
  },
  footerSection: {
    backgroundColor: '#212529',
    backgroundImage: '',
    textColor: '#ffffff',
    showPoweredBy: true,
    customFooterText: 'Professional booking made easy',
    contactInfo: {
      address: '123 Main St, San Juan, PR',
      phone: '+1 (787) 555-0123',
      email: 'info@devhairsalon.com',
      hours: 'Mon-Fri: 9AM-5PM, Sat: 9AM-3PM'
    }
  },
  socialMedia: {
    facebook: '',
    instagram: '',
    whatsapp: '',
    website: ''
  }
}

export default function WebpagePage() {
  const [settings, setSettings] = useState<WebpageSettings>(defaultSettings)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [business, setBusiness] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])

  useEffect(() => {
    fetchBusinessData()
  }, [])

  const fetchBusinessData = async () => {
    setLoading(true)
    try {
      // Get user from localStorage
      const userString = localStorage.getItem('user')
      if (!userString) {
        console.log('❌ WEBPAGE: No user in localStorage, redirecting to login')
        window.location.href = '/login'
        return
      }
      
      const user = JSON.parse(userString)
      console.log('✅ WEBPAGE: User found:', user.id, user)

      // Fetch user's businesses from Neon database
      const response = await fetch('/api/debug/businesses')
      const result = await response.json()
      
      console.log('🔍 WEBPAGE: Business API response:', response.status, result)
      
      if (response.ok && result.businesses && result.businesses.length > 0) {
        console.log('🔍 WEBPAGE: All businesses:', result.businesses)
        console.log('🔍 WEBPAGE: Looking for owner_id:', user.id)
        
        // Find business owned by this user
        const userBusiness = result.businesses.find((b: any) => b.owner_id === user.id)
        
        if (userBusiness) {
          console.log('✅ WEBPAGE: Found user business:', userBusiness)
          setBusiness({
            id: userBusiness.id,
            name: userBusiness.name,
            slug: userBusiness.slug
          })

          // Fetch services for this business
          const servicesResponse = await fetch(`/api/business/${userBusiness.slug}`)
          const servicesResult = await servicesResponse.json()
          
          if (servicesResponse.ok) {
            setServices(servicesResult.services || [])
            console.log('✅ WEBPAGE: Found', servicesResult.services?.length || 0, 'services')
          }

          // Fetch existing webpage settings
          const settingsResponse = await fetch(`/api/webpage-settings?businessId=${userBusiness.id}`)
          const settingsResult = await settingsResponse.json()
          
          if (settingsResponse.ok && settingsResult.settings && Object.keys(settingsResult.settings).length > 0) {
            console.log('✅ WEBPAGE: Loaded existing settings')
            setSettings({ ...defaultSettings, ...settingsResult.settings })
          } else {
            console.log('📄 WEBPAGE: Using default settings')
            // Update default settings with actual business data
            setSettings(prev => ({
              ...prev,
              businessName: userBusiness.name,
              heroTitle: `Book Your Appointment at ${userBusiness.name}`,
              footerSection: {
                ...prev.footerSection,
                customFooterText: `${userBusiness.name} - Professional booking made easy`
              }
            }))
          }
        } else {
          console.log('❌ WEBPAGE: No business found for user:', user.id)
          setBusiness(null)
        }
      } else {
        console.log('❌ WEBPAGE: No businesses in database')
        setBusiness(null)
      }
    } catch (err) {
      console.error('WEBPAGE loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!business) {
      setMessage('No business found to save settings for')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      console.log('💾 WEBPAGE: Saving settings for business:', business.id)
      
      const response = await fetch('/api/webpage-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: business.id,
          settings: settings
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save settings')
      }

      console.log('✅ WEBPAGE: Settings saved successfully')
      setMessage('Webpage settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('🔴 WEBPAGE: Error saving settings:', error)
      setMessage(error instanceof Error ? error.message : 'Error saving settings. Please try again.')
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

  const updateRulesSection = (updates: Partial<WebpageSettings['rulesSection']>) => {
    setSettings(prev => ({
      ...prev,
      rulesSection: {
        ...prev.rulesSection,
        ...updates
      }
    }))
  }

  const updateFooterSection = (updates: Partial<WebpageSettings['footerSection']>) => {
    setSettings(prev => ({
      ...prev,
      footerSection: {
        ...prev.footerSection,
        ...updates
      }
    }))
  }

  const updateContactInfo = (updates: Partial<WebpageSettings['footerSection']['contactInfo']>) => {
    setSettings(prev => ({
      ...prev,
      footerSection: {
        ...prev.footerSection,
        contactInfo: {
          ...prev.footerSection.contactInfo,
          ...updates
        }
      }
    }))
  }

  const updateHeaderSection = (updates: Partial<WebpageSettings['headerSection']>) => {
    setSettings(prev => ({
      ...prev,
      headerSection: {
        ...prev.headerSection,
        ...updates
      }
    }))
  }

  const handleImageUpload = async (file: File, section: 'hero' | 'rules' | 'footer') => {
    // TEMP: Simulate image upload - in production, upload to storage service
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(reader.result as string)
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, section: 'hero' | 'rules' | 'footer') => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const imageUrl = await handleImageUpload(file, section)
        if (section === 'hero') {
          updateSettings({ heroBackgroundImage: imageUrl })
        } else if (section === 'rules') {
          updateRulesSection({ backgroundImage: imageUrl })
        } else if (section === 'footer') {
          updateFooterSection({ backgroundImage: imageUrl })
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        setMessage('Error uploading image. Please try again.')
      }
    }
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
      <Row className="g-4">
        <Col lg={6} className="order-2 order-lg-1">
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

              <Tab.Container defaultActiveKey="header">
                <Nav variant="tabs" className="mb-4 flex-wrap flex-sm-nowrap">
                  <Nav.Item>
                    <Nav.Link eventKey="header">
                      <i className="fas fa-window-maximize me-1"></i>
                      Header
                    </Nav.Link>
                  </Nav.Item>
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
                    <Nav.Link eventKey="rules">
                      <i className="fas fa-gavel me-1"></i>
                      Booking Rules
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="social">
                      <i className="fas fa-share-alt me-1"></i>
                      Social Media
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="footer">
                      <i className="fas fa-grip-lines me-1"></i>
                      Footer
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                <Tab.Content>
                  <Tab.Pane eventKey="header">
                    <Form.Group className="mb-3">
                      <Form.Label>Header Background Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={settings.headerSection.backgroundColor}
                        onChange={(e) => updateHeaderSection({ backgroundColor: e.target.value })}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Header Text Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={settings.headerSection.textColor}
                        onChange={(e) => updateHeaderSection({ textColor: e.target.value })}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="checkbox"
                        id="showNavigationButtons"
                        checked={settings.headerSection.showNavigationButtons}
                        onChange={(e) => updateHeaderSection({ showNavigationButtons: e.target.checked })}
                        label="Show Navigation Buttons (Book & Rules)"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="checkbox"
                        id="showSocialIcons"
                        checked={settings.headerSection.showSocialIcons}
                        onChange={(e) => updateHeaderSection({ showSocialIcons: e.target.checked })}
                        label="Show Social Media Icons (when links provided)"
                      />
                    </Form.Group>

                    <Alert variant="info" className="small">
                      <i className="fas fa-info-circle me-2"></i>
                      The header displays your business name and provides navigation to different sections. 
                      Social media icons will only appear if you've added links in the Social Media tab.
                    </Alert>
                  </Tab.Pane>

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
                      <Form.Label>Background Image (optional)</Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'hero')}
                      />
                      {settings.heroBackgroundImage && (
                        <div className="mt-2">
                          <img 
                            src={settings.heroBackgroundImage} 
                            alt="Hero background preview" 
                            style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'cover' }}
                            className="rounded"
                          />
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="ms-2"
                            onClick={() => updateSettings({ heroBackgroundImage: '' })}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                      <Form.Text className="text-muted">
                        Upload an image or leave empty to use background color only
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

                  <Tab.Pane eventKey="rules">
                    <Form.Group className="mb-3">
                      <Form.Label>Section Title</Form.Label>
                      <Form.Control
                        type="text"
                        value={settings.rulesSection.title}
                        onChange={(e) => updateRulesSection({ title: e.target.value })}
                        placeholder="Booking Policies"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Background Color</Form.Label>
                      <div className="d-flex align-items-center gap-2">
                        <Form.Control
                          type="color"
                          value={settings.rulesSection.backgroundColor}
                          onChange={(e) => updateRulesSection({ backgroundColor: e.target.value })}
                          style={{ width: '60px' }}
                        />
                        <Form.Control
                          type="text"
                          value={settings.rulesSection.backgroundColor}
                          onChange={(e) => updateRulesSection({ backgroundColor: e.target.value })}
                          placeholder="#f8f9fa"
                        />
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Background Image (optional)</Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'rules')}
                      />
                      {settings.rulesSection.backgroundImage && (
                        <div className="mt-2">
                          <img 
                            src={settings.rulesSection.backgroundImage} 
                            alt="Rules background preview" 
                            style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'cover' }}
                            className="rounded"
                          />
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="ms-2"
                            onClick={() => updateRulesSection({ backgroundImage: '' })}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="fas fa-credit-card me-1"></i>
                        Deposit Policy
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={settings.rulesSection.depositRule}
                        onChange={(e) => updateRulesSection({ depositRule: e.target.value })}
                        placeholder="A $10 deposit is required to confirm your appointment"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="fas fa-clock me-1"></i>
                        Lateness Policy
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={settings.rulesSection.latenessRule}
                        onChange={(e) => updateRulesSection({ latenessRule: e.target.value })}
                        placeholder="Please arrive on time. Late arrivals may result in shortened service"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="fas fa-user-times me-1"></i>
                        No-Show Policy
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={settings.rulesSection.noshowRule}
                        onChange={(e) => updateRulesSection({ noshowRule: e.target.value })}
                        placeholder="No-show appointments will forfeit their deposit"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="fas fa-ban me-1"></i>
                        Cancellation Policy
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={settings.rulesSection.cancellationRule}
                        onChange={(e) => updateRulesSection({ cancellationRule: e.target.value })}
                        placeholder="Cancellations must be made 24 hours in advance for full refund"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        <i className="fas fa-list me-1"></i>
                        Additional Rules (optional)
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={settings.rulesSection.additionalRules}
                        onChange={(e) => updateRulesSection({ additionalRules: e.target.value })}
                        placeholder="Any additional policies or rules..."
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

                  <Tab.Pane eventKey="footer">
                    <Form.Group className="mb-3">
                      <Form.Label>Background Color</Form.Label>
                      <div className="d-flex align-items-center gap-2">
                        <Form.Control
                          type="color"
                          value={settings.footerSection.backgroundColor}
                          onChange={(e) => updateFooterSection({ backgroundColor: e.target.value })}
                          style={{ width: '60px' }}
                        />
                        <Form.Control
                          type="text"
                          value={settings.footerSection.backgroundColor}
                          onChange={(e) => updateFooterSection({ backgroundColor: e.target.value })}
                          placeholder="#212529"
                        />
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Text Color</Form.Label>
                      <div className="d-flex align-items-center gap-2">
                        <Form.Control
                          type="color"
                          value={settings.footerSection.textColor}
                          onChange={(e) => updateFooterSection({ textColor: e.target.value })}
                          style={{ width: '60px' }}
                        />
                        <Form.Control
                          type="text"
                          value={settings.footerSection.textColor}
                          onChange={(e) => updateFooterSection({ textColor: e.target.value })}
                          placeholder="#ffffff"
                        />
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Background Image (optional)</Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'footer')}
                      />
                      {settings.footerSection.backgroundImage && (
                        <div className="mt-2">
                          <img 
                            src={settings.footerSection.backgroundImage} 
                            alt="Footer background preview" 
                            style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'cover' }}
                            className="rounded"
                          />
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="ms-2"
                            onClick={() => updateFooterSection({ backgroundImage: '' })}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Custom Footer Text</Form.Label>
                      <Form.Control
                        type="text"
                        value={settings.footerSection.customFooterText}
                        onChange={(e) => updateFooterSection({ customFooterText: e.target.value })}
                        placeholder="Professional booking made easy"
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6} className="mb-3 mb-md-0">
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <i className="fas fa-map-marker-alt me-1"></i>
                            Address
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={settings.footerSection.contactInfo.address}
                            onChange={(e) => updateContactInfo({ address: e.target.value })}
                            placeholder="123 Main St, San Juan, PR"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>
                            <i className="fas fa-phone me-1"></i>
                            Phone
                          </Form.Label>
                          <Form.Control
                            type="tel"
                            value={settings.footerSection.contactInfo.phone}
                            onChange={(e) => updateContactInfo({ phone: e.target.value })}
                            placeholder="+1 (787) 555-0123"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <i className="fas fa-envelope me-1"></i>
                            Email
                          </Form.Label>
                          <Form.Control
                            type="email"
                            value={settings.footerSection.contactInfo.email}
                            onChange={(e) => updateContactInfo({ email: e.target.value })}
                            placeholder="info@yourbusiness.com"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>
                            <i className="fas fa-clock me-1"></i>
                            Business Hours
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={settings.footerSection.contactInfo.hours}
                            onChange={(e) => updateContactInfo({ hours: e.target.value })}
                            placeholder="Mon-Fri: 9AM-5PM"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="checkbox"
                        id="showPoweredBy"
                        checked={settings.footerSection.showPoweredBy}
                        onChange={(e) => updateFooterSection({ showPoweredBy: e.target.checked })}
                        label="Show 'Powered by BookIt by Zewo'"
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
                    href={`/page/${business.slug}`}
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

        <Col lg={6} className="order-1 order-lg-2">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-eye me-2"></i>
                Live Preview
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="preview-container" style={{ height: '600px', overflow: 'auto' }}>
                {/* Header Preview */}
                <div
                  className="d-flex align-items-center justify-content-between p-3 border-bottom"
                  style={{
                    backgroundColor: settings.headerSection.backgroundColor,
                    color: settings.headerSection.textColor
                  }}
                >
                  <div className="d-flex align-items-center">
                    <h5 className="mb-0 fw-bold">{settings.businessName}</h5>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    {settings.headerSection.showNavigationButtons && (
                      <div className="d-flex gap-2">
                        <Button 
                          size="sm" 
                          variant={settings.headerSection.textColor === '#000000' ? 'outline-dark' : 'outline-light'}
                          style={{ fontSize: '0.8rem' }}
                          onClick={() => {
                            const bookingSection = document.getElementById('booking-section')
                            bookingSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }}
                        >
                          Book Now
                        </Button>
                        <Button 
                          size="sm" 
                          variant={settings.headerSection.textColor === '#000000' ? 'outline-dark' : 'outline-light'}
                          style={{ fontSize: '0.8rem' }}
                          onClick={() => {
                            const rulesSection = document.getElementById('rules-section')
                            rulesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }}
                        >
                          Rules
                        </Button>
                      </div>
                    )}

                    {settings.headerSection.showSocialIcons && (
                      <div className="d-flex gap-2">
                        {settings.socialMedia.facebook && (
                          <a 
                            href={settings.socialMedia.facebook} 
                            style={{ color: settings.headerSection.textColor, fontSize: '1.1rem' }}
                            title="Facebook"
                          >
                            <i className="fab fa-facebook"></i>
                          </a>
                        )}
                        {settings.socialMedia.instagram && (
                          <a 
                            href={settings.socialMedia.instagram} 
                            style={{ color: settings.headerSection.textColor, fontSize: '1.1rem' }}
                            title="Instagram"
                          >
                            <i className="fab fa-instagram"></i>
                          </a>
                        )}
                        {settings.socialMedia.whatsapp && (
                          <a 
                            href={`https://wa.me/${settings.socialMedia.whatsapp}`} 
                            style={{ color: settings.headerSection.textColor, fontSize: '1.1rem' }}
                            title="WhatsApp"
                          >
                            <i className="fab fa-whatsapp"></i>
                          </a>
                        )}
                        {settings.socialMedia.website && (
                          <a 
                            href={settings.socialMedia.website} 
                            style={{ color: settings.headerSection.textColor, fontSize: '1.1rem' }}
                            title="Website"
                          >
                            <i className="fas fa-globe"></i>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Hero Section Preview */}
                <div
                  id="booking-section"
                  className="text-white d-flex align-items-center justify-content-center"
                  style={{
                    height: '250px',
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
                    <h2 className="fw-bold mb-2">{settings.heroTitle}</h2>
                    <p className="mb-3">{settings.heroSubtitle}</p>
                    <Button variant="light" size="sm">
                      Book Now
                    </Button>
                  </div>
                </div>

                {/* Business Info & Services Preview */}
                <div className="p-3 bg-light">
                  <div className="text-center mb-3">
                    <h4 className="fw-bold">{settings.businessName}</h4>
                    {settings.businessDescription && (
                      <p className="text-muted small">{settings.businessDescription}</p>
                    )}
                  </div>

                  <Row>
                    <Col md={6}>
                      <h6 className="mb-2">Our Services</h6>
                      {services.slice(0, 3).map((service) => (
                        <Card key={service.id} className="mb-1" style={{ fontSize: '0.8rem' }}>
                          <Card.Body className="py-2 px-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="fw-medium">{service.name}</div>
                                <small className="text-muted">{service.duration_min} min</small>
                              </div>
                              <div className="text-end">
                                <strong>${(service.price_cents / 100).toFixed(2)}</strong>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </Col>
                    <Col md={6}>
                      <h6 className="mb-2">Book Appointment</h6>
                      <div className="bg-white p-3 rounded border text-center">
                        <i className="fas fa-calendar-alt fa-2x text-muted mb-2"></i>
                        <p className="text-muted small mb-0">
                          Interactive calendar will appear here
                        </p>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Rules Section Preview */}
                <div
                  id="rules-section"
                  className="p-3"
                  style={{
                    backgroundColor: settings.rulesSection.backgroundColor,
                    backgroundImage: settings.rulesSection.backgroundImage ? `url(${settings.rulesSection.backgroundImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}
                >
                  {settings.rulesSection.backgroundImage && (
                    <div 
                      className="position-absolute w-100 h-100 top-0 start-0" 
                      style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                    />
                  )}
                  <div className="position-relative">
                    <h5 className="text-center mb-3">{settings.rulesSection.title}</h5>
                    <Row>
                      <Col md={6}>
                        {settings.rulesSection.depositRule && (
                          <div className="mb-2">
                            <i className="fas fa-credit-card text-success me-2"></i>
                            <small>{settings.rulesSection.depositRule}</small>
                          </div>
                        )}
                        {settings.rulesSection.latenessRule && (
                          <div className="mb-2">
                            <i className="fas fa-clock text-warning me-2"></i>
                            <small>{settings.rulesSection.latenessRule}</small>
                          </div>
                        )}
                      </Col>
                      <Col md={6}>
                        {settings.rulesSection.noshowRule && (
                          <div className="mb-2">
                            <i className="fas fa-user-times text-danger me-2"></i>
                            <small>{settings.rulesSection.noshowRule}</small>
                          </div>
                        )}
                        {settings.rulesSection.cancellationRule && (
                          <div className="mb-2">
                            <i className="fas fa-ban text-info me-2"></i>
                            <small>{settings.rulesSection.cancellationRule}</small>
                          </div>
                        )}
                      </Col>
                    </Row>
                    {settings.rulesSection.additionalRules && (
                      <div className="mt-3 pt-2 border-top">
                        <small className="text-muted">{settings.rulesSection.additionalRules}</small>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Preview */}
                <div
                  className="p-3 position-relative"
                  style={{
                    backgroundColor: settings.footerSection.backgroundColor,
                    backgroundImage: settings.footerSection.backgroundImage ? `url(${settings.footerSection.backgroundImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: settings.footerSection.textColor
                  }}
                >
                  {settings.footerSection.backgroundImage && (
                    <div 
                      className="position-absolute w-100 h-100 top-0 start-0" 
                      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    />
                  )}
                  <div className="position-relative">
                    <Row>
                      <Col md={4}>
                        <h6 style={{ fontSize: '0.9rem' }}>{settings.businessName}</h6>
                        {settings.footerSection.customFooterText && (
                          <p className="mb-2 small">{settings.footerSection.customFooterText}</p>
                        )}
                        {!settings.footerSection.customFooterText && settings.businessDescription && (
                          <p className="mb-2 small">{settings.businessDescription}</p>
                        )}
                      </Col>
                      
                      <Col md={4}>
                        <h6 style={{ fontSize: '0.9rem' }}>Contact Info</h6>
                        {settings.footerSection.contactInfo.address && (
                          <div className="mb-1 small">
                            <i className="fas fa-map-marker-alt me-2"></i>
                            {settings.footerSection.contactInfo.address}
                          </div>
                        )}
                        {settings.footerSection.contactInfo.phone && (
                          <div className="mb-1 small">
                            <i className="fas fa-phone me-2"></i>
                            {settings.footerSection.contactInfo.phone}
                          </div>
                        )}
                        {settings.footerSection.contactInfo.email && (
                          <div className="mb-1 small">
                            <i className="fas fa-envelope me-2"></i>
                            {settings.footerSection.contactInfo.email}
                          </div>
                        )}
                        {settings.footerSection.contactInfo.hours && (
                          <div className="mb-1 small">
                            <i className="fas fa-clock me-2"></i>
                            {settings.footerSection.contactInfo.hours}
                          </div>
                        )}
                      </Col>
                      
                      <Col md={4}>
                        <h6 style={{ fontSize: '0.9rem' }}>Follow Us</h6>
                        <div className="d-flex gap-2 mb-2">
                          {settings.socialMedia.facebook && (
                            <a href={settings.socialMedia.facebook} style={{ color: settings.footerSection.textColor, fontSize: '1.2rem' }}>
                              <i className="fab fa-facebook"></i>
                            </a>
                          )}
                          {settings.socialMedia.instagram && (
                            <a href={settings.socialMedia.instagram} style={{ color: settings.footerSection.textColor, fontSize: '1.2rem' }}>
                              <i className="fab fa-instagram"></i>
                            </a>
                          )}
                          {settings.socialMedia.whatsapp && (
                            <a href={`https://wa.me/${settings.socialMedia.whatsapp}`} style={{ color: settings.footerSection.textColor, fontSize: '1.2rem' }}>
                              <i className="fab fa-whatsapp"></i>
                            </a>
                          )}
                          {settings.socialMedia.website && (
                            <a href={settings.socialMedia.website} style={{ color: settings.footerSection.textColor, fontSize: '1.2rem' }}>
                              <i className="fas fa-globe"></i>
                            </a>
                          )}
                        </div>
                        {settings.footerSection.showPoweredBy && (
                          <p className="mb-0" style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                            Powered by <strong>BookIt by Zewo</strong>
                          </p>
                        )}
                      </Col>
                    </Row>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}