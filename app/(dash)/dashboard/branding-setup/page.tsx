'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Row, Col, Card, Form, Button, Alert, ProgressBar } from 'react-bootstrap'
import { supabase } from '@/lib/supabase'

interface BrandingData {
  hasLogo: boolean
  logoFile: File | null
  logoUrl: string
  primaryColor: string
  secondaryColor: string
  hasHeroSection: boolean
  heroTitle: string
  heroSubtitle: string
  heroImageFile: File | null
  heroImageUrl: string
}

const colorPresets = [
  { name: 'Classic Blue', primary: '#007bff', secondary: '#6c757d' },
  { name: 'Success Green', primary: '#28a745', secondary: '#20c997' },
  { name: 'Elegant Purple', primary: '#6f42c1', secondary: '#e83e8c' },
  { name: 'Warm Orange', primary: '#fd7e14', secondary: '#ffc107' },
  { name: 'Professional Navy', primary: '#003d82', secondary: '#6c757d' },
  { name: 'Modern Teal', primary: '#20c997', secondary: '#17a2b8' },
  { name: 'Bold Red', primary: '#dc3545', secondary: '#fd7e14' },
  { name: 'Soft Pink', primary: '#e83e8c', secondary: '#f8f9fa' }
]

export default function BrandingSetupPage() {
  const [step, setStep] = useState(1)
  const [brandingData, setBrandingData] = useState<BrandingData>({
    hasLogo: false,
    logoFile: null,
    logoUrl: '',
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    hasHeroSection: true,
    heroTitle: '',
    heroSubtitle: '',
    heroImageFile: null,
    heroImageUrl: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [businessData, setBusinessData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    loadBusinessData()
  }, [])

  const loadBusinessData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: business, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (error) {
        console.error('Error loading business:', error)
        router.push('/dashboard/onboarding')
        return
      }

      setBusinessData(business)
      
      // Pre-populate with existing branding data
      setBrandingData(prev => ({
        ...prev,
        hasLogo: !!business.logo_url,
        logoUrl: business.logo_url || '',
        primaryColor: business.primary_color || '#007bff',
        secondaryColor: business.secondary_color || '#6c757d',
        hasHeroSection: business.has_hero_section ?? true,
        heroTitle: business.hero_title || `Welcome to ${business.name}`,
        heroSubtitle: business.hero_subtitle || 'Book your appointment in just a few clicks',
        heroImageUrl: business.hero_image_url || ''
      }))
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load business data')
    }
  }

  const handleFileUpload = async (file: File, type: 'logo' | 'hero') => {
    if (!businessData) return null

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${businessData.slug}-${type}-${Date.now()}.${fileExt}`
      const filePath = `${businessData.id}/${fileName}`

      const { data, error } = await supabase.storage
        .from('business-assets')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('business-assets')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (err) {
      console.error('Upload error:', err)
      throw new Error('Failed to upload file')
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      let logoUrl = brandingData.logoUrl
      let heroImageUrl = brandingData.heroImageUrl

      // Upload logo if provided
      if (brandingData.logoFile) {
        logoUrl = await handleFileUpload(brandingData.logoFile, 'logo')
      }

      // Upload hero image if provided
      if (brandingData.heroImageFile) {
        heroImageUrl = await handleFileUpload(brandingData.heroImageFile, 'hero')
      }

      // Update business with branding data
      const { error } = await supabase
        .from('businesses')
        .update({
          logo_url: logoUrl,
          primary_color: brandingData.primaryColor,
          secondary_color: brandingData.secondaryColor,
          has_hero_section: brandingData.hasHeroSection,
          hero_title: brandingData.heroTitle,
          hero_subtitle: brandingData.heroSubtitle,
          hero_image_url: heroImageUrl,
          branding_completed: true
        })
        .eq('id', businessData.id)

      if (error) throw error

      router.push('/dashboard/landing-page?updated=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save branding')
    } finally {
      setLoading(false)
    }
  }

  const handleColorPreset = (preset: typeof colorPresets[0]) => {
    setBrandingData(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary
    }))
  }

  if (!businessData) {
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

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <div className="text-center mb-4">
            <h1 className="h3 fw-bold">Make It Yours! 🎨</h1>
            <p className="text-muted">Let's customize your booking page in 3 quick steps</p>
            <ProgressBar now={(step / 3) * 100} className="mb-3" style={{ height: '8px' }} />
            <small className="text-muted">Step {step} of 3 • About 3 minutes</small>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Card>
            <Card.Body className="p-4">
              
              {/* Step 1: Logo */}
              {step === 1 && (
                <div>
                  <h5 className="mb-4">✨ Do you have a logo?</h5>
                  
                  <div className="text-center mb-4">
                    <Form.Check
                      type="radio"
                      id="has-logo"
                      label="Yes, I have a logo"
                      name="hasLogo"
                      checked={brandingData.hasLogo}
                      onChange={() => setBrandingData(prev => ({ ...prev, hasLogo: true }))}
                      className="mb-3"
                    />
                    <Form.Check
                      type="radio"
                      id="no-logo"
                      label="No, just use my business name"
                      name="hasLogo"
                      checked={!brandingData.hasLogo}
                      onChange={() => setBrandingData(prev => ({ ...prev, hasLogo: false }))}
                    />
                  </div>

                  {brandingData.hasLogo && (
                    <div className="text-center">
                      <Form.Group className="mb-3">
                        <Form.Label>Upload Your Logo</Form.Label>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (file) {
                              setBrandingData(prev => ({ ...prev, logoFile: file }))
                            }
                          }}
                        />
                        <Form.Text className="text-muted">
                          PNG or JPG, square format works best
                        </Form.Text>
                      </Form.Group>
                    </div>
                  )}

                  <div className="text-center mt-4">
                    <Button 
                      variant="success" 
                      onClick={() => setStep(2)}
                      disabled={brandingData.hasLogo && !brandingData.logoFile}
                    >
                      Continue →
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Colors */}
              {step === 2 && (
                <div>
                  <h5 className="mb-4">🎨 Choose your colors</h5>
                  
                  <Row className="mb-4">
                    {colorPresets.map((preset, index) => (
                      <Col md={3} sm={6} key={index} className="mb-3">
                        <Card 
                          className={`cursor-pointer h-100 ${
                            brandingData.primaryColor === preset.primary ? 'border-success' : 'border-light'
                          }`}
                          onClick={() => handleColorPreset(preset)}
                          style={{ cursor: 'pointer' }}
                        >
                          <Card.Body className="text-center p-3">
                            <div className="d-flex justify-content-center mb-2">
                              <div 
                                style={{ 
                                  width: '30px', 
                                  height: '30px', 
                                  backgroundColor: preset.primary,
                                  borderRadius: '50%',
                                  marginRight: '5px'
                                }}
                              ></div>
                              <div 
                                style={{ 
                                  width: '30px', 
                                  height: '30px', 
                                  backgroundColor: preset.secondary,
                                  borderRadius: '50%'
                                }}
                              ></div>
                            </div>
                            <small>{preset.name}</small>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  <div className="text-center mb-4">
                    <h6>Preview</h6>
                    <div 
                      className="p-3 rounded"
                      style={{ backgroundColor: brandingData.primaryColor, color: 'white' }}
                    >
                      <strong>{businessData.name}</strong>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between">
                    <Button variant="outline-secondary" onClick={() => setStep(1)}>
                      ← Back
                    </Button>
                    <Button variant="success" onClick={() => setStep(3)}>
                      Continue →
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Hero Section */}
              {step === 3 && (
                <div>
                  <h5 className="mb-4">🚀 Add a hero section?</h5>
                  <p className="text-muted mb-4">
                    A hero section makes a great first impression when customers visit your booking page.
                  </p>
                  
                  <Form.Check
                    type="switch"
                    id="hero-switch"
                    label="Include hero section"
                    checked={brandingData.hasHeroSection}
                    onChange={(e) => setBrandingData(prev => ({ ...prev, hasHeroSection: e.target.checked }))}
                    className="mb-4"
                  />

                  {brandingData.hasHeroSection && (
                    <div>
                      <Form.Group className="mb-3">
                        <Form.Label>Hero Title</Form.Label>
                        <Form.Control
                          type="text"
                          value={brandingData.heroTitle}
                          onChange={(e) => setBrandingData(prev => ({ ...prev, heroTitle: e.target.value }))}
                          placeholder={`Welcome to ${businessData.name}`}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Hero Subtitle</Form.Label>
                        <Form.Control
                          type="text"
                          value={brandingData.heroSubtitle}
                          onChange={(e) => setBrandingData(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                          placeholder="Book your appointment in just a few clicks"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Hero Image (Optional)</Form.Label>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (file) {
                              setBrandingData(prev => ({ ...prev, heroImageFile: file }))
                            }
                          }}
                        />
                        <Form.Text className="text-muted">
                          A photo of your business, services, or team
                        </Form.Text>
                      </Form.Group>
                    </div>
                  )}

                  <div className="d-flex justify-content-between mt-4">
                    <Button variant="outline-secondary" onClick={() => setStep(2)}>
                      ← Back
                    </Button>
                    <Button 
                      variant="success" 
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? 'Creating Your Page...' : 'Complete Setup 🎉'}
                    </Button>
                  </div>
                </div>
              )}

            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}