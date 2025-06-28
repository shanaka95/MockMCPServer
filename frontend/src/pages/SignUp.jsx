import { Link } from 'react-router-dom'

function SignUp() {
  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="hero-card rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-emerald-600 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">
              Create your account
            </h1>
            <p className="text-neutral-600">
              Start building mock servers in less than 30 seconds
            </p>
          </div>
          
          <form className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email address
              </label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Enter your email"
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
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Create a strong password"
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
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Confirm your password"
              />
            </div>
            
            <div>
              <label className="flex items-start">
                <input type="checkbox" className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500 mt-1" />
                <span className="ml-3 text-sm text-neutral-600">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Privacy Policy</a>
                </span>
              </label>
            </div>
            
            <button 
              type="submit" 
              className="btn-success w-full py-3 rounded-lg text-base font-semibold"
            >
              Create account
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
          
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="text-center">
              <p className="text-xs text-neutral-500 mb-2">Trusted by developers at</p>
              <div className="flex justify-center items-center gap-4 text-xs text-neutral-400">
                <span>🚀 Startups</span>
                <span>•</span>
                <span>🏢 Enterprises</span>
                <span>•</span>
                <span>🎓 Universities</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default SignUp 