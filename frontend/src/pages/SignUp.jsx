import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'
import SEOHead from '../components/SEOHead'

function SignUp() {
  const navigate = useNavigate()
  const { register, loading, isAuthenticated } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

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
    // Clear error when user starts typing
    if (error) setError('')
  }

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setError('')

    const result = await register(formData.name, formData.email, formData.password)
    
    if (result.success) {
      // Navigate to email confirmation page with email
      navigate('/confirm-email', { 
        state: { 
          email: formData.email
        }
      })
    } else {
      setError(result.error || 'Registration failed. Please try again.')
    }
    
    setIsSubmitting(false)
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Sign Up - MockMCP",
    "description": "Create your free MockMCP account to start generating mock MCP servers for AI agent testing in seconds.",
    "url": "https://mockmcp.com/signup",
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
          "name": "Sign Up",
          "item": "https://mockmcp.com/signup"
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
        title="Sign Up Free - Start Creating Mock MCP Servers"
        description="Create your free MockMCP account and start generating mock Model Context Protocol servers for AI agent testing and development in under 30 seconds."
        keywords="MockMCP sign up, create account, free MCP servers, AI agent testing registration"
        canonicalUrl="/signup"
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
                Create your account
              </h1>
              <p className="text-neutral-600">
                Start building mock servers in less than 30 seconds
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                  Full Name
                </label>
                <input 
                  type="text" 
                  id="name" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>

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
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                  Password
                </label>
                <input 
                  type="password" 
                  id="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                  Confirm password
                </label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Confirm your password"
                  required
                />
              </div>
              
              <div>
                <label className="flex items-start">
                  <input 
                    type="checkbox" 
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500 mt-1" 
                  />
                  <span className="ml-3 text-sm text-neutral-600">
                    I agree to the Terms of Service and Privacy Policy
                  </span>
                </label>
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-success w-full py-3 rounded-lg text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-neutral-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
            
            {/* Removed marketing content for simplicity */}
          </div>
        </div>
      </main>
    </>
  )
}

export default SignUp 