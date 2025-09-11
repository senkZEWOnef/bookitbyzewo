'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Container, Navbar, Nav, NavDropdown, Button } from 'react-bootstrap'
import { createSupabaseClientClient } from '@/lib/supabase'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClientClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

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

  return (
    <div className="min-vh-100 bg-light">
      <Navbar bg="white" expand="lg" className="border-bottom shadow-sm">
        <Container>
          <Navbar.Brand as={Link} href="/dashboard" className="fw-bold text-success">
            BookIt by Zewo
          </Navbar.Brand>
          
          <Navbar.Toggle />
          
          <Navbar.Collapse>
            <Nav className="me-auto">
              <Nav.Link 
                as={Link} 
                href="/dashboard" 
                className={pathname === '/dashboard' ? 'active fw-bold' : ''}
              >
                <i className="fas fa-tachometer-alt me-1"></i>
                Dashboard
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                href="/dashboard/calendar" 
                className={pathname === '/dashboard/calendar' ? 'active fw-bold' : ''}
              >
                <i className="fas fa-calendar me-1"></i>
                Calendar
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                href="/dashboard/services" 
                className={pathname === '/dashboard/services' ? 'active fw-bold' : ''}
              >
                <i className="fas fa-cogs me-1"></i>
                Services
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                href="/dashboard/staff" 
                className={pathname === '/dashboard/staff' ? 'active fw-bold' : ''}
              >
                <i className="fas fa-users me-1"></i>
                Staff
              </Nav.Link>
            </Nav>
            
            <Nav>
              <NavDropdown 
                title={
                  <>
                    <i className="fas fa-user-circle me-1"></i>
                    {user?.user_metadata?.full_name || user?.email}
                  </>
                } 
                id="user-dropdown"
              >
                <NavDropdown.Item as={Link} href="/dashboard/settings">
                  <i className="fas fa-cog me-2"></i>
                  Settings
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleSignOut}>
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Sign Out
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="py-4">
        {children}
      </main>
    </div>
  )
}