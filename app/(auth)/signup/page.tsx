'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Form, Button, Card, Alert } from 'react-bootstrap'
import { useLanguage } from '@/lib/language-context'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    trialCode: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { t } = useLanguage()

  // Shared links look like /signup?code=FULL3M-ABC123
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) setFormData(prev => ({ ...prev, trialCode: code }))
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      console.log('🔄 Attempting signup with data:', {
        email: formData.email.trim(),
        full_name: formData.fullName,
        phone: formData.phone || 'not provided',
        password_length: formData.password.length
      })

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          full_name: formData.fullName,
          phone: formData.phone,
          trial_code: formData.trialCode.trim() || undefined
        })
      })

      const result = await response.json()
      console.log('📡 Signup response:', { 
        status: response.status, 
        ok: response.ok, 
        result 
      })

      if (response.ok) {
        console.log('✅ Signup successful, redirecting to plan selection')
        if (result.user.plan_status === 'trial') {
          // A trial code started the trial already, so skip plan selection
          localStorage.setItem('user', JSON.stringify(result.user))
          router.push('/dashboard/onboarding')
        } else {
          // Store user data temporarily for plan selection
          localStorage.setItem('pendingUser', JSON.stringify(result.user))
          router.push('/choose-plan')
        }
      } else {
        console.error('❌ Signup failed:', result)
        // Show more detailed error information
        const errorMessage = result.details 
          ? `${result.error} (${result.details})`
          : result.error || 'Failed to create account'
        setError(errorMessage)
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
    
    setLoading(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <Card.Body className="p-4">
        <h4 className="text-center mb-4">{t('auth.signup.title')}</h4>
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSignup}>
          <Form.Group className="mb-3">
            <Form.Label>{t('auth.signup.name')}</Form.Label>
            <Form.Control
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              required
              placeholder="Tu nombre completo"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t('auth.signup.phone')}</Form.Label>
            <Form.Control
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1 787 555 0123"
            />
            <Form.Text className="text-muted">
              Used for WhatsApp notifications
            </Form.Text>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>{t('auth.signup.email')}</Form.Label>
            <Form.Control
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              placeholder="tu@email.com"
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>{t('auth.signup.password')}</Form.Label>
            <Form.Control
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              placeholder="At least 6 characters"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t('auth.signup.confirm')}</Form.Label>
            <Form.Control
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              required
              placeholder="Confirm your password"
            />
          </Form.Group>
          
          <Form.Group className="mb-4">
            <Form.Label>Trial code (optional)</Form.Label>
            <Form.Control
              type="text"
              value={formData.trialCode}
              onChange={(e) => handleInputChange('trialCode', e.target.value.toUpperCase())}
              placeholder="FULL3M-ABC123"
              autoCapitalize="characters"
            />
            <Form.Text className="text-muted">
              Got a free trial code? Enter it to start your trial without a card.
            </Form.Text>
          </Form.Group>

          <Button 
            type="submit" 
            variant="success" 
            className="w-100 mb-3"
            disabled={loading}
          >
            {loading ? t('auth.signup.creating') : t('auth.signup.submit')}
          </Button>
        </Form>
        
        <div className="text-center">
          <p className="mb-0">
            {t('auth.signup.login')}{' '}
            <Link href="/login" className="text-success text-decoration-none">
              {t('nav.login')}
            </Link>
          </p>
        </div>
      </Card.Body>
    </Card>
  )
}