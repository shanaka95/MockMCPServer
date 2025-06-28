import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navigation from './components/Navigation'
import LoginCallback from './components/LoginCallback'
import EmailConfirmation from './components/EmailConfirmation'
import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Demo from './pages/Demo'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Router>
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login/callback" element={<LoginCallback />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/confirm-email" element={<EmailConfirmation />} />
          </Routes>
        </Router>
      </div>
    </AuthProvider>
  )
}

export default App
