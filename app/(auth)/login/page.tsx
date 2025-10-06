'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Form, Button, Card, Alert } from 'react-bootstrap'
import { createSupabaseClient } from '@/lib/supabase'
import { useLanguage } from '@/lib/language-context'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createSupabaseClient()
  const { t } = useLanguage()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
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