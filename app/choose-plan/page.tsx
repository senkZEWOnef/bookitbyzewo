'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

const plans = [
  {
    id: 'trial',
    name: 'Free Trial',
    price: '$0',
    period: '30 days',
    description: 'Try all features for 30 days',
    gradient: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
    cta: 'Start Free Trial',
    popular: false,
    trialOnly: true
  },
  {
    id: 'solo',
    name: 'Solo Plan',
    price: '$19',
    period: '/mo',
    description: 'Perfect for individual service providers',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    cta: 'Choose Solo',
    popular: false
  },
  {
    id: 'team',
    name: 'Team Plan',
    price: '$39',
    period: '/mo',
    description: 'For growing teams and multiple staff',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    cta: 'Choose Team',
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: '$79',
    period: '/mo',
    description: 'For established businesses',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    cta: 'Choose Pro',
    popular: false
  }
]

export default function ChoosePlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingUser, setPendingUser] = useState<any>(null)

  useEffect(() => {
    const userString = localStorage.getItem('pendingUser')
    if (userString) {
      setPendingUser(JSON.parse(userString))
    } else {
      router.push('/signup')
    }
  }, [])

  const handlePlanSelection = async (planId: string) => {
    if (!pendingUser) {
      setError('No user data found. Please sign up again.')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (planId === 'trial') {
        const response = await fetch('/api/auth/activate-trial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: pendingUser.id
          })
        })

        const result = await response.json()

        if (response.ok) {
          localStorage.setItem('user', JSON.stringify({
            ...pendingUser,
            plan_status: 'trial'
          }))
          localStorage.removeItem('pendingUser')
          router.push('/dashboard/onboarding')
        } else {
          setError(result.error || 'Failed to activate trial')
        }
      } else {
        localStorage.setItem('selectedPlan', planId)
        router.push(`/payment?plan=${planId}&userId=${pendingUser.id}`)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!pendingUser) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e3e3e3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '20px', color: '#6c757d' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #dee2e6',
        padding: '20px 0',
        marginBottom: '40px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#28a745'
          }}>
            📱 BookIt by Zewo
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6c757d'
          }}>
            Step 2 of 3
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        {/* Welcome Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '50px'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#212529'
          }}>
            Welcome, {pendingUser.full_name}! 👋
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#6c757d',
            marginBottom: '30px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Your account has been created successfully. Choose your plan to start managing your bookings.
          </p>
          
          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              color: '#721c24',
              padding: '15px 20px',
              borderRadius: '8px',
              marginTop: '20px',
              maxWidth: '500px',
              margin: '20px auto 0'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '30px',
          marginBottom: '60px'
        }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: plan.popular 
                  ? '0 20px 40px rgba(16, 185, 129, 0.15)' 
                  : '0 8px 25px rgba(0, 0, 0, 0.08)',
                border: plan.popular ? '3px solid #10b981' : '1px solid #e5e7eb',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                height: '400px'
              }}
              onClick={() => handlePlanSelection(plan.id)}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)'
                e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = plan.popular 
                  ? '0 20px 40px rgba(16, 185, 129, 0.15)' 
                  : '0 8px 25px rgba(0, 0, 0, 0.08)'
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  letterSpacing: '1px'
                }}>
                  ⭐ MOST POPULAR
                </div>
              )}

              {/* Plan Header */}
              <div style={{
                background: plan.gradient,
                color: 'white',
                padding: plan.popular ? '60px 30px 30px' : '40px 30px 30px',
                textAlign: 'center'
              }}>
                <h3 style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  marginBottom: '15px'
                }}>
                  {plan.name}
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'center',
                  marginBottom: '15px'
                }}>
                  <span style={{
                    fontSize: '56px',
                    fontWeight: 'bold',
                    lineHeight: '1'
                  }}>
                    {plan.price}
                  </span>
                  <span style={{
                    fontSize: '18px',
                    opacity: 0.9,
                    marginLeft: '8px'
                  }}>
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Plan Content */}
              <div style={{
                padding: '30px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: plan.popular ? '200px' : '240px'
              }}>
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  marginBottom: '30px',
                  lineHeight: '1.6'
                }}>
                  {plan.description}
                </p>

                <button
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    border: 'none',
                    borderRadius: '12px',
                    background: plan.gradient,
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  disabled={loading}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlanSelection(plan.id)
                  }}
                >
                  {loading ? 'Processing...' : plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          paddingBottom: '60px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
          }}>
            <p style={{
              fontSize: '18px',
              color: '#374151',
              marginBottom: '15px'
            }}>
              🛡️ All plans include our 30-day money-back guarantee
            </p>
            <p style={{
              fontSize: '16px',
              color: '#6b7280'
            }}>
              Have questions? Email us at{' '}
              <a href="mailto:support@bookitbyzewo.com" style={{
                color: '#10b981',
                textDecoration: 'none'
              }}>
                support@bookitbyzewo.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 1200px) {
          div[style*="gridTemplateColumns: repeat(4, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: repeat(4, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}