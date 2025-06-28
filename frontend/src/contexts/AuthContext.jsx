import React, { createContext, useContext, useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { 
  signUp, 
  signIn, 
  signOut, 
  getCurrentUser,
  fetchUserAttributes,
  confirmSignUp,
  resendSignUpCode,
  fetchAuthSession
} from 'aws-amplify/auth';
import { amplifyConfig } from '../config/auth';

/* eslint-disable react-refresh/only-export-components */

// Configure Amplify with Gen2 configuration
Amplify.configure(amplifyConfig);

const AuthContext = createContext(null);

/**
 * Custom hook to use the Auth context
 * @returns {Object} Auth context value
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Auth Provider Component - Manages authentication state using AWS Amplify Gen2
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication state on app load
  useEffect(() => {
    checkAuthState();
  }, []);

  /**
   * Check current authentication state
   * @returns {Promise<void>}
   */
  const checkAuthState = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        // Fetch user attributes separately and combine with user object
        try {
          const attributes = await fetchUserAttributes();
          setUser({
            ...currentUser,
            attributes: attributes
          });
        } catch (attrError) {
          console.warn('Could not fetch user attributes:', attrError);
          // Set user without attributes if attribute fetch fails
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('No authenticated user found:', error.message);
      setUser(null);
      setError(null); // Don't set error for normal "not authenticated" state
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign in user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Result object with success flag and additional data
   */
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await signIn({
        username: email, // Use email as username
        password: password,
      });

      // Handle different sign-in outcomes
      if (result.isSignedIn) {
        const currentUser = await getCurrentUser();
        
        // Fetch user attributes
        try {
          const attributes = await fetchUserAttributes();
          setUser({
            ...currentUser,
            attributes: attributes
          });
        } catch (attrError) {
          console.warn('Could not fetch user attributes:', attrError);
          setUser(currentUser);
        }
        
        return { success: true };
      } else {
        // Handle cases where additional steps are required
        return { 
          success: false, 
          nextStep: result.nextStep,
          message: 'Additional verification required'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   * @param {string} name - User's full name
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Result object with success flag and additional data
   */
  const register = async (name, email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      // Validate input
      if (!name?.trim()) {
        throw new Error('Name is required');
      }
      
      if (!email?.trim()) {
        throw new Error('Email is required');
      }
      
      if (!password) {
        throw new Error('Password is required');
      }
      
      const result = await signUp({
        username: email, // Use email as username for consistency
        password: password,
        options: {
          userAttributes: {
            email: email,
            name: name.trim(),
          },
        },
      });

      return { 
        success: true, 
        isSignUpComplete: result.isSignUpComplete, 
        userId: result.userId, 
        nextStep: result.nextStep,
        username: email // Return email as username for confirmation flow
      };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirm user registration with verification code
   * @param {string} email - User email (used as username)
   * @param {string} confirmationCode - Verification code from email
   * @returns {Promise<Object>} Result object with success flag and additional data
   */
  const confirmRegistration = async (email, confirmationCode) => {
    try {
      setError(null);
      setLoading(true);
      
      if (!email?.trim()) {
        throw new Error('Email is required');
      }
      
      if (!confirmationCode?.trim()) {
        throw new Error('Confirmation code is required');
      }
      
      const result = await confirmSignUp({
        username: email,
        confirmationCode: confirmationCode.trim(),
      });

      return { 
        success: true, 
        isSignUpComplete: result.isSignUpComplete, 
        nextStep: result.nextStep 
      };
    } catch (error) {
      console.error('Confirmation error:', error);
      const errorMessage = error.message || 'Email confirmation failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend confirmation code to user's email
   * @param {string} email - User email (used as username)
   * @returns {Promise<Object>} Result object with success flag
   */
  const resendConfirmationCode = async (email) => {
    try {
      setError(null);
      
      if (!email?.trim()) {
        throw new Error('Email is required');
      }
      
      await resendSignUpCode({ 
        username: email 
      });
      
      return { success: true };
    } catch (error) {
      console.error('Resend confirmation error:', error);
      const errorMessage = error.message || 'Failed to resend confirmation code. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Sign out current user
   * @returns {Promise<Object>} Result object with success flag
   */
  const logout = async () => {
    try {
      setError(null);
      await signOut();
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      const errorMessage = error.message || 'Logout failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Get the current user's access token
   * @returns {Promise<string>} Access token
   * @throws {Error} If user is not authenticated or token retrieval fails
   */
  const getAccessToken = async () => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const session = await fetchAuthSession();
      
      if (!session?.tokens?.accessToken) {
        throw new Error('No access token available');
      }

      return session.tokens.accessToken.toString();
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  };

  // Context value object
  const value = {
    // State
    user,
    loading,
    error,
    isAuthenticated: !!user,
    
    // Actions
    login,
    register,
    confirmRegistration,
    resendConfirmationCode,
    logout,
    checkAuthState,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 