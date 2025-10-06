'use client'

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { createSupabaseClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [refreshToken, setRefreshToken] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useLanguage()
  const locale = language === 'es' ? 'es' : 'en'

  useEffect(() => {
    // Get tokens from URL fragments
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const access_token = hashParams.get('access_token')
    const refresh_token = hashParams.get('refresh_token')

    if (access_token && refresh_token) {
      setAccessToken(access_token)
      setRefreshToken(refresh_token)
    } else {
      setError(
        locale === 'es' 
          ? 'Enlace de restablecimiento inválido o expirado.'
          : 'Invalid or expired reset link.'
      )
    }
  }, [locale])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError(
        locale === 'es' 
          ? 'Las contraseñas no coinciden.'
          : 'Passwords do not match.'
      )
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError(
        locale === 'es' 
          ? 'La contraseña debe tener al menos 6 caracteres.'
          : 'Password must be at least 6 characters long.'
      )
      setLoading(false)
      return
    }

    try {
      const supabase = createSupabaseClient()
      
      // Set the session with the tokens
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      // Redirect to login with success message
      router.push('/login?message=password-updated')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!accessToken) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="shadow-sm">
              <Card.Body className="p-4 text-center">
                <Alert variant="danger">
                  {locale === 'es' 
                    ? 'Enlace de restablecimiento inválido o expirado.'
                    : 'Invalid or expired reset link.'
                  }
                </Alert>
                <Link href="/forgot-password" className="btn btn-outline-success">
                  {locale === 'es' ? 'Solicitar nuevo enlace' : 'Request new link'}
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-success">
                  {locale === 'es' ? 'Nueva Contraseña' : 'New Password'}
                </h2>
                <p className="text-muted">
                  {locale === 'es' 
                    ? 'Ingresa tu nueva contraseña'
                    : 'Enter your new password'
                  }
                </p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {locale === 'es' ? 'Nueva Contraseña' : 'New Password'}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={locale === 'es' ? 'Mínimo 6 caracteres' : 'Minimum 6 characters'}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    {locale === 'es' ? 'Confirmar Contraseña' : 'Confirm Password'}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={locale === 'es' ? 'Repite la contraseña' : 'Repeat password'}
                    required
                  />
                </Form.Group>

                <Button
                  variant="success"
                  type="submit"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading 
                    ? (locale === 'es' ? 'Actualizando...' : 'Updating...')
                    : (locale === 'es' ? 'Actualizar Contraseña' : 'Update Password')
                  }
                </Button>
              </Form>

              <div className="text-center">
                <Link href="/login" className="text-muted text-decoration-none">
                  {locale === 'es' ? '← Volver al inicio de sesión' : '← Back to login'}
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}