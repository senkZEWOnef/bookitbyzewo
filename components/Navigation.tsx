'use client'

import Link from 'next/link'
import { Navbar, Nav, Container, Button } from 'react-bootstrap'
import { useLanguage } from '@/lib/language-context'

export default function Navigation() {
  const { language, setLanguage, t } = useLanguage()

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
          <Nav.Link as={Link} href="/login" className="text-white-75 me-3" style={{ textDecoration: 'none' }}>
            {t('nav.login')}
          </Nav.Link>
          
          <Link href="/signup">
            <Button variant="light" size="sm" className="px-3 fw-semibold">
              {t('nav.signup')}
            </Button>
          </Link>
        </Nav>
      </Container>
    </Navbar>
  )
}