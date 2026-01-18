import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

// Preview mode is intentionally NOT persisted - it's for exploration only
// Users should see the landing page fresh each visit until they sign up

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        // Preview mode is never persisted - always start fresh
        // Only check for real authenticated sessions
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
            avatar: session.user.user_metadata?.avatar || 'augustus'
          });
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0],
          avatar: session.user.user_metadata?.avatar || 'augustus'
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Register new user
  const register = useCallback(async (email, password, name, avatar = 'augustus') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, avatar },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) throw error;

    // Check if email confirmation is required
    // Supabase returns user but no session when confirmation is needed
    if (data.user && !data.session) {
      const error = new Error('Please check your email to confirm your account before signing in.');
      error.isConfirmationNeeded = true;
      throw error;
    }

    return {
      id: data.user.id,
      email: data.user.email,
      name,
      avatar
    };
  }, []);

  // Login existing user
  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || email.split('@')[0],
      avatar: data.user.user_metadata?.avatar || 'augustus'
    };
  }, []);

  // Logout
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsGuestMode(false);
  }, []);

  // Enter preview mode (exploratory, not persisted)
  const enterPreviewMode = useCallback(() => {
    setIsGuestMode(true);
  }, []);

  // Exit preview mode (return to landing page)
  const exitPreviewMode = useCallback(() => {
    setIsGuestMode(false);
  }, []);

  // Login with Google
  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    if (error) throw error;
  }, []);

  // Track a book import (placeholder for now)
  const trackBook = useCallback(async (bookTitle, author, highlightCount) => {
    if (!user) return;
    // Book tracking is handled via the highlights table now
    console.log(`Tracked: ${bookTitle} by ${author} (${highlightCount} highlights)`);
  }, [user]);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user || isGuestMode,
    isGuestMode,
    userBooks: [], // Placeholder - books are tracked via highlights table
    register,
    login,
    loginWithGoogle,
    logout,
    enterPreviewMode,
    exitPreviewMode,
    trackBook,
    removeBook: async () => {} // Placeholder
  };

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
