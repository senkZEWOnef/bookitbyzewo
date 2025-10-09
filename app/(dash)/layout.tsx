'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from 'react-bootstrap'
import { supabase, getUser } from '@/lib/supabase'
import { useLanguage } from '@/lib/language-context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { language } = useLanguage()
  const locale = language === 'es' ? 'es' : 'en'
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Auto-close sidebar on mobile
      if (mobile) {
        setSidebarOpen(false)
      }
    }
    
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  useEffect(() => {
    getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
      } else {
        router.push('/login')
      }
      setLoading(false)
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  const navigationItems = [
    {
      icon: 'fas fa-tachometer-alt',
      label: locale === 'es' ? 'Panel' : 'Dashboard',
      href: '/dashboard',
      active: pathname === '/dashboard',
      available: true
    },
    {
      icon: 'fas fa-globe',
      label: locale === 'es' ? 'Página Web' : 'Webpage',
      href: '/dashboard/webpage',
      active: pathname === '/dashboard/webpage',
      available: true
    },
    {
      icon: 'fas fa-calendar',
      label: locale === 'es' ? 'Calendario' : 'Calendar',
      href: '/dashboard/calendar',
      active: pathname === '/dashboard/calendar',
      available: true
    },
    {
      icon: 'fas fa-cogs',
      label: locale === 'es' ? 'Servicios' : 'Services',
      href: '/dashboard/services',
      active: pathname === '/dashboard/services',
      available: true
    },
    {
      icon: 'fas fa-users',
      label: locale === 'es' ? 'Personal' : 'Staff',
      href: '/dashboard/staff',
      active: pathname === '/dashboard/staff',
      available: true
    },
    {
      icon: 'fas fa-chart-bar',
      label: locale === 'es' ? 'Analíticas' : 'Analytics',
      href: '/dashboard/analytics',
      active: pathname === '/dashboard/analytics',
      available: true
    },
    {
      icon: 'fas fa-cog',
      label: locale === 'es' ? 'Configuración' : 'Settings',
      href: '/dashboard/settings',
      active: pathname === '/dashboard/settings',
      available: true
    }
  ]

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040 }}
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div 
        className={`position-fixed top-0 vh-100 transition-all ${
          isMobile 
            ? (sidebarOpen ? 'start-0' : 'start-100') 
            : 'start-0'
        }`}
        style={{
          width: isMobile ? '280px' : (sidebarOpen ? '280px' : '80px'),
          background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
          boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
          zIndex: 1050,
          transition: 'all 0.3s ease',
          transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)'
        }}
      >
        {/* Logo/Brand */}
        <div className="p-4 border-bottom border-white border-opacity-10">
          <div className="d-flex align-items-center text-white">
            <div 
              className="rounded-circle bg-white bg-opacity-20 d-flex align-items-center justify-content-center me-3"
              style={{ width: '40px', height: '40px' }}
            >
              <i className="fab fa-whatsapp fs-4 text-white"></i>
            </div>
            {sidebarOpen && (
              <div>
                <h5 className="mb-0 fw-bold">BookIt</h5>
                <small className="opacity-75">by Zewo</small>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="py-4">
          <ul className="list-unstyled px-3">
            {navigationItems.map((item, index) => (
              <li key={index} className="mb-2">
                <Link href={item.href} className="text-decoration-none">
                  <div 
                    className={`d-flex align-items-center p-3 rounded-3 transition-all position-relative ${
                      item.active ? 'bg-white bg-opacity-20 text-success' : 'text-white hover-bg-white-10'
                    }`}
                    style={{
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (!item.active) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.active) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <i className={`${item.icon} fs-5 me-3`} style={{ width: '20px' }}></i>
                    {sidebarOpen && (
                      <span className="fw-medium">{item.label}</span>
                    )}
                    {item.active && (
                      <div 
                        className="position-absolute top-50 end-0 translate-middle-y bg-white rounded-start-pill"
                        style={{ width: '4px', height: '60%' }}
                      ></div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="position-absolute bottom-0 w-100 p-3 border-top border-white border-opacity-10">
          <div className="d-flex align-items-center text-white">
            <div 
              className="rounded-circle bg-white bg-opacity-20 d-flex align-items-center justify-content-center me-3"
              style={{ width: '40px', height: '40px' }}
            >
              <i className="fas fa-user text-white"></i>
            </div>
            {sidebarOpen && (
              <div className="flex-grow-1">
                <div className="fw-medium small">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-white text-opacity-75 small">
                  {user?.email}
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-white text-opacity-75 p-0 text-decoration-none"
                  onClick={handleSignOut}
                >
                  <i className="fas fa-sign-out-alt me-1"></i>
                  {locale === 'es' ? 'Cerrar Sesión' : 'Sign Out'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Toggle - Desktop */}
        {!isMobile && (
          <button
            className="position-absolute btn btn-link text-white p-2"
            style={{ 
              top: '50%', 
              right: '-20px', 
              transform: 'translateY(-50%)',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
            }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className={`fas ${sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div 
        className="transition-all duration-300"
        style={{
          marginLeft: isMobile ? '0' : (sidebarOpen ? '280px' : '80px'),
          transition: 'all 0.3s ease',
          minHeight: '100vh'
        }}
      >
        {/* Top Header Bar */}
        <div 
          className="bg-white shadow-sm border-bottom p-3 sticky-top"
          style={{ zIndex: 1040 }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              {/* Mobile Menu Button */}
              {isMobile && (
                <button
                  className="btn btn-outline-secondary me-3 d-md-none"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  style={{ border: 'none', padding: '8px 12px' }}
                >
                  <i className="fas fa-bars"></i>
                </button>
              )}
              
              <div>
                <h4 className={`mb-0 fw-bold text-gray-800 ${isMobile ? 'fs-5' : ''}`}>
                  {navigationItems.find(item => item.active)?.label || (locale === 'es' ? 'Panel' : 'Dashboard')}
                </h4>
                <small className="text-muted d-none d-sm-block">
                  {locale === 'es' ? 'Bienvenido de vuelta, ' : 'Welcome back, '}{user?.user_metadata?.full_name || user?.email?.split('@')[0] || (locale === 'es' ? 'Usuario' : 'User')}
                </small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Button variant="outline-primary" size="sm" className="d-none d-sm-inline-block">
                <i className="fas fa-bell me-1"></i>
                <span className="d-none d-lg-inline">
                  {locale === 'es' ? 'Notificaciones' : 'Notifications'}
                </span>
              </Button>
              
              {/* Mobile notification icon only */}
              <Button variant="outline-primary" size="sm" className="d-sm-none">
                <i className="fas fa-bell"></i>
              </Button>
              
              <Button variant="success" size="sm" className="d-none d-sm-inline-block">
                <i className="fas fa-plus me-1"></i>
                <span className="d-none d-lg-inline">
                  {locale === 'es' ? 'Acción Rápida' : 'Quick Action'}
                </span>
              </Button>
              
              {/* Mobile quick action icon only */}
              <Button variant="success" size="sm" className="d-sm-none">
                <i className="fas fa-plus"></i>
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4" style={{ minHeight: 'calc(100vh - 80px)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}