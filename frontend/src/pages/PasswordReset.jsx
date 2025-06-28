import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'
import SEOHead from '../components/SEOHead'

function PasswordReset() {
  const navigate = useNavigate()
  const { requestPasswordReset, confirmPasswordReset, loading, isAuthenticated } = useAuth()
  
  const [step, setStep] = useState('request') // 'request' or 'confirm'
  const [formData, setFormData] = useState({
    email: '',
    confirmationCode: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/servers')
    }
  }, [isAuthenticated, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear messages when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleRequestReset = async (e) => {
    e.preventDefault()
    
    if (!formData.email) {
      setError('Please enter your email address')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    const result = await requestPasswordReset(formData.email)
    
    if (result.success) {
      setSuccess(result.message)
      setStep('confirm')
    } else {
      setError(result.error || 'Failed to send reset code. Please try again.')
    }
    
    setIsSubmitting(false)
  }

  const handleConfirmReset = async (e) => {
    e.preventDefault()
    
    if (!formData.confirmationCode || !formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    const result = await confirmPasswordReset(formData.email, formData.confirmationCode, formData.newPassword)
    
    if (result.success) {
      setSuccess(result.message)
      // Redirect to login after successful reset
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } else {
      setError(result.error || 'Failed to reset password. Please try again.')
    }
    
    setIsSubmitting(false)
  }

  const handleBackToRequest = () => {
    setStep('request')
    setError('')
    setSuccess('')
    setFormData({
      ...formData,
      confirmationCode: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Password Reset - MockMCP",
    "description": "Reset your MockMCP account password to regain access to your mock MCP servers.",
    "url": "https://mockmcp.com/password-reset",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://mockmcp.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Password Reset",
          "item": "https://mockmcp.com/password-reset"
        }
      ]
    }
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <SEOHead 
        title="Password Reset - Regain Access to Your Account"
        description="Reset your MockMCP account password to regain access to your mock Model Context Protocol servers and continue AI agent development."
        keywords="MockMCP password reset, forgot password, account recovery, MCP server access"
        canonicalUrl="/password-reset"
        structuredData={structuredData}
      />
      
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" role="main">
        <div className="max-w-md w-full">
          <div className="hero-card rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="mb-4 flex justify-center">
                <Logo size="lg" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-800 mb-2">
                {step === 'request' ? 'Reset your password' : 'Enter reset code'}
              </h1>
              <p className="text-neutral-600">
                {step === 'request' 
                  ? 'Enter your email address and we\'ll send you a reset code'
                  : 'Check your email for the reset code and enter your new password'
                }
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            )}
            
            {step === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                    Email address
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-primary w-full py-3 rounded-lg text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send reset code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-6">
                <div>
                  <label htmlFor="confirmationCode" className="block text-sm font-medium text-neutral-700 mb-2">
                    Reset code
                  </label>
                  <input 
                    type="text" 
                    id="confirmationCode" 
                    name="confirmationCode"
                    value={formData.confirmationCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter the code from your email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                    New password
                  </label>
                  <input 
                    type="password" 
                    id="newPassword" 
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter your new password"
                    required
                    minLength="8"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                    Confirm new password
                  </label>
                  <input 
                    type="password" 
                    id="confirmPassword" 
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Confirm your new password"
                    required
                    minLength="8"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-primary w-full py-3 rounded-lg text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Resetting...' : 'Reset password'}
                </button>

                <button 
                  type="button"
                  onClick={handleBackToRequest}
                  className="w-full py-3 text-neutral-600 hover:text-neutral-800 font-medium"
                >
                  Back to email entry
                </button>
              </form>
            )}
            
            <div className="mt-8 text-center">
              <p className="text-neutral-600">
                Remember your password?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default PasswordReset 