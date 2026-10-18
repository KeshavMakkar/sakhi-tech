import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'sakhi_user_session_v2';

/**
 * Parses JWT payload from Google Identity Services ID token.
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
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Sync user state with localStorage
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

  // Synchronize with Supabase Auth state (restores session on page reload/navigation)
  useEffect(() => {
    if (!supabase) return;

    // 1. Check existing active session on mount
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('[AuthContext] Error retrieving session:', error);
        return;
      }
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        setUser({
          id: session.user.id, // Authenticated Supabase UUID
          name: meta.full_name || meta.name || session.user.email?.split('@')[0] || 'Sakhi Artisan',
          givenName: meta.given_name || (meta.full_name || meta.name || '').split(' ')[0] || 'Sakhi',
          email: session.user.email,
          picture: meta.avatar_url || meta.picture || '',
          verifiedEmail: Boolean(session.user.email_confirmed_at),
          signedInAt: session.user.created_at || new Date().toISOString(),
          hasSupabaseSession: true,
        });
      }
    });

    // 2. Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          setUser({
            id: session.user.id, // Authenticated Supabase UUID
            name: meta.full_name || meta.name || session.user.email?.split('@')[0] || 'Sakhi Artisan',
            givenName: meta.given_name || (meta.full_name || meta.name || '').split(' ')[0] || 'Sakhi',
            email: session.user.email,
            picture: meta.avatar_url || meta.picture || '',
            verifiedEmail: Boolean(session.user.email_confirmed_at),
            signedInAt: session.user.created_at || new Date().toISOString(),
            hasSupabaseSession: true,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Handle Google Identity Services login success.
   * Exchanges the Google ID token with Supabase Auth (signInWithIdToken)
   * so the app receives a valid Supabase session with a real UUID.
   */
  const handleGoogleSuccess = async (credentialResponse) => {
    setAuthError(null);
    setIsAuthenticating(true);

    const idToken = credentialResponse?.credential;
    if (!idToken) {
      setAuthError('Google sign-in token missing.');
      setIsAuthenticating(false);
      return;
    }

    const payload = parseJwt(idToken);
    if (!payload || !payload.email) {
      setAuthError('Failed to parse Google user information.');
      setIsAuthenticating(false);
      return;
    }

    // If Supabase is configured, exchange the Google ID token with Supabase Auth
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (error) {
          console.error('[AuthContext] Supabase signInWithIdToken error:', error);
          setAuthError(
            `Supabase Google authentication error: ${error.message}. Please verify Google Provider is enabled in Supabase Dashboard (Authentication → Providers → Google) with your Client ID.`
          );
          setIsAuthenticating(false);
          return;
        }

        if (data?.session && data?.user) {
          const meta = data.user.user_metadata || {};
          const userData = {
            id: data.user.id, // Real Supabase Auth UUID from auth.users
            name: meta.full_name || meta.name || payload.name || payload.given_name || 'Sakhi Artisan',
            givenName: meta.given_name || payload.given_name || (payload.name || '').split(' ')[0] || 'Sakhi',
            email: data.user.email || payload.email,
            picture: meta.avatar_url || payload.picture || '',
            verifiedEmail: Boolean(data.user.email_confirmed_at || payload.email_verified),
            signedInAt: new Date().toISOString(),
            hasSupabaseSession: true,
          };
          setUser(userData);
          setIsAuthenticating(false);
          return;
        }
      } catch (err) {
        console.error('[AuthContext] Exception during signInWithIdToken:', err);
        setAuthError(`Authentication error: ${err.message || 'Failed to exchange ID token with Supabase.'}`);
        setIsAuthenticating(false);
        return;
      }
    }

    // Fallback when Supabase is not configured (demo/offline mode)
    const fallbackUserData = {
      id: payload.sub,
      name: payload.name || payload.given_name || 'Sakhi Artisan',
      givenName: payload.given_name || payload.name?.split(' ')[0] || 'Sakhi',
      email: payload.email,
      picture: payload.picture || '',
      verifiedEmail: payload.email_verified,
      signedInAt: new Date().toISOString(),
      hasSupabaseSession: false,
    };
    setUser(fallbackUserData);
    setIsAuthenticating(false);
  };

  const handleGoogleError = () => {
    setAuthError('Google sign-in could not be completed. Please check popup blockers or network connection.');
    setIsAuthenticating(false);
  };

  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[AuthContext] signOut error:', err);
      }
    }
    setUser(null);
    setAuthError(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    hasSupabaseSession: Boolean(user?.hasSupabaseSession),
    googleClientId,
    isConfigured,
    authError,
    isAuthenticating,
    setAuthError,
    handleGoogleSuccess,
    handleGoogleError,
    logout
  };

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
