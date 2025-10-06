'use client'

import { useState } from 'react'
import { Button, Modal, Form, Alert, Badge } from 'react-bootstrap'
import { createWhatsAppLink, getTemplate } from '@/lib/whatsapp'

interface WhatsAppBadgeProps {
  phone: string
  customerName: string
  businessName: string
  locale?: string
  templateData?: any
  size?: 'sm' | 'lg'
  variant?: string
  customMessage?: string
}

export default function WhatsAppBadge({ 
  phone, 
  customerName, 
  businessName,
  locale = 'es',
  templateData,
  size = 'sm',
  variant = 'success',
  customMessage
}: WhatsAppBadgeProps) {
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const templates = [
    {
      key: 'confirmation',
      label: locale === 'es' ? 'Confirmación de cita' : 'Appointment confirmation',
      required: ['service', 'date', 'time']
    },
    {
      key: 'reminder24h',
      label: locale === 'es' ? 'Recordatorio 24h' : '24h reminder',
      required: ['service', 'date', 'time']
    },
    {
      key: 'reminder2h',
      label: locale === 'es' ? 'Recordatorio 2h' : '2h reminder',
      required: ['service', 'time']
    },
    {
      key: 'runningLate',
      label: locale === 'es' ? 'Llegando tarde' : 'Running late',
      required: ['minutes', 'newTime']
    },
    {
      key: 'custom',
      label: locale === 'es' ? 'Mensaje personalizado' : 'Custom message',
      required: []
    }
  ]

  const handleOpenModal = () => {
    if (customMessage) {
      setMessage(customMessage)
    } else {
      // Default greeting message
      setMessage(`Hola ${customerName}! 👋 Este es un mensaje desde ${businessName}. ¿En qué te puedo ayudar?`)
    }
    setShowModal(true)
  }

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey)
    
    if (templateKey === 'custom') {
      setMessage(`Hola ${customerName}! 👋 Este es un mensaje desde ${businessName}. ¿En qué te puedo ayudar?`)
      return
    }

    if (templateData && templateData[templateKey]) {
      const templateMessage = getTemplate(locale, templateKey, {
        name: customerName,
        ...templateData[templateKey]
      })
      setMessage(templateMessage)
    } else {
      // Show placeholder message
      setMessage(`[${templates.find(t => t.key === templateKey)?.label} - Please provide template data]`)
    }
  }

  const handleSendMessage = () => {
    const whatsappLink = createWhatsAppLink({
      phone,
      message
    })
    window.open(whatsappLink, '_blank')
    setShowModal(false)
  }

  const copyMessage = () => {
    navigator.clipboard.writeText(message)
    alert(locale === 'es' ? 'Mensaje copiado!' : 'Message copied!')
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenModal}
        className="d-flex align-items-center gap-1"
      >
        <i className="fab fa-whatsapp"></i>
        {size === 'lg' && (locale === 'es' ? ' WhatsApp' : ' WhatsApp')}
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fab fa-whatsapp text-success me-2"></i>
            {locale === 'es' ? 'Enviar mensaje WhatsApp' : 'Send WhatsApp message'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <strong>Para:</strong> {customerName} ({phone})
          </div>

          {/* Template Selection */}
          <Form.Group className="mb-3">
            <Form.Label>
              {locale === 'es' ? 'Plantilla de mensaje' : 'Message template'}
            </Form.Label>
            <Form.Select
              value={selectedTemplate}
              onChange={(e) => handleTemplateSelect(e.target.value)}
            >
              <option value="">
                {locale === 'es' ? 'Seleccionar plantilla...' : 'Select template...'}
              </option>
              {templates.map(template => (
                <option key={template.key} value={template.key}>
                  {template.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* Message Input */}
          <Form.Group className="mb-3">
            <Form.Label>
              {locale === 'es' ? 'Mensaje' : 'Message'}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={locale === 'es' 
                ? 'Escribe tu mensaje aquí...' 
                : 'Type your message here...'
              }
            />
            <div className="d-flex justify-content-between mt-2">
              <small className="text-muted">
                {message.length} {locale === 'es' ? 'caracteres' : 'characters'}
              </small>
              <Button variant="link" size="sm" onClick={copyMessage}>
                <i className="fas fa-copy me-1"></i>
                {locale === 'es' ? 'Copiar' : 'Copy'}
              </Button>
            </div>
          </Form.Group>

          {message && (
            <Alert variant="info">
              <strong>{locale === 'es' ? 'Vista previa:' : 'Preview:'}</strong>
              <div className="mt-2 p-2 bg-white rounded border" style={{ whiteSpace: 'pre-wrap' }}>
                {message}
              </div>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            {locale === 'es' ? 'Cerrar' : 'Close'}
          </Button>
          <Button 
            variant="success" 
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <i className="fab fa-whatsapp me-1"></i>
            {locale === 'es' ? 'Abrir WhatsApp' : 'Open WhatsApp'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}