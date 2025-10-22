'use client'

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Nav, Tab, Alert } from 'react-bootstrap'
import MonthlyCalendar from '@/components/MonthlyCalendar'

interface WebpageSettings {
  headerSection: {
    backgroundColor: string
    textColor: string
    showSocialIcons: boolean
    showNavigationButtons: boolean
    textStyle: {
      fontFamily: string
      fontSize: string
      fontWeight: string
    }
  }
  heroBackgroundColor: string
  heroBackgroundImage: string
  heroTitle: string
  heroSubtitle: string
  heroTextStyle: {
    titleColor: string
    subtitleColor: string
    titleFontSize: string
    subtitleFontSize: string
    fontFamily: string
    fontWeight: string
    textAlign: 'left' | 'center' | 'right'
  }
  businessName: string
  businessDescription: string
  businessTextStyle: {
    nameColor: string
    descriptionColor: string
    nameFontSize: string
    descriptionFontSize: string
    fontFamily: string
    textAlign: 'left' | 'center' | 'right'
  }
  aboutSection: {
    enabled: boolean
    backgroundColor: string
    backgroundImage: string
    title: string
    content: string
    showTeamInfo: boolean
    teamInfo: string
    textStyle: {
      titleColor: string
      contentColor: string
      titleFontSize: string
      contentFontSize: string
      fontFamily: string
      textAlign: 'left' | 'center' | 'right'
    }
  }
  gallerySection: {
    enabled: boolean
    backgroundColor: string
    title: string
    images: string[]
    description: string
  }
  testimonialsSection: {
    enabled: boolean
    backgroundColor: string
    title: string
    testimonials: {
      name: string
      text: string
      rating: number
    }[]
  }
  contactSection: {
    enabled: boolean
    backgroundColor: string
    backgroundImage: string
    title: string
    subtitle: string
    showForm: boolean
    formFields: {
      name: boolean
      email: boolean
      phone: boolean
      subject: boolean
      message: boolean
    }
    showContactInfo: boolean
    showMap: boolean
    mapEmbedCode: string
  }
  rulesSection: {
    backgroundColor: string
    backgroundImage: string
    title: string
    depositRule: string
    latenessRule: string
    noshowRule: string
    cancellationRule: string
    additionalRules: string
    textStyle: {
      titleColor: string
      textColor: string
      titleFontSize: string
      textFontSize: string
      fontFamily: string
      textAlign: 'left' | 'center' | 'right'
    }
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
    tiktok: string
    linkedin: string
  }
}

