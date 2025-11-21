'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap'
import { useLanguage } from '@/lib/language-context'

export default function Navigation() {
  const { language, setLanguage, t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false) // Start as false, only load when needed
  const router = useRouter()
  const pathname = usePathname()

  // Disable auth check in navigation for now
  useEffect(() => {
    setLoading(false)
    setUser(null)
    setUserProfile(null)
  }, [])

  // Don't render navigation on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  const handleSignOut = async () => {
    // Get current user before clearing to clean up their specific data
    const userString = localStorage.getItem('user')
    if (userString) {
      try {
        const userData = JSON.parse(userString)
        // Clear user-specific business selection
        localStorage.removeItem(`currentBusiness_${userData.id}`)
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
    
    // Clear general auth data
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    
    // Also clear any legacy currentBusiness data
    localStorage.removeItem('currentBusiness')
    
    router.push('/')
  }

  return (
    <Navbar expand="lg" className="position-fixed w-100 top-0 start-0 bg-dark" style={{ 
      zIndex: 1000,
      background: '#212529 !important',
      backdropFilter: 'blur(10px)'
    }}>
      <Container>
        <Navbar.Brand as={Link} href="/" className="text-light fw-bold fs-5 fs-md-4">
          <i className="fab fa-whatsapp text-success me-2"></i>
          <span className="d-none d-sm-inline">BookIt</span>
          <span className="d-sm-none">BookIt</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0 text-light">
          <i className="fas fa-bars"></i>
        </Navbar.Toggle>
        
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Language Toggle - Responsive */}
          <div className="mx-auto my-2 my-lg-0">
            <Button
              variant="outline-light"
              size="sm"
              className="px-3 py-2 fw-bold w-100"
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              style={{ 
                fontSize: '0.85rem', 
                maxWidth: '200px',
                color: '#fff',
                border: '2px solid rgba(255,255,255,0.3)'
              }}
            >
              <i className="fas fa-language me-2"></i>
              <span className="d-lg-none">
                {language === 'en' ? 'Español' : 'English'}
              </span>
              <span className="d-none d-lg-inline">
                {language === 'en' ? 'I prefer Spanish' : 'I prefer English'}
              </span>
            </Button>
          </div>
        
          <Nav className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center">
            <Nav.Link as={Link} href="/pricing" className="text-light me-lg-3 mb-2 mb-lg-0" style={{ textDecoration: 'none' }}>
              <i className="fas fa-dollar-sign me-2 d-lg-none"></i>
              {t('nav.pricing')}
            </Nav.Link>
            
            {loading ? (
              // Loading state
              <div className="text-light me-lg-3 mb-2 mb-lg-0">
                <i className="fas fa-spinner fa-spin"></i>
              </div>
            ) : user ? (
              // Logged in state
              <>
                <div className="mb-2 mb-lg-0 me-lg-3">
                  <Link href="/dashboard">
                    <Button variant="success" size="sm" className="px-3 fw-semibold w-100">
                      <i className="fas fa-tachometer-alt me-1"></i>
                      Dashboard
                    </Button>
                  </Link>
                </div>
                
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
                      <span className="d-none d-md-inline">
                        {userProfile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                      </span>
                      <span className="d-md-none">Account</span>
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
                <Nav.Link as={Link} href="/login" className="text-light me-lg-3 mb-2 mb-lg-0" style={{ textDecoration: 'none' }}>
                  <i className="fas fa-sign-in-alt me-2 d-lg-none"></i>
                  {t('nav.login')}
                </Nav.Link>
                
                <div>
                  <Link href="/signup">
                    <Button variant="outline-light" size="sm" className="px-3 fw-semibold w-100">
                      <i className="fas fa-user-plus me-2 d-lg-none"></i>
                      {t('nav.signup')}
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}