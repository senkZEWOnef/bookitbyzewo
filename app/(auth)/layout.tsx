import { Container, Row, Col } from 'react-bootstrap'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Container fluid className="min-vh-100">
      <Row className="min-vh-100">
        <Col lg={6} className="d-none d-lg-flex bg-success align-items-center justify-content-center">
          <div className="text-white text-center">
            <h1 className="display-4 fw-bold mb-4">BookIt by Zewo</h1>
            <p className="lead">
              The WhatsApp-first booking system for local service providers
            </p>
            <div className="mt-5">
              <p className="mb-2">✓ Reduce no-shows by 80%</p>
              <p className="mb-2">✓ Collect deposits automatically</p>
              <p className="mb-2">✓ Bilingual EN/ES support</p>
              <p className="mb-2">✓ Works with Stripe + ATH Móvil</p>
            </div>
          </div>
        </Col>
        <Col lg={6} className="d-flex align-items-center justify-content-center py-5">
          <div className="w-100" style={{ maxWidth: '400px' }}>
            <div className="text-center mb-4">
              <Link href="/" className="text-decoration-none">
                <h3 className="text-success fw-bold">BookIt by Zewo</h3>
              </Link>
            </div>
            {children}
          </div>
        </Col>
      </Row>
    </Container>
  )
}