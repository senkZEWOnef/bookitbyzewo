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
  slogan: string
  phone: string
  email: string
  whatsappNumber: string
  aboutText: string
  socialFacebook: string
  socialInstagram: string
  socialTwitter: string
  socialTiktok: string
  businessHours: {
    monday?: { open: string; close: string; closed?: boolean }
    tuesday?: { open: string; close: string; closed?: boolean }
    wednesday?: { open: string; close: string; closed?: boolean }
    thursday?: { open: string; close: string; closed?: boolean }
    friday?: { open: string; close: string; closed?: boolean }
    saturday?: { open: string; close: string; closed?: boolean }
    sunday?: { open: string; close: string; closed?: boolean }
  }
  showBusinessHours: boolean
  callToActionText: string
  heroOverlayOpacity: number
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
    heroImageUrl: '',
    slogan: '',
    phone: '',
    email: '',
    whatsappNumber: '',
    aboutText: '',
    socialFacebook: '',
    socialInstagram: '',
    socialTwitter: '',
    socialTiktok: '',
    businessHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '10:00', close: '15:00', closed: false },
      sunday: { open: '10:00', close: '15:00', closed: true }
    },
    showBusinessHours: true,
    callToActionText: 'Book Now',
    heroOverlayOpacity: 0.4
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
      console.log('🎨 BRANDING: Loading business data...')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('🎨 BRANDING: No user found')
        return
      }

      console.log('🎨 BRANDING: User found:', user.id)
      const { data: business, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      console.log('🎨 BRANDING: Business query result:', { business, error })

      if (error) {
        console.error('🎨 BRANDING: Error loading business:', error)
        router.push('/dashboard/onboarding')
        return
      }

      setBusinessData(business)
      
      // Pre-populate with existing branding data (with safe fallbacks)
      setBrandingData(prev => ({
        ...prev,
        hasLogo: !!(business.logo_url),
        logoUrl: business.logo_url || '',
        primaryColor: business.primary_color || '#007bff',
        secondaryColor: business.secondary_color || '#6c757d',
        hasHeroSection: business.has_hero_section ?? true,
        heroTitle: business.hero_title || `Welcome to ${business.name}`,
        heroSubtitle: business.hero_subtitle || 'Book your appointment in just a few clicks',
        heroImageUrl: business.hero_image_url || '',
        slogan: business.slogan || '',
        phone: business.phone || '',
        email: business.email || '',
        whatsappNumber: business.whatsapp_number || '',
        aboutText: business.about_text || '',
        socialFacebook: business.social_facebook || '',
        socialInstagram: business.social_instagram || '',
        socialTwitter: business.social_twitter || '',
        socialTiktok: business.social_tiktok || '',
        businessHours: business.business_hours || prev.businessHours,
        showBusinessHours: business.show_business_hours ?? true,
        callToActionText: business.call_to_action_text || 'Book Now',
        heroOverlayOpacity: business.hero_overlay_opacity ?? 0.4
      }))
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load business data')
    }
  }

  const handleFileUpload = async (file: File, type: 'logo' | 'hero') => {
    if (!businessData) return null

    try {
      console.log(`🎨 BRANDING: Uploading ${type} file:`, file.name, `Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 50MB)`)
      }
      
      console.log(`🎨 BRANDING: Checking buckets...`)
      // First check if the bucket exists with timeout
      const bucketCheckPromise = supabase.storage.listBuckets()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Bucket check timeout')), 10000)
      )
      
      const { data: buckets, error: bucketsError } = await Promise.race([bucketCheckPromise, timeoutPromise]) as any
      console.log(`🎨 BRANDING: Available buckets:`, buckets?.map((b: any) => b.name))
      
      if (bucketsError) {
        console.error(`🎨 BRANDING: Error listing buckets:`, bucketsError)
        throw new Error(`Storage access error: ${(bucketsError as any)?.message || 'Storage access failed'}`)
      }

      const bucketExists = buckets?.some((bucket: any) => bucket.name === 'business-assets')
      if (!bucketExists) {
        console.error(`🎨 BRANDING: business-assets bucket does not exist`)
        throw new Error('Storage bucket not configured. Please contact support.')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${businessData.slug}-${type}-${Date.now()}.${fileExt}`
      const filePath = `${businessData.id}/${fileName}`

      console.log(`🎨 BRANDING: Upload path:`, filePath)

      console.log(`🎨 BRANDING: About to start upload...`)
      const uploadStartTime = Date.now()
      
      // Add timeout to upload
      const uploadPromise = supabase.storage
        .from('business-assets')
        .upload(filePath, file)
      const uploadTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout (30s)')), 30000)
      )
      
      const { data, error } = await Promise.race([uploadPromise, uploadTimeoutPromise]) as any

      const uploadEndTime = Date.now()
      console.log(`🎨 BRANDING: Upload completed in ${uploadEndTime - uploadStartTime}ms`)
      console.log(`🎨 BRANDING: Upload result:`, { data, error })

      if (error) {
        console.error(`🎨 BRANDING: Upload error:`, error)
        throw new Error(`Upload failed: ${(error as any)?.message || 'Upload failed'}`)
      }

      console.log(`🎨 BRANDING: Getting public URL for:`, filePath)
      const { data: { publicUrl } } = supabase.storage
        .from('business-assets')
        .getPublicUrl(filePath)

      console.log(`🎨 BRANDING: Public URL generated:`, publicUrl)
      return publicUrl
    } catch (err) {
      console.error('🎨 BRANDING: Upload exception:', err)
      throw new Error(`Failed to upload ${type}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleSubmit = async () => {
    console.log('🎨 BRANDING: Starting form submission...')
    setLoading(true)
    setError('')

    try {
      let logoUrl = brandingData.logoUrl
      let heroImageUrl = brandingData.heroImageUrl

      console.log('🎨 BRANDING: File upload status:', {
        hasLogoFile: !!brandingData.logoFile,
        hasHeroFile: !!brandingData.heroImageFile
      })

      // Upload logo if provided
      if (brandingData.logoFile) {
        console.log('🎨 BRANDING: Uploading logo...')
        try {
          logoUrl = await handleFileUpload(brandingData.logoFile, 'logo') || ''
          console.log('🎨 BRANDING: Logo uploaded successfully:', logoUrl)
        } catch (logoError) {
          console.error('🎨 BRANDING: Logo upload failed:', logoError)
          console.log('🎨 BRANDING: Continuing without logo due to storage issues')
          // Don't throw error, just continue without logo for now
          logoUrl = ''
        }
      }

      // Upload hero image if provided
      if (brandingData.heroImageFile) {
        console.log('🎨 BRANDING: Uploading hero image...')
        try {
          heroImageUrl = await handleFileUpload(brandingData.heroImageFile, 'hero') || ''
          console.log('🎨 BRANDING: Hero image uploaded successfully:', heroImageUrl)
        } catch (heroError) {
          console.error('🎨 BRANDING: Hero image upload failed:', heroError)
          console.log('🎨 BRANDING: Continuing without hero image due to storage issues')
          // Don't throw error, just continue without hero image for now
          heroImageUrl = ''
        }
      }

      // Update business with branding data
      console.log('🎨 BRANDING: Starting database update...')
      console.log('🎨 BRANDING: Update data:', {
        businessId: businessData.id,
        logoUrl,
        heroImageUrl,
        primaryColor: brandingData.primaryColor,
        hasHeroSection: brandingData.hasHeroSection
      })

      const updateStartTime = Date.now()
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
          slogan: brandingData.slogan,
          phone: brandingData.phone,
          email: brandingData.email,
          whatsapp_number: brandingData.whatsappNumber,
          about_text: brandingData.aboutText,
          social_facebook: brandingData.socialFacebook,
          social_instagram: brandingData.socialInstagram,
          social_twitter: brandingData.socialTwitter,
          social_tiktok: brandingData.socialTiktok,
          business_hours: brandingData.businessHours,
          show_business_hours: brandingData.showBusinessHours,
          call_to_action_text: brandingData.callToActionText,
          hero_overlay_opacity: brandingData.heroOverlayOpacity,
          branding_completed: true
        })
        .eq('id', businessData.id)

      const updateEndTime = Date.now()
      console.log(`🎨 BRANDING: Database update completed in ${updateEndTime - updateStartTime}ms`)

      if (error) {
        console.error('🎨 BRANDING: Database update error:', error)
        throw error
      }

      console.log('🎨 BRANDING: Redirecting to landing page...')
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
            <p className="text-muted">Let's customize your booking page in 4 quick steps</p>
            <ProgressBar now={(step / 4) * 100} className="mb-3" style={{ height: '8px' }} />
            <small className="text-muted">Step {step} of 4 • About 3 minutes</small>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Card>
            <Card.Body className="p-4">
              
              {/* Step 1: Colors */}
              {step === 1 && (
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

                  <div className="text-center">
                    <Button variant="success" onClick={() => setStep(2)} size="lg">
                      Continue →
                    </Button>
                  </div>
                </div>
              )}


              {/* Step 2: Business Info & Slogan */}
              {step === 2 && (
                <div>
                  <h5 className="mb-4">✨ Business Details</h5>
                  <p className="text-muted mb-4">
                    Add a slogan and about section to make your page more engaging.
                  </p>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Business Slogan (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      value={brandingData.slogan}
                      onChange={(e) => setBrandingData(prev => ({ ...prev, slogan: e.target.value }))}
                      placeholder="e.g., Quality service, every time"
                    />
                    <Form.Text className="text-muted">
                      A catchy phrase that describes your business
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>About Your Business</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={brandingData.aboutText}
                      onChange={(e) => setBrandingData(prev => ({ ...prev, aboutText: e.target.value }))}
                      placeholder={`Tell customers about ${businessData?.name}...`}
                    />
                    <Form.Text className="text-muted">
                      Describe your services, experience, or what makes you special
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Call-to-Action Button Text</Form.Label>
                    <Form.Control
                      type="text"
                      value={brandingData.callToActionText}
                      onChange={(e) => setBrandingData(prev => ({ ...prev, callToActionText: e.target.value }))}
                      placeholder="Book Now"
                    />
                  </Form.Group>

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

              {/* Step 3: Contact & Social Media */}
              {step === 3 && (
                <div>
                  <h5 className="mb-4">📞 Contact & Social Media</h5>
                  <p className="text-muted mb-4">
                    Add your contact information and social media links.
                  </p>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="tel"
                          value={brandingData.phone}
                          onChange={(e) => setBrandingData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+1 787 555 0123"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          value={brandingData.email}
                          onChange={(e) => setBrandingData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="info@business.com"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
                    <Form.Label>WhatsApp Number (for bookings)</Form.Label>
                    <Form.Control
                      type="tel"
                      value={brandingData.whatsappNumber}
                      onChange={(e) => setBrandingData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                      placeholder="+1 787 555 0123"
                    />
                    <Form.Text className="text-muted">
                      Customers can contact you directly via WhatsApp
                    </Form.Text>
                  </Form.Group>

                  <h6 className="mb-3">Social Media Links (Optional)</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <i className="fab fa-facebook text-primary me-2"></i>
                          Facebook
                        </Form.Label>
                        <Form.Control
                          type="url"
                          value={brandingData.socialFacebook}
                          onChange={(e) => setBrandingData(prev => ({ ...prev, socialFacebook: e.target.value }))}
                          placeholder="https://facebook.com/yourbusiness"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <i className="fab fa-instagram text-danger me-2"></i>
                          Instagram
                        </Form.Label>
                        <Form.Control
                          type="url"
                          value={brandingData.socialInstagram}
                          onChange={(e) => setBrandingData(prev => ({ ...prev, socialInstagram: e.target.value }))}
                          placeholder="https://instagram.com/yourbusiness"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <i className="fab fa-twitter text-info me-2"></i>
                          Twitter
                        </Form.Label>
                        <Form.Control
                          type="url"
                          value={brandingData.socialTwitter}
                          onChange={(e) => setBrandingData(prev => ({ ...prev, socialTwitter: e.target.value }))}
                          placeholder="https://twitter.com/yourbusiness"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <i className="fab fa-tiktok text-dark me-2"></i>
                          TikTok
                        </Form.Label>
                        <Form.Control
                          type="url"
                          value={brandingData.socialTiktok}
                          onChange={(e) => setBrandingData(prev => ({ ...prev, socialTiktok: e.target.value }))}
                          placeholder="https://tiktok.com/@yourbusiness"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-between">
                    <Button variant="outline-secondary" onClick={() => setStep(2)}>
                      ← Back
                    </Button>
                    <Button variant="success" onClick={() => setStep(4)}>
                      Continue →
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Business Hours & Final */}
              {step === 4 && (
                <div>
                  <h5 className="mb-4">⏰ Business Hours & Final Touch</h5>
                  
                  <Form.Check
                    type="switch"
                    id="hours-switch"
                    label="Show business hours on landing page"
                    checked={brandingData.showBusinessHours}
                    onChange={(e) => setBrandingData(prev => ({ ...prev, showBusinessHours: e.target.checked }))}
                    className="mb-4"
                  />

                  {brandingData.showBusinessHours && (
                    <div className="mb-4">
                      <h6 className="mb-3">Set Your Hours</h6>
                      {Object.entries(brandingData.businessHours).map(([day, hours]) => (
                        <Row key={day} className="mb-2 align-items-center">
                          <Col sm={2}>
                            <strong className="text-capitalize">{day}</strong>
                          </Col>
                          <Col sm={2}>
                            <Form.Check
                              type="checkbox"
                              label="Closed"
                              checked={hours?.closed || false}
                              onChange={(e) => setBrandingData(prev => ({
                                ...prev,
                                businessHours: {
                                  ...prev.businessHours,
                                  [day]: { ...hours, closed: e.target.checked }
                                }
                              }))}
                            />
                          </Col>
                          {!hours?.closed && (
                            <>
                              <Col sm={3}>
                                <Form.Control
                                  type="time"
                                  value={hours?.open || '09:00'}
                                  onChange={(e) => setBrandingData(prev => ({
                                    ...prev,
                                    businessHours: {
                                      ...prev.businessHours,
                                      [day]: { ...hours, open: e.target.value }
                                    }
                                  }))}
                                />
                              </Col>
                              <Col sm={1} className="text-center">
                                <span>to</span>
                              </Col>
                              <Col sm={3}>
                                <Form.Control
                                  type="time"
                                  value={hours?.close || '17:00'}
                                  onChange={(e) => setBrandingData(prev => ({
                                    ...prev,
                                    businessHours: {
                                      ...prev.businessHours,
                                      [day]: { ...hours, close: e.target.value }
                                    }
                                  }))}
                                />
                              </Col>
                            </>
                          )}
                        </Row>
                      ))}
                    </div>
                  )}

                  <div className="mb-4">
                    <h6 className="mb-3">Hero Image Overlay</h6>
                    <Form.Label>Background Darkness: {Math.round(brandingData.heroOverlayOpacity * 100)}%</Form.Label>
                    <Form.Range
                      min={0}
                      max={0.8}
                      step={0.1}
                      value={brandingData.heroOverlayOpacity}
                      onChange={(e) => setBrandingData(prev => ({ ...prev, heroOverlayOpacity: parseFloat(e.target.value) }))}
                    />
                    <Form.Text className="text-muted">
                      Adjust how dark the overlay is on your hero background image
                    </Form.Text>
                  </div>

                  <Alert variant="success">
                    <h6>🎉 Almost done!</h6>
                    <p className="mb-0">
                      Your professional landing page is ready to go live. Customers will see a beautiful 
                      branded page when they scan your QR code.
                    </p>
                  </Alert>

                  <div className="d-flex justify-content-between">
                    <Button variant="outline-secondary" onClick={() => setStep(3)}>
                      ← Back
                    </Button>
                    <Button 
                      variant="success" 
                      onClick={handleSubmit}
                      disabled={loading}
                      size="lg"
                    >
                      {loading ? 'Creating Your Page...' : 'Launch My Landing Page 🚀'}
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