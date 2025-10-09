'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Form, Button, Card, Alert } from 'react-bootstrap'
import { createSupabaseClient } from '@/lib/supabase'
import { useLanguage } from '@/lib/language-context'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createSupabaseClient()
  const { t } = useLanguage()

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

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          phone: formData.phone
        }
      }
    })

    if (error) {
      setError(error.message)
    } else if (data.user) {
      // Profile is automatically created by database trigger
      router.push('/dashboard/onboarding')
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

          <Form.Group className="mb-4">
            <Form.Label>{t('auth.signup.confirm')}</Form.Label>
            <Form.Control
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              required
              placeholder="Confirm your password"
            />
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