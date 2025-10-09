'use client'

import { useRouter } from 'next/navigation'

export default function Footer() {
  const router = useRouter()
  
  const handleAdminAccess = () => {
    console.log('Z button clicked - navigating to admin login')
    router.push('/admin/login')
  }

  return (
    <footer 
      className="text-light py-4 mt-5" 
      style={{ 
        backgroundColor: '#212529',
        margin: 0,
        padding: '1.5rem 0',
        border: 'none'
      }}
    >
      <div className="container-fluid" style={{ backgroundColor: '#212529', margin: 0, padding: '0 1rem' }}>
        <div className="row align-items-center" style={{ backgroundColor: '#212529', margin: 0 }}>
          <div className="col-md-6" style={{ backgroundColor: '#212529' }}>
            <p className="mb-0 text-light">&copy; 2024 BookIt by Zewo. All rights reserved.</p>
          </div>
          <div className="col-md-6 text-end" style={{ backgroundColor: '#212529' }}>
            <button 
              onClick={handleAdminAccess}
              style={{ 
                fontSize: '18px', 
                textDecoration: 'none',
                background: 'transparent',
                color: '#6c757d',
                opacity: 0.3,
                transition: 'opacity 0.3s',
                cursor: 'pointer',
                border: 'none',
                padding: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}
              title="Admin Access"
            >
              <span style={{ 
                fontWeight: 'bold', 
                fontFamily: 'monospace',
                textShadow: '0 0 2px rgba(255,255,255,0.5)',
                backgroundColor: 'transparent'
              }}>
                Z
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}