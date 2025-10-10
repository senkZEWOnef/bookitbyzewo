'use client'

import { Container, Row, Col, Card, Alert } from 'react-bootstrap'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'

export default function ResetPasswordPage() {
  const { language } = useLanguage()
  const locale = language === 'es' ? 'es' : 'en'

  return (
    <>
      <div className="bg-mesh text-white position-relative overflow-hidden" style={{ minHeight: '100vh' }}>
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          background: 'radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)'
        }}></div>
      
        <Container fluid className="min-vh-100 d-flex align-items-center position-relative">
          <Row className="w-100 justify-content-center">
            <Col md={6} lg={4}>
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
                      <h3 className="text-white mb-0 fw-bold">BookIt</h3>
                    </div>
                    <p className="text-white-50">
                      {locale === 'es' ? 'Restablecer Contraseña' : 'Reset Password'}
                    </p>
                  </div>

                  <Alert variant="info" className="text-center">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>
                      {locale === 'es' 
                        ? 'Función No Disponible' 
                        : 'Feature Not Available'
                      }
                    </strong>
                    <br />
                    {locale === 'es' 
                      ? 'El restablecimiento de contraseña estará disponible próximamente. Por favor, contacta al administrador para asistencia.'
                      : 'Password reset functionality will be available soon. Please contact the administrator for assistance.'
                    }
                  </Alert>

                  <div className="text-center mt-4">
                    <Link href="/login" className="text-white text-decoration-none">
                      <i className="fas fa-arrow-left me-2"></i>
                      {locale === 'es' ? 'Volver al Inicio de Sesión' : 'Back to Login'}
                    </Link>
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