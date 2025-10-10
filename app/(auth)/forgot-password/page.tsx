'use client'

import { useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { language } = useLanguage()
  const locale = language === 'es' ? 'es' : 'en'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      // TODO: Implement password reset with Neon database
      const error = { message: 'Password reset functionality will be available soon.' }
      if (error) throw error

      setMessage(
        locale === 'es' 
          ? 'Se ha enviado un enlace de restablecimiento a tu correo electrónico.'
          : 'A reset link has been sent to your email address.'
      )
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-success">
                  {locale === 'es' ? 'Restablecer Contraseña' : 'Reset Password'}
                </h2>
                <p className="text-muted">
                  {locale === 'es' 
                    ? 'Ingresa tu email para recibir un enlace de restablecimiento'
                    : 'Enter your email to receive a reset link'
                  }
                </p>
              </div>

              {message && <Alert variant="success">{message}</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {locale === 'es' ? 'Correo Electrónico' : 'Email Address'}
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={locale === 'es' ? 'tu@email.com' : 'your@email.com'}
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
                    ? (locale === 'es' ? 'Enviando...' : 'Sending...')
                    : (locale === 'es' ? 'Enviar Enlace' : 'Send Reset Link')
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