'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Form, Button, Card, Alert } from 'react-bootstrap'
// No imports needed
import { useLanguage } from '@/lib/language-context'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const authError = searchParams.get('error')

  useEffect(() => {
    if (authError) {
      switch (authError) {
        case 'auth_callback_error':
          setError('Authentication failed. Please try again.')
          break
        case 'auth_exchange_error':
          setError('Session setup failed. Please try logging in again.')
          break
        case 'no_auth_code':
          setError('Authentication code missing. Please try again.')
          break
        default:
          setError('An authentication error occurred.')
      }
    }
  }, [authError])

  const handleLogin = async (e: React.FormEvent) => {
    console.log('🔐 LOGIN: handleLogin called')
    console.log('🔐 LOGIN: Event type:', e.type)
    console.log('🔐 LOGIN: Current target:', e.currentTarget)
    
    e.preventDefault()
    e.stopPropagation()
    
    console.log('🔐 LOGIN: Form submitted!')
    console.log('🔐 LOGIN: Email:', email)
    console.log('🔐 LOGIN: Password length:', password.length)
    
    setLoading(true)
    setError('')
    
    if (!email || !password) {
      setError('Please enter both email and password')
      setLoading(false)
      return
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password })
    })

    const result = await response.json()

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.user && result.token) {
      localStorage.setItem('user', JSON.stringify(result.user))
      localStorage.setItem('token', result.token)
      console.log('🔐 LOGIN: Success! Redirecting to dashboard...')
      router.push('/dashboard')
      return
    }
    
    setLoading(false)
  }


  return (
    <Card>
      <Card.Body className="p-4">
        <h4 className="text-center mb-4">{t('auth.login.title')}</h4>
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        
        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-3">
            <Form.Label>{t('auth.login.email')}</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
            />
          </Form.Group>
          
          <Form.Group className="mb-4">
            <Form.Label>{t('auth.login.password')}</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Tu contraseña"
            />
          </Form.Group>
          
          <Button 
            type="submit" 
            variant="success" 
            className="w-100 mb-3"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('auth.login.submit')}
          </Button>
        </Form>
        
        <div className="text-center">
          <p className="mb-2">
            {t('auth.login.signup')}{' '}
            <Link href="/signup" className="text-success text-decoration-none">
              {t('nav.signup')}
            </Link>
          </p>
          <Link href="/forgot-password" className="text-muted text-decoration-none small">
            {t('auth.login.forgot')}
          </Link>
        </div>
      </Card.Body>
    </Card>
  )
}