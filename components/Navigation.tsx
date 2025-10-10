'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap'
import { useLanguage } from '@/lib/language-context'

export default function Navigation() {
  const { language, setLanguage, t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false) // Start as false, only load when needed
  const router = useRouter()

  // Disable auth check in navigation for now
  useEffect(() => {
    setLoading(false)
    setUser(null)
    setUserProfile(null)
  }, [])

  const handleSignOut = async () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    router.push('/')
  }

  return (
    <Navbar expand="lg" className="position-absolute w-100 top-0 start-0" style={{ 
      zIndex: 1000,
      background: 'rgba(0,0,0,0.1)',
      backdropFilter: 'blur(10px)'
    }}>
      <Container>
        <Navbar.Brand as={Link} href="/" className="text-dark fw-bold fs-4">
          <i className="fab fa-whatsapp text-success me-2"></i>
          BookIt
        </Navbar.Brand>
        
        {/* Language Toggle - Centered */}
        <div className="mx-auto">
          <Button
            variant="light"
            size="sm"
            className="px-3 py-2 fw-bold"
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            style={{ 
              fontSize: '0.9rem', 
              minWidth: '160px',
              color: '#000',
              border: '2px solid rgba(255,255,255,0.3)'
            }}
          >
            {language === 'en' ? 'I prefer Spanish' : 'I prefer English'}
          </Button>
        </div>
        
        <Nav className="d-flex align-items-center">
          <Nav.Link as={Link} href="/pricing" className="text-white-75 me-3" style={{ textDecoration: 'none' }}>
            {t('nav.pricing')}
          </Nav.Link>
          
          {loading ? (
            // Loading state
            <div className="text-white-75 me-3">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
          ) : user ? (
            // Logged in state
            <>
              <Link href="/dashboard" className="me-3">
                <Button variant="success" size="sm" className="px-3 fw-semibold">
                  <i className="fas fa-tachometer-alt me-1"></i>
                  Dashboard
                </Button>
              </Link>
              
              <NavDropdown 
                title={
                  <span className="d-flex align-items-center text-dark bg-light px-2 py-1 rounded">
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt="Profile"
                        className="rounded-circle me-2"
                        style={{ 
                          width: '24px', 
                          height: '24px', 
                          objectFit: 'cover',
                          border: '2px solid #10b981'
                        }}
                      />
                    ) : (
                      <div
                        className="rounded-circle me-2 d-flex align-items-center justify-content-center"
                        style={{
                          width: '24px',
                          height: '24px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          fontSize: '10px'
                        }}
                      >
                        <i className="fas fa-user"></i>
                      </div>
                    )}
                    {userProfile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                  </span>
                } 
                id="user-nav-dropdown"
                align="end"
              >
                <NavDropdown.Item as={Link} href="/dashboard">
                  <i className="fas fa-tachometer-alt me-2"></i>
                  Dashboard
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/dashboard/settings">
                  <i className="fas fa-cog me-2"></i>
                  Settings
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleSignOut}>
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Sign Out
                </NavDropdown.Item>
              </NavDropdown>
            </>
          ) : (
            // Logged out state
            <>
              <Nav.Link as={Link} href="/login" className="text-white-75 me-3" style={{ textDecoration: 'none' }}>
                {t('nav.login')}
              </Nav.Link>
              
              <Link href="/signup">
                <Button variant="light" size="sm" className="px-3 fw-semibold">
                  {t('nav.signup')}
                </Button>
              </Link>
            </>
          )}
        </Nav>
      </Container>
    </Navbar>
  )
}