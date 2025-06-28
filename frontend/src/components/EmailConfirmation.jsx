import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function EmailConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmRegistration, resendConfirmationCode } = useAuth();
  
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  // Get email from navigation state (email is used as username in our system)
  const email = location.state?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmationCode.trim()) {
      setError('Please enter the confirmation code');
      return;
    }

    setLoading(true);
    setError('');
    
    // Use email for confirmation (email is our username)
    const result = await confirmRegistration(email, confirmationCode.trim());
    
    if (result.success) {
      setSuccess('Email confirmed successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.error || 'Failed to confirm email');
    }
    
    setLoading(false);
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('Email not found. Please try signing up again.');
      return;
    }

    setResendLoading(true);
    setError('');
    
    // Use email for resend (email is our username)
    const result = await resendConfirmationCode(email);
    
    if (result.success) {
      setSuccess('Confirmation code sent! Please check your email.');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Failed to resend confirmation code');
    }
    
    setResendLoading(false);
  };

  if (!email) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="hero-card rounded-2xl p-8">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">
              Invalid Access
            </h2>
            <p className="text-neutral-600 mb-6">
              No email found for confirmation. Please sign up again.
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="btn-primary px-6 py-2 rounded-lg"
            >
              Back to Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="hero-card rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-emerald-600 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">
              Confirm Your Email
            </h1>
            <p className="text-neutral-600">
              We've sent a confirmation code to <strong>{email}</strong>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="confirmationCode" className="block text-sm font-medium text-neutral-700 mb-2">
                Confirmation Code
              </label>
              <input
                type="text"
                id="confirmationCode"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Enter the 6-digit code"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-success w-full py-3 rounded-lg text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Confirming...' : 'Confirm Email'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-600 text-sm mb-3">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendCode}
              disabled={resendLoading}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? 'Sending...' : 'Resend confirmation code'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/signup')}
              className="text-neutral-600 hover:text-neutral-800 text-sm"
            >
              ← Back to Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailConfirmation; 