'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from 'react-bootstrap'
import { createSupabaseClient } from '@/lib/supabase'
import { useLanguage } from '@/lib/language-context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('🔴 LAYOUT: DashboardLayout rendering')
  
  const router = useRouter()
  const pathname = usePathname()
  const { language } = useLanguage()
  const locale = language === 'es' ? 'es' : 'en'
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  console.log('🔴 LAYOUT: Current pathname from usePathname():', pathname)

  useEffect(() => {
    console.log('🔴 LAYOUT: useEffect triggered')
    const supabase = createSupabaseClient()
    
    const getUser = async () => {
      console.log('🔴 LAYOUT: Getting user...')
      try {
        // Add a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 10000)
        )
        
        const authPromise = supabase.auth.getUser()
        const { data: { user }, error: userError } = await Promise.race([authPromise, timeoutPromise]) as any
        
        if (userError) {
          console.error('🔴 LAYOUT: Error getting user:', userError)
          console.log('🔴 LAYOUT: Attempting to refresh session...')
          
          const { data: { user: refreshedUser }, error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshError || !refreshedUser) {
            console.error('🔴 LAYOUT: Session refresh failed, redirecting to login')
            router.push('/login')
            return
          }
          
          console.log('🔴 LAYOUT: Session refreshed successfully')
          setUser(refreshedUser)
          setLoading(false)
          return
        }
        
        if (!user) {
          console.log('🔴 LAYOUT: No user found, redirecting to login')
          router.push('/login')
          return
        }
        
        console.log('🔴 LAYOUT: User found:', user.id)
        console.log('🔴 LAYOUT: Setting user and loading=false')
        setUser(user)
        setLoading(false)
      } catch (error) {
        console.error('🔴 LAYOUT: Unexpected error in getUser:', error)
        console.log('🔴 LAYOUT: Redirecting to login due to error')
        setLoading(false)
        router.push('/login')
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (!session) {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    const supabase = createSupabaseClient()
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
      {/* Sidebar */}
      <div 
        className={`position-fixed top-0 start-0 vh-100 transition-all duration-300 ${sidebarOpen ? 'w-280' : 'w-80'}`}
        style={{
          width: sidebarOpen ? '280px' : '80px',
          background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
          boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
          zIndex: 1050,
          transition: 'all 0.3s ease'
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

        {/* Sidebar Toggle */}
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
      </div>

      {/* Main Content */}
      <div 
        className="transition-all duration-300"
        style={{
          marginLeft: sidebarOpen ? '280px' : '80px',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Top Header Bar */}
        <div 
          className="bg-white shadow-sm border-bottom p-3 sticky-top"
          style={{ zIndex: 1040 }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0 fw-bold text-gray-800">
                {navigationItems.find(item => item.active)?.label || (locale === 'es' ? 'Panel' : 'Dashboard')}
              </h4>
              <small className="text-muted">
                {locale === 'es' ? 'Bienvenido de vuelta, ' : 'Welcome back, '}{user?.user_metadata?.full_name || user?.email?.split('@')[0] || (locale === 'es' ? 'Usuario' : 'User')}
              </small>
            </div>
            <div className="d-flex align-items-center gap-3">
              <Button variant="outline-primary" size="sm">
                <i className="fas fa-bell me-1"></i>
                {locale === 'es' ? 'Notificaciones' : 'Notifications'}
              </Button>
              <Button variant="success" size="sm">
                <i className="fas fa-plus me-1"></i>
                {locale === 'es' ? 'Acción Rápida' : 'Quick Action'}
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