'use client'

import { useState, useEffect } from 'react'
import { Dropdown, Badge } from 'react-bootstrap'

interface Business {
  id: string
  name: string
  slug: string
  role: string
  is_owner: boolean
  is_active: boolean
}

interface BusinessSwitcherProps {
  currentBusiness?: Business
  onBusinessChange?: (business: Business) => void
}

export default function BusinessSwitcher({ 
  currentBusiness, 
  onBusinessChange 
}: BusinessSwitcherProps) {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userString = localStorage.getItem('user')
    if (userString) {
      const userData = JSON.parse(userString)
      setUser(userData)
      fetchUserBusinesses(userData.id)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserBusinesses = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/businesses?userId=${userId}`)
      if (response.ok) {
        const result = await response.json()
        setBusinesses(result.businesses)
      }
    } catch (error) {
      console.error('Error fetching user businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBusinessSwitch = async (business: Business) => {
    try {
      const response = await fetch('/api/user/businesses/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          businessId: business.id
        })
      })

      if (response.ok) {
        // Store the selected business in localStorage for this specific user
        localStorage.setItem(`currentBusiness_${user.id}`, JSON.stringify(business))
        
        // Call the callback if provided
        if (onBusinessChange) {
          onBusinessChange(business)
        }

        // Dispatch a custom event to notify components to refresh
        window.dispatchEvent(new CustomEvent('businessSwitched', { 
          detail: { business } 
        }))
      }
    } catch (error) {
      console.error('Error switching business:', error)
    }
  }

  const getRoleBadge = (role: string, isOwner: boolean) => {
    if (isOwner) {
      return <Badge bg="success" className="ms-2">Owner</Badge>
    }
    
    switch (role) {
      case 'admin':
        return <Badge bg="primary" className="ms-2">Admin</Badge>
      case 'staff':
        return <Badge bg="secondary" className="ms-2">Staff</Badge>
      default:
        return <Badge bg="secondary" className="ms-2">{role}</Badge>
    }
  }

  if (loading || businesses.length <= 1) {
    return null
  }

  return (
    <Dropdown>
      <Dropdown.Toggle 
        variant="outline-success" 
        size="sm"
        className="d-flex align-items-center"
        style={{ border: 'none', padding: '8px 12px' }}
      >
        <i className="fas fa-building me-2"></i>
        <span className="d-none d-md-inline">
          {currentBusiness ? currentBusiness.name : 'Switch Business'}
        </span>
        <i className="fas fa-chevron-down ms-2 small"></i>
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ minWidth: '300px' }}>
        <Dropdown.Header>
          <i className="fas fa-building me-2"></i>
          Your Businesses
        </Dropdown.Header>
        
        {businesses.map((business) => (
          <Dropdown.Item
            key={business.id}
            onClick={() => handleBusinessSwitch(business)}
            className={`d-flex justify-content-between align-items-center ${
              currentBusiness?.id === business.id ? 'active' : ''
            }`}
            style={{ padding: '12px 16px' }}
          >
            <div>
              <div className="fw-medium">{business.name}</div>
              <small className="text-muted">@{business.slug}</small>
            </div>
            <div className="d-flex align-items-center">
              {getRoleBadge(business.role, business.is_owner)}
              {currentBusiness?.id === business.id && (
                <i className="fas fa-check text-success ms-2"></i>
              )}
            </div>
          </Dropdown.Item>
        ))}
        
        <Dropdown.Divider />
        
        <Dropdown.Item 
          href="/dashboard/onboarding"
          className="text-center"
        >
          <i className="fas fa-plus me-2"></i>
          Create New Business
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  )
}