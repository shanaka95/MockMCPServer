import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Navigation() {
  const { user, isAuthenticated, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    setShowUserMenu(false)
  }

  const getUserDisplayName = () => {
    // Try name first, then email username, then fallback
    if (user?.attributes?.name) {
      return user.attributes.name
    }
    if (user?.attributes?.email) {
      return user.attributes.email.split('@')[0]
    }
    return user?.username || 'User'
  }

  return (
    <header className="glass-nav sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-800">
            MockMCP
          </h2>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            to="/" 
            className="text-neutral-600 hover:text-neutral-800 text-sm font-medium transition-colors"
          >
            Home
          </Link>
          <Link 
            to="/demo" 
            className="text-neutral-600 hover:text-neutral-800 text-sm font-medium transition-colors"
          >
            Demo
          </Link>
          {/* Removed non-functional links for simplicity */}
        </nav>
        
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 focus:outline-none"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:inline">{getUserDisplayName()}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="text-sm font-medium text-neutral-900">{getUserDisplayName()}</p>
                    <p className="text-xs text-neutral-500">{user?.attributes?.email}</p>
                  </div>
                  <Link
                    to="/demo"
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link 
                to="/login" 
                className="btn-outline px-4 py-2 rounded-lg text-sm font-medium"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navigation 