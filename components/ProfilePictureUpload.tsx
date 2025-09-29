'use client'

import { useState, useRef } from 'react'
import { Button, Modal, Alert, Spinner } from 'react-bootstrap'
import { createSupabaseClient } from '@/lib/supabase'
import { useLanguage } from '@/lib/language-context'

interface ProfilePictureUploadProps {
  currentPictureUrl?: string
  onPictureUpdate: (url: string) => void
  userId: string
}

export default function ProfilePictureUpload({ currentPictureUrl, onPictureUpdate, userId }: ProfilePictureUploadProps) {
  const { language } = useLanguage()
  const locale = language === 'es' ? 'es' : 'en'
  
  const [showModal, setShowModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(locale === 'es' ? 'Por favor selecciona una imagen válida' : 'Please select a valid image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError(locale === 'es' ? 'La imagen debe ser menor a 5MB' : 'Image must be less than 5MB')
      return
    }

    setSelectedFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError('')

    try {
      const supabase = createSupabaseClient()
      
      // Convert image to base64 for simple storage
      const reader = new FileReader()
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          resolve(result)
        }
        reader.onerror = reject
        reader.readAsDataURL(selectedFile)
      })

      const base64Data = await base64Promise

      // Update profile in database with base64 data
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          avatar_url: base64Data,
          updated_at: new Date().toISOString()
        })

      if (dbError) {
        throw dbError
      }

      // Update auth metadata
      await supabase.auth.updateUser({
        data: {
          avatar_url: base64Data
        }
      })

      onPictureUpdate(base64Data)
      setShowModal(false)
      setPreview(null)
      setSelectedFile(null)
      
    } catch (error: any) {
      console.error('Error uploading profile picture:', error)
      setError(error.message || (locale === 'es' ? 'Error al subir la imagen' : 'Error uploading image'))
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!currentPictureUrl) return

    setUploading(true)
    setError('')

    try {
      const supabase = createSupabaseClient()

      // Remove from database
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          avatar_url: null,
          updated_at: new Date().toISOString()
        })

      if (dbError) {
        throw dbError
      }

      // Update auth metadata
      await supabase.auth.updateUser({
        data: {
          avatar_url: null
        }
      })

      onPictureUpdate('')
      setShowModal(false)
      
    } catch (error: any) {
      console.error('Error removing profile picture:', error)
      setError(error.message || (locale === 'es' ? 'Error al eliminar la imagen' : 'Error removing image'))
    } finally {
      setUploading(false)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const resetModal = () => {
    setPreview(null)
    setSelectedFile(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    resetModal()
  }

  return (
    <>
      {/* Profile Picture Display */}
      <div className="position-relative d-inline-block">
        <div
          className="rounded-circle overflow-hidden cursor-pointer position-relative"
          style={{ width: '80px', height: '80px' }}
          onClick={() => setShowModal(true)}
        >
          {currentPictureUrl ? (
            <img
              src={currentPictureUrl}
              alt="Profile"
              className="w-100 h-100 object-fit-cover"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div
              className="w-100 h-100 d-flex align-items-center justify-content-center"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white'
              }}
            >
              <i className="fas fa-user fs-3"></i>
            </div>
          )}
          
          {/* Hover overlay */}
          <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center opacity-0 hover-opacity-100 transition-all"
            style={{
              background: 'rgba(0,0,0,0.5)',
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0'
            }}
          >
            <i className="fas fa-camera text-white"></i>
          </div>
        </div>
        
        {/* Edit button */}
        <Button
          size="sm"
          variant="primary"
          className="position-absolute bottom-0 end-0 rounded-circle p-2"
          style={{ width: '32px', height: '32px' }}
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-pencil-alt" style={{ fontSize: '10px' }}></i>
        </Button>
      </div>

      {/* Upload Modal */}
      <Modal show={showModal} onHide={handleModalClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-camera me-2"></i>
            {locale === 'es' ? 'Foto de Perfil' : 'Profile Picture'}
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          <div className="text-center mb-4">
            {/* Current or Preview Image */}
            <div
              className="rounded-circle overflow-hidden mx-auto mb-3"
              style={{ width: '120px', height: '120px' }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-100 h-100"
                  style={{ objectFit: 'cover' }}
                />
              ) : currentPictureUrl ? (
                <img
                  src={currentPictureUrl}
                  alt="Current"
                  className="w-100 h-100"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="w-100 h-100 d-flex align-items-center justify-content-center"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white'
                  }}
                >
                  <i className="fas fa-user fs-1"></i>
                </div>
              )}
            </div>

            {/* Upload Instructions */}
            <p className="text-muted small mb-3">
              {locale === 'es' 
                ? 'Formatos: JPG, PNG, GIF. Tamaño máximo: 5MB'
                : 'Formats: JPG, PNG, GIF. Max size: 5MB'
              }
            </p>

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="d-none"
            />

            {/* Action Buttons */}
            <div className="d-flex gap-2 justify-content-center">
              <Button
                variant="outline-primary"
                onClick={openFileDialog}
                disabled={uploading}
              >
                <i className="fas fa-upload me-1"></i>
                {locale === 'es' ? 'Seleccionar' : 'Choose File'}
              </Button>

              {currentPictureUrl && (
                <Button
                  variant="outline-danger"
                  onClick={handleRemove}
                  disabled={uploading}
                >
                  <i className="fas fa-trash me-1"></i>
                  {locale === 'es' ? 'Eliminar' : 'Remove'}
                </Button>
              )}
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose} disabled={uploading}>
            {locale === 'es' ? 'Cancelar' : 'Cancel'}
          </Button>
          
          {selectedFile && (
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {locale === 'es' ? 'Subiendo...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <i className="fas fa-save me-1"></i>
                  {locale === 'es' ? 'Guardar' : 'Save'}
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  )
}