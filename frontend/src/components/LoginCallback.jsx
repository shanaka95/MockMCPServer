import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LoginCallback() {
  const navigate = useNavigate();
  const { checkAuthState } = useAuth();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('processing');
        
        // Wait a moment for Amplify to process the callback
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check authentication state
        await checkAuthState();
        
        setStatus('success');
        
        // Redirect to dashboard or home page
        setTimeout(() => {
          navigate('/demo');
        }, 1500);
        
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        
        // Redirect to login page after error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, checkAuthState]);

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="hero-card rounded-2xl p-8">
          {status === 'processing' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-2">
                Processing Login...
              </h2>
              <p className="text-neutral-600">
                Please wait while we sign you in.
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-2">
                Login Successful!
              </h2>
              <p className="text-neutral-600">
                Redirecting you to the application...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-2">
                Login Failed
              </h2>
              <p className="text-neutral-600 mb-4">
                There was an error processing your login. You will be redirected to the login page.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginCallback; 