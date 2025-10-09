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
        console.log('Login successful, storing token:', data.token.substring(0, 8) + '...')
        localStorage.setItem('admin_token', data.token)
        console.log('Token stored, redirecting to dashboard')
        router.push('/admin/dashboard')
      } else {
        console.log('Login failed:', data.error)
        setError(data.error || 'Invalid credentials')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-mesh text-white position-relative overflow-hidden" style={{ minHeight: '100vh' }}>
        {/* Background gradient matching landing page */}
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          background: 'radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)'
        }}></div>
      
      <Container fluid className="min-vh-100 d-flex align-items-center position-relative">
        <Row className="w-100 justify-content-center">
          <Col md={4}>
            <Card 
              className="shadow-lg border-0" 
              style={{ 
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px'
              }}
            >
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <i className="fab fa-whatsapp text-success me-2" style={{ fontSize: '2.5rem' }}></i>
                    <h3 className="text-white mb-0 fw-bold">BookIt Admin</h3>
                  </div>
                  <p className="text-white-50">Secure Access Panel</p>
                </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-white fw-medium">Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    required
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      border: '1px solid rgba(255, 255, 255, 0.2)', 
                      color: '#fff',
                      borderRadius: '8px'
                    }}
                    placeholder="Enter username"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="text-white fw-medium">Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    required
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      border: '1px solid rgba(255, 255, 255, 0.2)', 
                      color: '#fff',
                      borderRadius: '8px'
                    }}
                    placeholder="Enter password"
                  />
                </Form.Group>

                <Button 
                  type="submit" 
                  className="w-100 fw-medium py-3"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.1rem'
                  }}
                >
                  <i className="fas fa-sign-in-alt me-2"></i>
                  {loading ? 'Authenticating...' : 'Access Admin Panel'}
                </Button>
              </Form>

              <div className="text-center mt-4">
                <small className="text-white-50">
                  🔒 Authorized personnel only
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      </Container>
      </div>
    </>
  )
}