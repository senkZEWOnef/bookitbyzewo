import Link from 'next/link'
import { Container, Button } from 'react-bootstrap'

export default function NotFound() {
  return (
    <Container className="py-5 text-center">
      <div
        className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
        style={{
          width: '120px',
          height: '120px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)',
          border: '2px solid rgba(99, 102, 241, 0.2)'
        }}
      >
        <span style={{ fontSize: '3rem', color: '#6366f1' }}>404</span>
      </div>

      <h2 className="fw-bold mb-3">Page Not Found</h2>

      <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '400px' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="d-flex justify-content-center gap-3">
        <Link href="/">
          <Button variant="success">
            <i className="fas fa-home me-2"></i>
            Go home
          </Button>
        </Link>

        <Link href="/dashboard">
          <Button variant="outline-primary">
            <i className="fas fa-tachometer-alt me-2"></i>
            Dashboard
          </Button>
        </Link>
      </div>
    </Container>
  )
}
