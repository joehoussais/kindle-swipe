import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export function LandingPage({ onGetStarted }) {
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register, loginWithGoogle, enterPreviewMode } = useAuth();

  // Basic email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validate email before sending to Supabase
    if (!email.trim()) {
      setError('Please enter your email address');
      setIsSubmitting(false);
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        if (!name.trim()) {
          setError('Please enter your name');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setIsSubmitting(false);
          return;
        }
        await register(email.trim(), password, name.trim());
      }
    } catch (err) {
      // Map common Supabase errors to user-friendly messages
      const message = err.message?.toLowerCase() || '';
      if (message.includes('invalid email') || message.includes('email not valid')) {
        setError('Please enter a valid email address');
      } else if (message.includes('email already')) {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (message.includes('invalid login')) {
        setError('Invalid email or password');
      } else if (message.includes('confirmation')) {
        setError(err.message);
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main content */}
      <div className="relative min-h-screen flex flex-col">
        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-6 py-16">
          <AnimatePresence mode="wait">
            {!showAuth ? (
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl mx-auto text-center"
              >
                {/* Main heading */}
                <h1
                  className="text-5xl md:text-6xl lg:text-7xl font-normal text-gray-900 mb-6"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Highlight
                </h1>

                {/* Subtitle */}
                <p
                  className="text-xl md:text-2xl text-gray-500 mb-4 max-w-lg mx-auto leading-relaxed"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}
                >
                  Rediscover the passages that moved you.
                </p>

                {/* Extended description */}
                <p className="text-gray-400 text-base mb-10 max-w-md mx-auto">
                  Import your Kindle highlights, journal entries, and saved quotes.
                  Swipe through them like memories, beautifully organized.
                </p>

                {/* Primary CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  {/* Google Sign In - Primary */}
                  <motion.button
                    onClick={loginWithGoogle}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-[#2d3748] hover:bg-[#1a202c] text-white rounded-lg font-medium transition-all duration-200 shadow-lucis hover:shadow-lucis-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" fillOpacity="0.9" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" fillOpacity="0.7" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" fillOpacity="0.5" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" fillOpacity="0.4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Get Started with Google
                  </motion.button>

                  {/* Email Sign In - Secondary */}
                  <motion.button
                    onClick={() => setShowAuth(true)}
                    className="px-8 py-4 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg font-medium transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Sign in with Email
                  </motion.button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 max-w-xs mx-auto mb-6">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-gray-400 text-xs uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Preview the app */}
                <motion.button
                  onClick={enterPreviewMode}
                  className="text-gray-500 hover:text-gray-700 text-sm transition-colors underline underline-offset-4"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Preview the experience first
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md mx-auto"
              >
                {/* Back button */}
                <button
                  onClick={() => setShowAuth(false)}
                  className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-700 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                {/* Auth Card */}
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lucis-lg">
                  <h2
                    className="text-2xl font-normal text-gray-900 mb-2"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {mode === 'login' ? 'Welcome back' : 'Create account'}
                  </h2>
                  <p className="text-gray-500 text-sm mb-6">
                    {mode === 'login'
                      ? 'Sign in to access your highlights'
                      : 'Start building your second brain'}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence mode="wait">
                      {mode === 'register' && (
                        <motion.div
                          key="name"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <label className="block text-gray-600 text-xs uppercase tracking-wider mb-1.5">Name</label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition"
                            placeholder="Your name"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div>
                      <label className="block text-gray-600 text-xs uppercase tracking-wider mb-1.5">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition"
                        placeholder="you@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-600 text-xs uppercase tracking-wider mb-1.5">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition"
                        placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                        required
                      />
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-600 text-sm bg-red-50 rounded-lg p-3 border border-red-100"
                      >
                        {error}
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-lg bg-[#2d3748] hover:bg-[#1a202c] text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting
                        ? 'Please wait...'
                        : mode === 'login'
                        ? 'Sign In'
                        : 'Create Account'}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setMode(mode === 'login' ? 'register' : 'login');
                        setError('');
                      }}
                      className="text-gray-500 hover:text-gray-700 transition text-sm"
                    >
                      {mode === 'login'
                        ? "Don't have an account? Sign up"
                        : 'Already have an account? Sign in'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="py-8 text-center border-t border-gray-100">
          <p className="text-gray-400 text-sm">
            Your highlights deserve to be remembered.
          </p>
        </footer>
      </div>
    </div>
  );
}
