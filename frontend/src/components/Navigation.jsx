import { Link } from 'react-router-dom'

function Navigation() {
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
          <a href="#" className="text-neutral-600 hover:text-neutral-800 text-sm font-medium transition-colors">
            Features
          </a>
          <a href="#" className="text-neutral-600 hover:text-neutral-800 text-sm font-medium transition-colors">
            Documentation
          </a>
        </nav>
        
        <div className="flex items-center gap-3">
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
        </div>
      </div>
    </header>
  )
}

export default Navigation 