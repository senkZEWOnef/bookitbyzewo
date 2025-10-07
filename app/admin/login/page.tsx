'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'

export default function AdminLoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()

      if (response.ok) {
        // Store admin session
        localStorage.setItem('admin_token', data.token)
        router.push('/admin/dashboard')
      } else {
        setError(data.error || 'Invalid credentials')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center" style={{ background: '#1a1a1a' }}>
      <Row className="w-100 justify-content-center">
        <Col md={4}>
          <Card className="shadow-lg border-0" style={{ background: '#2d2d2d', color: '#fff' }}>
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h3 className="text-warning">⚡ BookIt Admin</h3>
                <p className="text-muted">Backdoor Access Panel</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    required
                    style={{ background: '#1a1a1a', border: '1px solid #444', color: '#fff' }}
                    placeholder="Enter username"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="text-light">Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    required
                    style={{ background: '#1a1a1a', border: '1px solid #444', color: '#fff' }}
                    placeholder="Enter password"
                  />
                </Form.Group>

                <Button 
                  type="submit" 
                  variant="warning" 
                  className="w-100"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? 'Authenticating...' : 'Access Admin Panel'}
                </Button>
              </Form>

              <div className="text-center mt-4">
                <small className="text-muted">
                  🔒 Authorized personnel only
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}