const defaultSettings: WebpageSettings = {
  headerSection: {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    showSocialIcons: true,
    showNavigationButtons: true,
    textStyle: {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontWeight: 'normal'
    }
  },
  heroBackgroundColor: '#10b981',
  heroBackgroundImage: '',
  heroTitle: 'Book Your Appointment',
  heroSubtitle: 'Professional services at your convenience',
  heroTextStyle: {
    titleColor: '#ffffff',
    subtitleColor: '#ffffff',
    titleFontSize: '2.5rem',
    subtitleFontSize: '1.2rem',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  businessName: 'Dev Hair Salon',
  businessDescription: 'Professional hair and beauty services',
  businessTextStyle: {
    nameColor: '#212529',
    descriptionColor: '#6c757d',
    nameFontSize: '2rem',
    descriptionFontSize: '1rem',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center'
  },
  aboutSection: {
    enabled: true,
    backgroundColor: '#ffffff',
    backgroundImage: '',
    title: 'About Us',
    content: 'We are a professional service provider dedicated to excellence and customer satisfaction.',
    showTeamInfo: false,
    teamInfo: '',
    textStyle: {
      titleColor: '#212529',
      contentColor: '#495057',
      titleFontSize: '2rem',
      contentFontSize: '1rem',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }
  },
  gallerySection: {
    enabled: false,
    backgroundColor: '#f8f9fa',
    title: 'Our Work',
    images: [],
    description: 'Take a look at some of our recent work'
  },
  testimonialsSection: {
    enabled: false,
    backgroundColor: '#ffffff',
    title: 'What Our Clients Say',
    testimonials: []
  },
  contactSection: {
    enabled: true,
    backgroundColor: '#f8f9fa',
    backgroundImage: '',
    title: 'Get In Touch',
    subtitle: 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
    showForm: true,
    formFields: {
      name: true,
      email: true,
      phone: true,
      subject: true,
      message: true
    },
    showContactInfo: true,
    showMap: false,
    mapEmbedCode: ''
  },
  rulesSection: {
    backgroundColor: '#f8f9fa',
    backgroundImage: '',
    title: 'Booking Policies',
    depositRule: 'A $10 deposit is required to confirm your appointment',
    latenessRule: 'Please arrive on time. Late arrivals may result in shortened service',
    noshowRule: 'No-show appointments will forfeit their deposit',
    cancellationRule: 'Cancellations must be made 24 hours in advance for full refund',
    additionalRules: '',
    textStyle: {
      titleColor: '#212529',
      textColor: '#495057',
      titleFontSize: '1.8rem',
      textFontSize: '0.9rem',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }
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
    website: '',
    tiktok: '',
    linkedin: ''
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
            // Deep merge to ensure all new properties are included
            const mergedSettings = {
              ...defaultSettings,
              ...settingsResult.settings,
              headerSection: {
                ...defaultSettings.headerSection,
                ...settingsResult.settings.headerSection
              },
              heroTextStyle: {
                ...defaultSettings.heroTextStyle,
                ...settingsResult.settings.heroTextStyle
              },
              businessTextStyle: {
                ...defaultSettings.businessTextStyle,
                ...settingsResult.settings.businessTextStyle
              },
              aboutSection: {
                ...defaultSettings.aboutSection,
                ...settingsResult.settings.aboutSection,
                textStyle: {
                  ...defaultSettings.aboutSection.textStyle,
                  ...settingsResult.settings.aboutSection?.textStyle
                }
              },
              gallerySection: {
                ...defaultSettings.gallerySection,
                ...settingsResult.settings.gallerySection
              },
              testimonialsSection: {
                ...defaultSettings.testimonialsSection,
                ...settingsResult.settings.testimonialsSection
              },
              contactSection: {
                ...defaultSettings.contactSection,
                ...settingsResult.settings.contactSection,
                formFields: {
                  ...defaultSettings.contactSection.formFields,
                  ...settingsResult.settings.contactSection?.formFields
                }
              },
              rulesSection: {
                ...defaultSettings.rulesSection,
                ...settingsResult.settings.rulesSection,
                textStyle: {
                  ...defaultSettings.rulesSection.textStyle,
                  ...settingsResult.settings.rulesSection?.textStyle
                }
              },
              footerSection: {
                ...defaultSettings.footerSection,
                ...settingsResult.settings.footerSection,
                contactInfo: {
                  ...defaultSettings.footerSection.contactInfo,
                  ...settingsResult.settings.footerSection?.contactInfo
                }
              },
              socialMedia: {
                ...defaultSettings.socialMedia,
                ...settingsResult.settings.socialMedia
              }
            }
            setSettings(mergedSettings)
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

  const updateAboutSection = (updates: Partial<WebpageSettings['aboutSection']>) => {
    setSettings(prev => ({
      ...prev,
      aboutSection: {
        ...prev.aboutSection,
        ...updates
      }
    }))
  }

  const updateGallerySection = (updates: Partial<WebpageSettings['gallerySection']>) => {
    setSettings(prev => ({
      ...prev,
      gallerySection: {
        ...prev.gallerySection,
        ...updates
      }
    }))
  }

  const updateTestimonialsSection = (updates: Partial<WebpageSettings['testimonialsSection']>) => {
    setSettings(prev => ({
      ...prev,
      testimonialsSection: {
        ...prev.testimonialsSection,
        ...updates
      }
    }))
  }

  const updateContactSection = (updates: Partial<WebpageSettings['contactSection']>) => {
    setSettings(prev => ({
      ...prev,
      contactSection: {
        ...prev.contactSection,
        ...updates
      }
    }))
  }

  const updateContactFormFields = (updates: Partial<WebpageSettings['contactSection']['formFields']>) => {
    setSettings(prev => ({
      ...prev,
      contactSection: {
        ...prev.contactSection,
        formFields: {
          ...prev.contactSection.formFields,
          ...updates
        }
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

  const handleImageUpload = async (file: File, section: 'hero' | 'rules' | 'footer' | 'about' | 'contact' | 'gallery') => {
    // TEMP: Simulate image upload - in production, upload to storage service
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(reader.result as string)
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, section: 'hero' | 'rules' | 'footer' | 'about' | 'contact') => {
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
        } else if (section === 'about') {
          updateAboutSection({ backgroundImage: imageUrl })
        } else if (section === 'contact') {
          updateContactSection({ backgroundImage: imageUrl })
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        setMessage('Error uploading image. Please try again.')
      }
    }
  }

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      try {
        const imagePromises = Array.from(files).map(file => handleImageUpload(file, 'gallery'))
        const imageUrls = await Promise.all(imagePromises)
        updateGallerySection({ 
          images: [...settings.gallerySection.images, ...imageUrls]
        })
      } catch (error) {
        console.error('Error uploading gallery images:', error)
        setMessage('Error uploading gallery images. Please try again.')
      }
    }
  }

  const removeGalleryImage = (index: number) => {
    const newImages = settings.gallerySection.images.filter((_, i) => i !== index)
    updateGallerySection({ images: newImages })
  }

  const addTestimonial = () => {
    updateTestimonialsSection({
      testimonials: [...settings.testimonialsSection.testimonials, {
        name: '',
        text: '',
        rating: 5
      }]
    })
  }

  const updateTestimonial = (index: number, field: string, value: string | number) => {
    const newTestimonials = settings.testimonialsSection.testimonials.map((testimonial, i) => 
      i === index ? { ...testimonial, [field]: value } : testimonial
    )
    updateTestimonialsSection({ testimonials: newTestimonials })
  }

  const removeTestimonial = (index: number) => {
    const newTestimonials = settings.testimonialsSection.testimonials.filter((_, i) => i !== index)
    updateTestimonialsSection({ testimonials: newTestimonials })
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
                    <Nav.Link eventKey="about">
                      <i className="fas fa-info-circle me-1"></i>
                      About Us
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="gallery">
                      <i className="fas fa-images me-1"></i>
                      Gallery
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="testimonials">
                      <i className="fas fa-quote-left me-1"></i>
                      Testimonials
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="contact">
                      <i className="fas fa-envelope me-1"></i>
                      Contact
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
                        onChange={(e) => handleFileChange(e as React.ChangeEvent<HTMLInputElement>, 'hero')}
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

                    <h6 className="mt-4 mb-3">Text Styling</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Business Name Color</Form.Label>
                          <Form.Control
                            type="color"
                            value={settings.businessTextStyle.nameColor}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              businessTextStyle: {
                                ...prev.businessTextStyle,
                                nameColor: e.target.value
                              }
                            }))}
                          />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Name Font Size</Form.Label>
                          <Form.Select
                            value={settings.businessTextStyle.nameFontSize}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              businessTextStyle: {
                                ...prev.businessTextStyle,
                                nameFontSize: e.target.value
                              }
                            }))}
                          >
                            <option value="1.5rem">Small</option>
                            <option value="2rem">Medium</option>
                            <option value="2.5rem">Large</option>
                            <option value="3rem">Extra Large</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Description Color</Form.Label>
                          <Form.Control
                            type="color"
                            value={settings.businessTextStyle.descriptionColor}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              businessTextStyle: {
                                ...prev.businessTextStyle,
                                descriptionColor: e.target.value
                              }
                            }))}
                          />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Text Alignment</Form.Label>
                          <Form.Select
                            value={settings.businessTextStyle.textAlign}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              businessTextStyle: {
                                ...prev.businessTextStyle,
                                textAlign: e.target.value as 'left' | 'center' | 'right'
                              }
                            }))}
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Tab.Pane>

                  <Tab.Pane eventKey="about">
                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="checkbox"
                        id="enableAbout"
                        checked={settings.aboutSection.enabled}
                        onChange={(e) => updateAboutSection({ enabled: e.target.checked })}
                        label="Enable About Us Section"
                      />
                    </Form.Group>

                    {settings.aboutSection.enabled && (
                      <>
                        <Form.Group className="mb-3">
                          <Form.Label>Section Title</Form.Label>
                          <Form.Control
                            type="text"
                            value={settings.aboutSection.title}
                            onChange={(e) => updateAboutSection({ title: e.target.value })}
                            placeholder="About Us"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Content</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            value={settings.aboutSection.content}
                            onChange={(e) => updateAboutSection({ content: e.target.value })}
                            placeholder="Tell your story and what makes your business special..."
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Check 
                            type="checkbox"
                            id="showTeamInfo"
                            checked={settings.aboutSection.showTeamInfo}
                            onChange={(e) => updateAboutSection({ showTeamInfo: e.target.checked })}
                            label="Show Team Information"
                          />
                        </Form.Group>

                        {settings.aboutSection.showTeamInfo && (
                          <Form.Group className="mb-3">
                            <Form.Label>Team Information</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={settings.aboutSection.teamInfo}
                              onChange={(e) => updateAboutSection({ teamInfo: e.target.value })}
                              placeholder="Introduce your team members..."
                            />
                          </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                          <Form.Label>Background Color</Form.Label>
                          <Form.Control
                            type="color"
                            value={settings.aboutSection.backgroundColor}
                            onChange={(e) => updateAboutSection({ backgroundColor: e.target.value })}
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Background Image (optional)</Form.Label>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e as React.ChangeEvent<HTMLInputElement>, 'about')}
                          />
                          {settings.aboutSection.backgroundImage && (
                            <div className="mt-2">
                              <img 
                                src={settings.aboutSection.backgroundImage} 
                                alt="About background preview" 
                                style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'cover' }}
                                className="rounded"
                              />
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="ms-2"
                                onClick={() => updateAboutSection({ backgroundImage: '' })}
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </Form.Group>

                        <h6 className="mt-4 mb-3">Text Styling</h6>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Title Color</Form.Label>
                              <Form.Control
                                type="color"
                                value={settings.aboutSection.textStyle.titleColor}
                                onChange={(e) => updateAboutSection({
                                  textStyle: {
                                    ...settings.aboutSection.textStyle,
                                    titleColor: e.target.value
                                  }
                                })}
                              />
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Title Font Size</Form.Label>
                              <Form.Select
                                value={settings.aboutSection.textStyle.titleFontSize}
                                onChange={(e) => updateAboutSection({
                                  textStyle: {
                                    ...settings.aboutSection.textStyle,
                                    titleFontSize: e.target.value
                                  }
                                })}
                              >
                                <option value="1.5rem">Small</option>
                                <option value="2rem">Medium</option>
                                <option value="2.5rem">Large</option>
                                <option value="3rem">Extra Large</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Content Color</Form.Label>
                              <Form.Control
                                type="color"
                                value={settings.aboutSection.textStyle.contentColor}
                                onChange={(e) => updateAboutSection({
                                  textStyle: {
                                    ...settings.aboutSection.textStyle,
                                    contentColor: e.target.value
                                  }
                                })}
                              />
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Text Alignment</Form.Label>
                              <Form.Select
                                value={settings.aboutSection.textStyle.textAlign}
                                onChange={(e) => updateAboutSection({
                                  textStyle: {
                                    ...settings.aboutSection.textStyle,
                                    textAlign: e.target.value as 'left' | 'center' | 'right'
                                  }
                                })}
                              >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>
                      </>
                    )}
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
                        onChange={(e) => handleFileChange(e as React.ChangeEvent<HTMLInputElement>, 'rules')}
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

                  <Tab.Pane eventKey="gallery">
                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="checkbox"
                        id="enableGallery"
                        checked={settings.gallerySection.enabled}
                        onChange={(e) => updateGallerySection({ enabled: e.target.checked })}
                        label="Enable Gallery Section"
                      />
                    </Form.Group>

                    {settings.gallerySection.enabled && (
                      <>
                        <Form.Group className="mb-3">
                          <Form.Label>Section Title</Form.Label>
                          <Form.Control
                            type="text"
                            value={settings.gallerySection.title}
                            onChange={(e) => updateGallerySection({ title: e.target.value })}
                            placeholder="Our Work"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Description</Form.Label>
                          <Form.Control
                            type="text"
                            value={settings.gallerySection.description}
                            onChange={(e) => updateGallerySection({ description: e.target.value })}
                            placeholder="Take a look at some of our recent work"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Background Color</Form.Label>
                          <Form.Control
                            type="color"
                            value={settings.gallerySection.backgroundColor}
                            onChange={(e) => updateGallerySection({ backgroundColor: e.target.value })}
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Gallery Images</Form.Label>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleGalleryImageUpload}
                          />
                          <Form.Text className="text-muted">
                            Select multiple images to add to your gallery
                          </Form.Text>
                        </Form.Group>

                        {settings.gallerySection.images.length > 0 && (
                          <div className="mt-3">
                            <h6>Current Images ({settings.gallerySection.images.length})</h6>
                            <Row>
                              {settings.gallerySection.images.map((image, index) => (
                                <Col xs={6} md={4} lg={3} key={index} className="mb-3">
                                  <div className="position-relative">
                                    <img 
                                      src={image} 
                                      alt={`Gallery image ${index + 1}`} 
                                      style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                                      className="rounded"
                                    />
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      className="position-absolute top-0 end-0 m-1"
                                      onClick={() => removeGalleryImage(index)}
                                      style={{ fontSize: '0.7rem' }}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        )}
                      </>
                    )}
                  </Tab.Pane>

                  <Tab.Pane eventKey="testimonials">
                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="checkbox"
                        id="enableTestimonials"
                        checked={settings.testimonialsSection.enabled}
                        onChange={(e) => updateTestimonialsSection({ enabled: e.target.checked })}
                        label="Enable Testimonials Section"
                      />
                    </Form.Group>

                    {settings.testimonialsSection.enabled && (
                      <>
                        <Form.Group className="mb-3">
                          <Form.Label>Section Title</Form.Label>
                          <Form.Control
                            type="text"
                            value={settings.testimonialsSection.title}
                            onChange={(e) => updateTestimonialsSection({ title: e.target.value })}
                            placeholder="What Our Clients Say"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Background Color</Form.Label>
                          <Form.Control
                            type="color"
                            value={settings.testimonialsSection.backgroundColor}
                            onChange={(e) => updateTestimonialsSection({ backgroundColor: e.target.value })}
                          />
                        </Form.Group>

                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6>Testimonials ({settings.testimonialsSection.testimonials.length})</h6>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={addTestimonial}
                          >
                            <i className="fas fa-plus me-1"></i>
                            Add Testimonial
                          </Button>
                        </div>

                        {settings.testimonialsSection.testimonials.map((testimonial, index) => (
                          <Card key={index} className="mb-3">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="mb-0">Testimonial {index + 1}</h6>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => removeTestimonial(index)}
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </div>
                              
                              <Row>
                                <Col md={6}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>Customer Name</Form.Label>
                                    <Form.Control
                                      type="text"
                                      value={testimonial.name}
                                      onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                                      placeholder="John Doe"
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>Rating</Form.Label>
                                    <Form.Select
                                      value={testimonial.rating}
                                      onChange={(e) => updateTestimonial(index, 'rating', parseInt(e.target.value))}
                                    >
                                      <option value={5}>5 Stars</option>
                                      <option value={4}>4 Stars</option>
                                      <option value={3}>3 Stars</option>
                                      <option value={2}>2 Stars</option>
                                      <option value={1}>1 Star</option>
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                              </Row>
                              
                              <Form.Group className="mb-0">
                                <Form.Label>Testimonial Text</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={3}
                                  value={testimonial.text}
                                  onChange={(e) => updateTestimonial(index, 'text', e.target.value)}
                                  placeholder="Amazing service! Highly recommend..."
                                />
                              </Form.Group>
                            </Card.Body>
                          </Card>
                        ))}

                        {settings.testimonialsSection.testimonials.length === 0 && (
                          <Alert variant="info">
                            <i className="fas fa-info-circle me-2"></i>
                            Add testimonials to showcase customer feedback and build trust with potential clients.
                          </Alert>
                        )}
                      </>
                    )}
                  </Tab.Pane>

                  <Tab.Pane eventKey="contact">
                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="checkbox"
                        id="enableContact"
                        checked={settings.contactSection.enabled}
                        onChange={(e) => updateContactSection({ enabled: e.target.checked })}
                        label="Enable Contact Section"
                      />
                    </Form.Group>

                    {settings.contactSection.enabled && (
                      <>
                        <Form.Group className="mb-3">
                          <Form.Label>Section Title</Form.Label>
                          <Form.Control
                            type="text"
                            value={settings.contactSection.title}
                            onChange={(e) => updateContactSection({ title: e.target.value })}
                            placeholder="Get In Touch"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Subtitle</Form.Label>
                          <Form.Control
                            type="text"
                            value={settings.contactSection.subtitle}
                            onChange={(e) => updateContactSection({ subtitle: e.target.value })}
                            placeholder="We'd love to hear from you..."
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Background Color</Form.Label>
                          <Form.Control
                            type="color"
                            value={settings.contactSection.backgroundColor}
                            onChange={(e) => updateContactSection({ backgroundColor: e.target.value })}
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Background Image (optional)</Form.Label>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e as React.ChangeEvent<HTMLInputElement>, 'contact')}
                          />
                          {settings.contactSection.backgroundImage && (
                            <div className="mt-2">
                              <img 
                                src={settings.contactSection.backgroundImage} 
                                alt="Contact background preview" 
                                style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'cover' }}
                                className="rounded"
                              />
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="ms-2"
                                onClick={() => updateContactSection({ backgroundImage: '' })}
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </Form.Group>

                        <Row>
                          <Col md={6}>
                            <h6 className="mb-3">Contact Form Settings</h6>
                            <Form.Group className="mb-3">
                              <Form.Check 
                                type="checkbox"
                                id="showContactForm"
                                checked={settings.contactSection.showForm}
                                onChange={(e) => updateContactSection({ showForm: e.target.checked })}
                                label="Show Contact Form"
                              />
                            </Form.Group>

                            {settings.contactSection.showForm && (
                              <>
                                <p className="small text-muted mb-2">Form Fields to Include:</p>
                                <Form.Group className="mb-2">
                                  <Form.Check 
                                    type="checkbox"
                                    id="formName"
                                    checked={settings.contactSection.formFields.name}
                                    onChange={(e) => updateContactFormFields({ name: e.target.checked })}
                                    label="Name (Required)"
                                    disabled
                                  />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                  <Form.Check 
                                    type="checkbox"
                                    id="formEmail"
                                    checked={settings.contactSection.formFields.email}
                                    onChange={(e) => updateContactFormFields({ email: e.target.checked })}
                                    label="Email (Required)"
                                    disabled
                                  />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                  <Form.Check 
                                    type="checkbox"
                                    id="formPhone"
                                    checked={settings.contactSection.formFields.phone}
                                    onChange={(e) => updateContactFormFields({ phone: e.target.checked })}
                                    label="Phone Number"
                                  />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                  <Form.Check 
                                    type="checkbox"
                                    id="formSubject"
                                    checked={settings.contactSection.formFields.subject}
                                    onChange={(e) => updateContactFormFields({ subject: e.target.checked })}
                                    label="Subject"
                                  />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                  <Form.Check 
                                    type="checkbox"
                                    id="formMessage"
                                    checked={settings.contactSection.formFields.message}
                                    onChange={(e) => updateContactFormFields({ message: e.target.checked })}
                                    label="Message (Required)"
                                    disabled
                                  />
                                </Form.Group>
                              </>
                            )}
                          </Col>
                          <Col md={6}>
                            <h6 className="mb-3">Display Settings</h6>
                            <Form.Group className="mb-3">
                              <Form.Check 
                                type="checkbox"
                                id="showContactInfo"
                                checked={settings.contactSection.showContactInfo}
                                onChange={(e) => updateContactSection({ showContactInfo: e.target.checked })}
                                label="Show Contact Information"
                              />
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Check 
                                type="checkbox"
                                id="showMap"
                                checked={settings.contactSection.showMap}
                                onChange={(e) => updateContactSection({ showMap: e.target.checked })}
                                label="Show Map"
                              />
                            </Form.Group>

                            {settings.contactSection.showMap && (
                              <Form.Group className="mb-3">
                                <Form.Label>Map Embed Code</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={3}
                                  value={settings.contactSection.mapEmbedCode}
                                  onChange={(e) => updateContactSection({ mapEmbedCode: e.target.value })}
                                  placeholder="Paste Google Maps embed code here..."
                                />
                                <Form.Text className="text-muted">
                                  Get embed code from Google Maps → Share → Embed a map
                                </Form.Text>
                              </Form.Group>
                            )}
                          </Col>
                        </Row>
                      </>
                    )}
                  </Tab.Pane>

                  <Tab.Pane eventKey="social">
                    <Alert variant="info" className="mb-4">
                      <i className="fas fa-info-circle me-2"></i>
                      Social media links will appear in the header and footer when provided. Phone numbers will be clickable and open WhatsApp when possible.
                    </Alert>

                    <Row>
                      <Col md={6}>
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
                          <Form.Text className="text-muted">
                            Include country code (e.g., +1 for US, +34 for Spain)
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
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

                        <Form.Group className="mb-3">
                          <Form.Label>
                            <i className="fab fa-tiktok me-2"></i>
                            TikTok URL
                          </Form.Label>
                          <Form.Control
                            type="url"
                            value={settings.socialMedia.tiktok}
                            onChange={(e) => updateSocialMedia('tiktok', e.target.value)}
                            placeholder="https://tiktok.com/@yourbusiness"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>
                            <i className="fab fa-linkedin text-primary me-2"></i>
                            LinkedIn URL
                          </Form.Label>
                          <Form.Control
                            type="url"
                            value={settings.socialMedia.linkedin}
                            onChange={(e) => updateSocialMedia('linkedin', e.target.value)}
                            placeholder="https://linkedin.com/company/yourbusiness"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
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
                        onChange={(e) => handleFileChange(e as React.ChangeEvent<HTMLInputElement>, 'footer')}
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
                        label="Show 'Powered by BookIt by Zewo' (clickable link)"
                      />
                      <Form.Text className="text-muted">
                        Help others discover our platform! The link will direct visitors to BookIt by Zewo's main page.
                      </Form.Text>
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
                    color: settings.headerSection.textColor,
                    minHeight: '70px'
                  }}
                >
                  <div className="d-flex align-items-center">
                    <h5 
                      className="mb-0 fw-bold"
                      style={{
                        fontFamily: settings.headerSection.textStyle.fontFamily,
                        fontSize: settings.headerSection.textStyle.fontSize,
                        fontWeight: settings.headerSection.textStyle.fontWeight
                      }}
                    >
                      {settings.businessName}
                    </h5>
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
                        {settings.socialMedia.tiktok && (
                          <a 
                            href={settings.socialMedia.tiktok} 
                            style={{ color: settings.headerSection.textColor, fontSize: '1.1rem' }}
                            title="TikTok"
                          >
                            <i className="fab fa-tiktok"></i>
                          </a>
                        )}
                        {settings.socialMedia.linkedin && (
                          <a 
                            href={settings.socialMedia.linkedin} 
                            style={{ color: settings.headerSection.textColor, fontSize: '1.1rem' }}
                            title="LinkedIn"
                          >
                            <i className="fab fa-linkedin"></i>
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
                  <div 
                    className="position-relative w-100 px-3" 
                    style={{ 
                      textAlign: settings.heroTextStyle.textAlign,
                      maxWidth: '800px'
                    }}
                  >
                    <h2 
                      className="mb-3"
                      style={{
                        color: settings.heroTextStyle.titleColor,
                        fontSize: settings.heroTextStyle.titleFontSize,
                        fontFamily: settings.heroTextStyle.fontFamily,
                        fontWeight: settings.heroTextStyle.fontWeight,
                        lineHeight: '1.2',
                        margin: '0 auto'
                      }}
                    >
                      {settings.heroTitle}
                    </h2>
                    <p 
                      className="mb-4"
                      style={{
                        color: settings.heroTextStyle.subtitleColor,
                        fontSize: settings.heroTextStyle.subtitleFontSize,
                        fontFamily: settings.heroTextStyle.fontFamily,
                        lineHeight: '1.4',
                        margin: '0 auto',
                        maxWidth: '600px'
                      }}
                    >
                      {settings.heroSubtitle}
                    </p>
                    <div style={{ textAlign: 'center' }}>
                      <Button variant="light" size="lg" className="px-4 py-2">
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Business Info & Services Preview */}
                <div className="p-4 bg-light">
                  <div 
                    className="mb-4" 
                    style={{ 
                      textAlign: settings.businessTextStyle.textAlign,
                      maxWidth: '800px',
                      margin: '0 auto'
                    }}
                  >
                    <h4 
                      className="fw-bold mb-3" 
                      style={{
                        color: settings.businessTextStyle.nameColor,
                        fontSize: settings.businessTextStyle.nameFontSize,
                        fontFamily: settings.businessTextStyle.fontFamily,
                        lineHeight: '1.3'
                      }}
                    >
                      {settings.businessName}
                    </h4>
                    {settings.businessDescription && (
                      <p 
                        className="mb-0"
                        style={{
                          color: settings.businessTextStyle.descriptionColor,
                          fontSize: settings.businessTextStyle.descriptionFontSize,
                          fontFamily: settings.businessTextStyle.fontFamily,
                          lineHeight: '1.5',
                          maxWidth: '600px',
                          margin: settings.businessTextStyle.textAlign === 'center' ? '0 auto' : '0'
                        }}
                      >
                        {settings.businessDescription}
                      </p>
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

                {/* About Section Preview */}
                {settings.aboutSection.enabled && (
                  <div
                    className="p-4 position-relative"
                    style={{
                      backgroundColor: settings.aboutSection.backgroundColor,
                      backgroundImage: settings.aboutSection.backgroundImage ? `url(${settings.aboutSection.backgroundImage})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {settings.aboutSection.backgroundImage && (
                      <div 
                        className="position-absolute w-100 h-100 top-0 start-0" 
                        style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                      />
                    )}
                    <div 
                      className="position-relative" 
                      style={{ 
                        textAlign: settings.aboutSection.textStyle.textAlign,
                        maxWidth: '800px',
                        margin: '0 auto'
                      }}
                    >
                      <h5 
                        className="mb-3"
                        style={{
                          color: settings.aboutSection.textStyle.titleColor,
                          fontSize: settings.aboutSection.textStyle.titleFontSize,
                          fontFamily: settings.aboutSection.textStyle.fontFamily,
                          lineHeight: '1.3'
                        }}
                      >
                        {settings.aboutSection.title}
                      </h5>
                      <p 
                        style={{
                          color: settings.aboutSection.textStyle.contentColor,
                          fontSize: settings.aboutSection.textStyle.contentFontSize,
                          fontFamily: settings.aboutSection.textStyle.fontFamily,
                          lineHeight: '1.6',
                          maxWidth: '700px',
                          margin: settings.aboutSection.textStyle.textAlign === 'center' ? '0 auto' : '0'
                        }}
                      >
                        {settings.aboutSection.content}
                      </p>
                      {settings.aboutSection.showTeamInfo && settings.aboutSection.teamInfo && (
                        <div className="mt-4 pt-3 border-top">
                          <p 
                            style={{
                              color: settings.aboutSection.textStyle.contentColor,
                              fontFamily: settings.aboutSection.textStyle.fontFamily,
                              lineHeight: '1.5',
                              maxWidth: '600px',
                              margin: settings.aboutSection.textStyle.textAlign === 'center' ? '0 auto' : '0'
                            }}
                          >
                            {settings.aboutSection.teamInfo}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Gallery Section Preview */}
                {settings.gallerySection.enabled && (
                  <div
                    className="p-4"
                    style={{ backgroundColor: settings.gallerySection.backgroundColor }}
                  >
                    <div className="text-center mb-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
                      <h5 className="mb-3" style={{ lineHeight: '1.3' }}>{settings.gallerySection.title}</h5>
                      {settings.gallerySection.description && (
                        <p 
                          className="text-muted" 
                          style={{ 
                            lineHeight: '1.5',
                            maxWidth: '600px',
                            margin: '0 auto'
                          }}
                        >
                          {settings.gallerySection.description}
                        </p>
                      )}
                    </div>
                    {settings.gallerySection.images.length > 0 ? (
                      <Row>
                        {settings.gallerySection.images.slice(0, 6).map((image, index) => (
                          <Col xs={6} md={4} key={index} className="mb-2">
                            <img 
                              src={image} 
                              alt={`Gallery ${index + 1}`} 
                              style={{ width: '100%', height: '80px', objectFit: 'cover' }}
                              className="rounded"
                            />
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <div className="text-center py-3 bg-light rounded">
                        <i className="fas fa-images fa-2x text-muted mb-2"></i>
                        <p className="text-muted small mb-0">Gallery images will appear here</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Testimonials Section Preview */}
                {settings.testimonialsSection.enabled && (
                  <div
                    className="p-4"
                    style={{ backgroundColor: settings.testimonialsSection.backgroundColor }}
                  >
                    <div className="text-center mb-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
                      <h5 className="mb-3" style={{ lineHeight: '1.3' }}>{settings.testimonialsSection.title}</h5>
                    </div>
                    {settings.testimonialsSection.testimonials.length > 0 ? (
                      <Row>
                        {settings.testimonialsSection.testimonials.slice(0, 2).map((testimonial, index) => (
                          <Col md={6} key={index} className="mb-2">
                            <Card className="h-100">
                              <Card.Body className="p-2">
                                <div className="d-flex align-items-center mb-2">
                                  <div className="me-2">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                      <i key={i} className="fas fa-star text-warning" style={{ fontSize: '0.7rem' }}></i>
                                    ))}
                                  </div>
                                  <small className="fw-medium">{testimonial.name}</small>
                                </div>
                                <p className="small mb-0">"{testimonial.text}"</p>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <div className="text-center py-3 bg-light rounded">
                        <i className="fas fa-quote-left fa-2x text-muted mb-2"></i>
                        <p className="text-muted small mb-0">Customer testimonials will appear here</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact Section Preview */}
                {settings.contactSection.enabled && (
                  <div
                    className="p-4 position-relative"
                    style={{
                      backgroundColor: settings.contactSection.backgroundColor,
                      backgroundImage: settings.contactSection.backgroundImage ? `url(${settings.contactSection.backgroundImage})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {settings.contactSection.backgroundImage && (
                      <div 
                        className="position-absolute w-100 h-100 top-0 start-0" 
                        style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                      />
                    )}
                    <div className="position-relative" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                      <div className="text-center mb-4">
                        <h5 className="mb-3" style={{ lineHeight: '1.3' }}>{settings.contactSection.title}</h5>
                        {settings.contactSection.subtitle && (
                          <p 
                            className="text-muted" 
                            style={{ 
                              lineHeight: '1.5',
                              maxWidth: '600px',
                              margin: '0 auto'
                            }}
                          >
                            {settings.contactSection.subtitle}
                          </p>
                        )}
                      </div>
                      <Row>
                        {settings.contactSection.showForm && (
                          <Col md={settings.contactSection.showContactInfo ? 6 : 12}>
                            <div className="bg-white p-3 rounded border">
                              <h6 className="mb-2">Contact Form</h6>
                              <div className="text-center py-2">
                                <i className="fas fa-envelope fa-2x text-muted mb-2"></i>
                                <p className="text-muted small mb-0">Interactive form will appear here</p>
                              </div>
                            </div>
                          </Col>
                        )}
                        {settings.contactSection.showContactInfo && (
                          <Col md={settings.contactSection.showForm ? 6 : 12}>
                            <div className="bg-white p-3 rounded border">
                              <h6 className="mb-2">Contact Information</h6>
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
                            </div>
                          </Col>
                        )}
                      </Row>
                      {settings.contactSection.showMap && settings.contactSection.mapEmbedCode && (
                        <div className="mt-3 bg-white p-2 rounded border text-center">
                          <i className="fas fa-map fa-2x text-muted mb-2"></i>
                          <p className="text-muted small mb-0">Embedded map will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                  <div 
                    className="position-relative" 
                    style={{ 
                      textAlign: settings.rulesSection.textStyle.textAlign,
                      maxWidth: '900px',
                      margin: '0 auto'
                    }}
                  >
                    <h5 
                      className="mb-4"
                      style={{
                        color: settings.rulesSection.textStyle.titleColor,
                        fontSize: settings.rulesSection.textStyle.titleFontSize,
                        fontFamily: settings.rulesSection.textStyle.fontFamily,
                        textAlign: settings.rulesSection.textStyle.textAlign,
                        lineHeight: '1.3'
                      }}
                    >
                      {settings.rulesSection.title}
                    </h5>
                    <Row>
                      <Col md={6}>
                        {settings.rulesSection.depositRule && (
                          <div className="mb-2">
                            <i className="fas fa-credit-card text-success me-2"></i>
                            <small 
                              style={{
                                color: settings.rulesSection.textStyle.textColor,
                                fontSize: settings.rulesSection.textStyle.textFontSize,
                                fontFamily: settings.rulesSection.textStyle.fontFamily
                              }}
                            >
                              {settings.rulesSection.depositRule}
                            </small>
                          </div>
                        )}
                        {settings.rulesSection.latenessRule && (
                          <div className="mb-2">
                            <i className="fas fa-clock text-warning me-2"></i>
                            <small 
                              style={{
                                color: settings.rulesSection.textStyle.textColor,
                                fontSize: settings.rulesSection.textStyle.textFontSize,
                                fontFamily: settings.rulesSection.textStyle.fontFamily
                              }}
                            >
                              {settings.rulesSection.latenessRule}
                            </small>
                          </div>
                        )}
                      </Col>
                      <Col md={6}>
                        {settings.rulesSection.noshowRule && (
                          <div className="mb-2">
                            <i className="fas fa-user-times text-danger me-2"></i>
                            <small 
                              style={{
                                color: settings.rulesSection.textStyle.textColor,
                                fontSize: settings.rulesSection.textStyle.textFontSize,
                                fontFamily: settings.rulesSection.textStyle.fontFamily
                              }}
                            >
                              {settings.rulesSection.noshowRule}
                            </small>
                          </div>
                        )}
                        {settings.rulesSection.cancellationRule && (
                          <div className="mb-2">
                            <i className="fas fa-ban text-info me-2"></i>
                            <small 
                              style={{
                                color: settings.rulesSection.textStyle.textColor,
                                fontSize: settings.rulesSection.textStyle.textFontSize,
                                fontFamily: settings.rulesSection.textStyle.fontFamily
                              }}
                            >
                              {settings.rulesSection.cancellationRule}
                            </small>
                          </div>
                        )}
                      </Col>
                    </Row>
                    {settings.rulesSection.additionalRules && (
                      <div className="mt-3 pt-2 border-top">
                        <small 
                          style={{
                            color: settings.rulesSection.textStyle.textColor,
                            fontSize: settings.rulesSection.textStyle.textFontSize,
                            fontFamily: settings.rulesSection.textStyle.fontFamily
                          }}
                        >
                          {settings.rulesSection.additionalRules}
                        </small>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Preview */}
                <div
                  className="p-4 position-relative"
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
                  <div className="position-relative" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <Row className="text-center text-md-start">
                      <Col md={4} className="mb-3 mb-md-0">
                        <h6 style={{ fontSize: '1rem', lineHeight: '1.3', marginBottom: '1rem' }}>{settings.businessName}</h6>
                        {settings.footerSection.customFooterText && (
                          <p className="mb-2" style={{ lineHeight: '1.5', fontSize: '0.9rem' }}>{settings.footerSection.customFooterText}</p>
                        )}
                        {!settings.footerSection.customFooterText && settings.businessDescription && (
                          <p className="mb-2" style={{ lineHeight: '1.5', fontSize: '0.9rem' }}>{settings.businessDescription}</p>
                        )}
                      </Col>
                      
                      <Col md={4} className="mb-3 mb-md-0">
                        <h6 style={{ fontSize: '1rem', lineHeight: '1.3', marginBottom: '1rem' }}>Contact Info</h6>
                        {settings.footerSection.contactInfo.address && (
                          <div className="mb-2" style={{ lineHeight: '1.4', fontSize: '0.9rem' }}>
                            <i className="fas fa-map-marker-alt me-2"></i>
                            {settings.footerSection.contactInfo.address}
                          </div>
                        )}
                        {settings.footerSection.contactInfo.phone && (
                          <div className="mb-2" style={{ lineHeight: '1.4', fontSize: '0.9rem' }}>
                            <i className="fas fa-phone me-2"></i>
                            {settings.footerSection.contactInfo.phone}
                          </div>
                        )}
                        {settings.footerSection.contactInfo.email && (
                          <div className="mb-2" style={{ lineHeight: '1.4', fontSize: '0.9rem' }}>
                            <i className="fas fa-envelope me-2"></i>
                            {settings.footerSection.contactInfo.email}
                          </div>
                        )}
                        {settings.footerSection.contactInfo.hours && (
                          <div className="mb-2" style={{ lineHeight: '1.4', fontSize: '0.9rem' }}>
                            <i className="fas fa-clock me-2"></i>
                            {settings.footerSection.contactInfo.hours}
                          </div>
                        )}
                      </Col>
                      
                      <Col md={4}>
                        <h6 style={{ fontSize: '1rem', lineHeight: '1.3', marginBottom: '1rem' }}>Follow Us</h6>
                        <div className="d-flex gap-3 mb-3 flex-wrap justify-content-center justify-content-md-start">
                          {settings.socialMedia.facebook && (
                            <a href={settings.socialMedia.facebook} style={{ color: settings.footerSection.textColor, fontSize: '1.3rem' }} title="Facebook">
                              <i className="fab fa-facebook"></i>
                            </a>
                          )}
                          {settings.socialMedia.instagram && (
                            <a href={settings.socialMedia.instagram} style={{ color: settings.footerSection.textColor, fontSize: '1.3rem' }} title="Instagram">
                              <i className="fab fa-instagram"></i>
                            </a>
                          )}
                          {settings.socialMedia.tiktok && (
                            <a href={settings.socialMedia.tiktok} style={{ color: settings.footerSection.textColor, fontSize: '1.3rem' }} title="TikTok">
                              <i className="fab fa-tiktok"></i>
                            </a>
                          )}
                          {settings.socialMedia.linkedin && (
                            <a href={settings.socialMedia.linkedin} style={{ color: settings.footerSection.textColor, fontSize: '1.3rem' }} title="LinkedIn">
                              <i className="fab fa-linkedin"></i>
                            </a>
                          )}
                          {settings.socialMedia.whatsapp && (
                            <a href={`https://wa.me/${settings.socialMedia.whatsapp}`} style={{ color: settings.footerSection.textColor, fontSize: '1.3rem' }} title="WhatsApp">
                              <i className="fab fa-whatsapp"></i>
                            </a>
                          )}
                          {settings.socialMedia.website && (
                            <a href={settings.socialMedia.website} style={{ color: settings.footerSection.textColor, fontSize: '1.3rem' }} title="Website">
                              <i className="fas fa-globe"></i>
                            </a>
                          )}
                        </div>
                        {settings.footerSection.showPoweredBy && (
                          <div className="text-center text-md-start">
                            <p className="mb-0" style={{ fontSize: '0.8rem', opacity: 0.8, lineHeight: '1.4' }}>
                              Powered by{' '}
                              <a 
                                href="https://bookitbyzewo.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                  color: settings.footerSection.textColor, 
                                  textDecoration: 'none',
                                  fontWeight: 'bold'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                              >
                                BookIt by Zewo
                              </a>
                            </p>
                          </div>
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