import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'sakhi_user_session_v1';

/**
 * Parses JWT payload from Google Identity Services token
 */
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const isConfigured = Boolean(googleClientId && googleClientId.includes('.apps.googleusercontent.com'));

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Safe fallback
    }
    return null;
  });

  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } catch {
        // Safe fallback
      }
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const handleGoogleSuccess = (credentialResponse) => {
    setAuthError(null);
    if (!credentialResponse?.credential) {
      setAuthError('Google sign-in token missing.');
      return;
    }

    const payload = parseJwt(credentialResponse.credential);
    if (!payload || !payload.email) {
      setAuthError('Failed to parse Google user information.');
      return;
    }

    const userData = {
      id: payload.sub,
      name: payload.name || payload.given_name || 'Sakhi Artisan',
      givenName: payload.given_name || payload.name?.split(' ')[0] || 'Sakhi',
      email: payload.email,
      picture: payload.picture || '',
      verifiedEmail: payload.email_verified,
      signedInAt: new Date().toISOString()
    };

    setUser(userData);
  };

  const handleGoogleError = () => {
    setAuthError('Google sign-in could not be completed. Please check popup blockers or network connection.');
  };

  const logout = () => {
    setUser(null);
    setAuthError(null);
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    googleClientId,
    isConfigured,
    authError,
    setAuthError,
    handleGoogleSuccess,
    handleGoogleError,
    logout
  };

  // If Google Client ID is configured, wrap with GoogleOAuthProvider, otherwise render without breaking
  if (isConfigured) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthContext.Provider value={value}>
          {children}
        </AuthContext.Provider>
      </GoogleOAuthProvider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
