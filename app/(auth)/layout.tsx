import { Container, Row, Col } from 'react-bootstrap'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Container fluid className="min-vh-100">
      <Row className="min-vh-100">
        <Col
          lg={6}
          className="d-none d-lg-flex align-items-center justify-content-center position-relative overflow-hidden"
          style={{ backgroundImage: 'url(/images/backgrounds/bg-dark-emerald.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="text-white text-center px-4">
            <h1 className="display-5 fw-bold mb-3">BookIt by Zewo</h1>
            <p className="lead mb-4">
              The WhatsApp-first booking system for local service providers
            </p>
            <Image
              src="/images/phone-whatsapp-en.png"
              alt="Appointment confirmations and reminders on WhatsApp"
              width={864}
              height={1624}
              priority
              style={{ width: 'auto', height: 'min(52vh, 480px)' }}
            />
            <div className="mt-3 d-flex flex-wrap justify-content-center gap-3 small">
              <span>✓ Fewer no-shows</span>
              <span>✓ Deposits with Stripe + ATH Móvil</span>
              <span>✓ English / Español</span>
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