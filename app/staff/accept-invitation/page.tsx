'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap'
import Link from 'next/link'

interface InvitationDetails {
  id: string
  business_id: string
  email: string
  role: string
  status: string
  expires_at: string
  created_at: string
  business_name: string
  business_description?: string
  invited_by_name?: string
  isExpired: boolean
  isValid: boolean
}

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check if user is already logged in
    const userString = localStorage.getItem('user')
    if (userString) {
      setUser(JSON.parse(userString))
    }

    if (!token) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    fetchInvitationDetails()
  }, [token])

  const fetchInvitationDetails = async () => {
    try {
      const response = await fetch(`/api/staff/accept-invitation?token=${token}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to load invitation')
        return
      }

      setInvitation(result.invitation)
    } catch (error) {
      console.error('Error fetching invitation:', error)
      setError('Failed to load invitation details')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!invitation) return

    setAccepting(true)
    setError('')

    try {
      const response = await fetch('/api/staff/accept-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          userId: user?.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to accept invitation')
        return
      }

      setSuccess(`Successfully joined ${result.businessName} as ${result.role}!`)
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        if (user) {
          router.push('/dashboard')
        } else {
          router.push(`/login?redirect=/dashboard&business=${result.businessId}`)
        }
      }, 2000)

    } catch (error) {
      console.error('Error accepting invitation:', error)
      setError('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  const handleDeclineInvitation = () => {
    // TODO: Implement decline functionality
    router.push('/')
  }

  if (loading) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <div className="text-center">
              <Spinner animation="border" variant="success" />
              <p className="mt-3 text-muted">Loading invitation details...</p>
            </div>
          </Col>
        </Row>
      </Container>
    )
  }

  if (error && !invitation) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="text-center">
              <Card.Body className="p-5">
                <div 
                  className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '80px', 
                    height: '80px',
                    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                    color: 'white'
                  }}
                >
                  <i className="fas fa-exclamation-triangle fs-2"></i>
                </div>
                <h3 className="fw-bold mb-3">Invalid Invitation</h3>
                <p className="text-muted mb-4">{error}</p>
                <Link href="/">
                  <Button variant="primary">
                    <i className="fas fa-home me-2"></i>
                    Go to Homepage
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  if (success) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="text-center">
              <Card.Body className="p-5">
                <div 
                  className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '80px', 
                    height: '80px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white'
                  }}
                >
                  <i className="fas fa-check fs-2"></i>
                </div>
                <h3 className="fw-bold mb-3 text-success">Welcome to the Team!</h3>
                <Alert variant="success" className="mb-4">
                  {success}
                </Alert>
                <p className="text-muted">Redirecting you to your dashboard...</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  if (!invitation?.isValid) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="text-center">
              <Card.Body className="p-5">
                <div 
                  className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '80px', 
                    height: '80px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white'
                  }}
                >
                  <i className="fas fa-clock fs-2"></i>
                </div>
                <h3 className="fw-bold mb-3">
                  {invitation.isExpired ? 'Invitation Expired' : 'Invitation Not Available'}
                </h3>
                <p className="text-muted mb-4">
                  {invitation.isExpired 
                    ? 'This invitation has expired. Please ask the business owner to send you a new invitation.'
                    : `This invitation is ${invitation.status}. Please contact the business owner if you believe this is an error.`
                  }
                </p>
                <Link href="/">
                  <Button variant="primary">
                    <i className="fas fa-home me-2"></i>
                    Go to Homepage
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <div 
                  className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '80px', 
                    height: '80px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white'
                  }}
                >
                  <i className="fas fa-user-plus fs-2"></i>
                </div>
                <h2 className="fw-bold mb-2">Staff Invitation</h2>
                <p className="text-muted">
                  You've been invited to join a team on BookIt by Zewo
                </p>
              </div>

              {error && (
                <Alert variant="danger" className="mb-4">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              <div 
                className="p-4 rounded-3 mb-4"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.1)'
                }}
              >
                <h4 className="fw-bold mb-3">{invitation.business_name}</h4>
                {invitation.business_description && (
                  <p className="text-muted mb-3">{invitation.business_description}</p>
                )}
                
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-user-tag me-2 text-muted"></i>
                      <div>
                        <small className="text-muted">Role</small>
                        <div className="fw-medium text-capitalize">{invitation.role}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-envelope me-2 text-muted"></i>
                      <div>
                        <small className="text-muted">Invited Email</small>
                        <div className="fw-medium">{invitation.email}</div>
                      </div>
                    </div>
                  </div>
                  {invitation.invited_by_name && (
                    <div className="col-sm-6">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-user me-2 text-muted"></i>
                        <div>
                          <small className="text-muted">Invited by</small>
                          <div className="fw-medium">{invitation.invited_by_name}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-calendar me-2 text-muted"></i>
                      <div>
                        <small className="text-muted">Expires</small>
                        <div className="fw-medium">
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {!user && (
                <Alert variant="info" className="mb-4">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>New to BookIt?</strong> When you accept this invitation, you'll be able to create an account with the email address <strong>{invitation.email}</strong>. You can use this same email to create your own business later if you want.
                </Alert>
              )}

              {user && user.email.toLowerCase() !== invitation.email.toLowerCase() && (
                <Alert variant="warning" className="mb-4">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>Email Mismatch:</strong> You're currently logged in as <strong>{user.email}</strong>, but this invitation is for <strong>{invitation.email}</strong>. Please log out and log in with the correct email address, or create a new account with {invitation.email}.
                </Alert>
              )}

              <div className="d-grid gap-3">
                <Button 
                  variant="success" 
                  size="lg"
                  onClick={handleAcceptInvitation}
                  disabled={accepting || (user && user.email.toLowerCase() !== invitation.email.toLowerCase())}
                >
                  {accepting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Accepting Invitation...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-2"></i>
                      Accept Invitation
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline-secondary"
                  onClick={handleDeclineInvitation}
                  disabled={accepting}
                >
                  <i className="fas fa-times me-2"></i>
                  Decline Invitation
                </Button>
              </div>

              {!user && (
                <div className="text-center mt-4">
                  <p className="text-muted mb-2">Already have a BookIt account?</p>
                  <Link href={`/login?redirect=/staff/accept-invitation?token=${token}`}>
                    <Button variant="link">
                      Sign in with your existing account
                    </Button>
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}