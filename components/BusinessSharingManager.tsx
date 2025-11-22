'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, Button, Form, InputGroup, Alert, Modal } from 'react-bootstrap'
import QRCode from 'qrcode'

interface BusinessSharingManagerProps {
  businessSlug: string
  businessName: string
}

export default function BusinessSharingManager({ businessSlug, businessName }: BusinessSharingManagerProps) {
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const urlInputRef = useRef<HTMLInputElement>(null)

  // Generate the business page URL
  const [baseUrl, setBaseUrl] = useState('')
  
  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])
  
  const businessUrl = `${baseUrl}/page/${businessSlug}`
  const bookingUrl = `${baseUrl}/book/${businessSlug}`

  const copyToClipboard = async (url: string, type: 'website' | 'booking') => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      if (urlInputRef.current) {
        urlInputRef.current.select()
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const generateQRCode = async (url: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(qrDataUrl)
      setShowQRModal(true)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const downloadQRCode = () => {
    const link = document.createElement('a')
    link.download = `${businessSlug}-qr-code.png`
    link.href = qrCodeUrl
    link.click()
  }

  const shareViaWhatsApp = (url: string, type: 'website' | 'booking') => {
    const message = type === 'website' 
      ? `¡Visita mi página web! ${businessName} - ${url}`
      : `¡Reserva tu cita conmigo! ${businessName} - ${url}`
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const shareViaEmail = (url: string, type: 'website' | 'booking') => {
    const subject = type === 'website'
      ? `Visita mi página web - ${businessName}`
      : `Reserva tu cita - ${businessName}`
    
    const body = type === 'website'
      ? `¡Hola! Te invito a visitar mi página web donde puedes conocer más sobre mis servicios:\n\n${url}\n\n¡Espero verte pronto!`
      : `¡Hola! Puedes reservar tu cita directamente desde este enlace:\n\n${url}\n\n¡Será un placer atenderte!`

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoUrl
  }

  return (
    <>
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-share-alt me-2"></i>
            Compartir mi Negocio
          </h5>
        </Card.Header>
        <Card.Body>
          {copied && (
            <Alert variant="success" className="mb-3">
              <i className="fas fa-check me-2"></i>
              ¡Enlace copiado al portapapeles!
            </Alert>
          )}

          {/* Website Page Sharing */}
          <div className="mb-4">
            <h6 className="mb-3">
              <i className="fas fa-globe me-2"></i>
              Página Web del Negocio
            </h6>
            <p className="text-muted small mb-3">
              Comparte tu página web completa con información de tu negocio, servicios y contacto
            </p>
            
            <InputGroup className="mb-3">
              <Form.Control
                ref={urlInputRef}
                type="text"
                value={businessUrl}
                readOnly
                style={{ fontSize: '0.9rem' }}
              />
              <Button 
                variant="outline-primary"
                onClick={() => copyToClipboard(businessUrl, 'website')}
              >
                <i className="fas fa-copy"></i>
              </Button>
              <Button 
                variant="outline-success"
                onClick={() => generateQRCode(businessUrl)}
              >
                <i className="fas fa-qrcode"></i>
              </Button>
            </InputGroup>

            <div className="d-flex gap-2 flex-wrap">
              <Button 
                variant="success" 
                size="sm"
                onClick={() => shareViaWhatsApp(businessUrl, 'website')}
              >
                <i className="fab fa-whatsapp me-1"></i>
                WhatsApp
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => shareViaEmail(businessUrl, 'website')}
              >
                <i className="fas fa-envelope me-1"></i>
                Email
              </Button>
            </div>
          </div>

          <hr />

          {/* Booking Page Sharing */}
          <div>
            <h6 className="mb-3">
              <i className="fas fa-calendar-check me-2"></i>
              Página de Reservas
            </h6>
            <p className="text-muted small mb-3">
              Comparte el enlace directo para que tus clientes reserven citas
            </p>
            
            <InputGroup className="mb-3">
              <Form.Control
                type="text"
                value={bookingUrl}
                readOnly
                style={{ fontSize: '0.9rem' }}
              />
              <Button 
                variant="outline-primary"
                onClick={() => copyToClipboard(bookingUrl, 'booking')}
              >
                <i className="fas fa-copy"></i>
              </Button>
              <Button 
                variant="outline-success"
                onClick={() => generateQRCode(bookingUrl)}
              >
                <i className="fas fa-qrcode"></i>
              </Button>
            </InputGroup>

            <div className="d-flex gap-2 flex-wrap">
              <Button 
                variant="success" 
                size="sm"
                onClick={() => shareViaWhatsApp(bookingUrl, 'booking')}
              >
                <i className="fab fa-whatsapp me-1"></i>
                WhatsApp
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => shareViaEmail(bookingUrl, 'booking')}
              >
                <i className="fas fa-envelope me-1"></i>
                Email
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* QR Code Modal */}
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-qrcode me-2"></i>
            Código QR
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {qrCodeUrl && (
            <div>
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="img-fluid mb-3"
                style={{ maxWidth: '300px' }}
              />
              <p className="text-muted">
                Los clientes pueden escanear este código QR para acceder directamente a tu página
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <Button variant="primary" onClick={downloadQRCode}>
                  <i className="fas fa-download me-1"></i>
                  Descargar PNG
                </Button>
                <Button variant="outline-primary" onClick={() => window.print()}>
                  <i className="fas fa-print me-1"></i>
                  Imprimir
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  )
}