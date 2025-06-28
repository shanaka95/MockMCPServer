import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navigation from './components/Navigation'
import EmailConfirmation from './components/EmailConfirmation'
import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import PasswordReset from './pages/PasswordReset'
import Demo from './pages/Demo'
import CreateServer from './pages/CreateServer'
import Servers from './pages/Servers'

// Component to handle redirects for authenticated users
function ProtectedHome() {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return isAuthenticated ? <Navigate to="/servers" replace /> : <Home />
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Router>
          <Navigation />
          <Routes>
            <Route path="/" element={<ProtectedHome />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/create-server" element={<CreateServer />} />
            <Route path="/servers" element={<Servers />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/confirm-email" element={<EmailConfirmation />} />
          </Routes>
        </Router>
      </div>
    </AuthProvider>
  )
}

export default App
