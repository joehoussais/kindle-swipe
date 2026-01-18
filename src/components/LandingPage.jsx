import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// Video background URL - replace with your Midjourney/Runway generated video
const VIDEO_URL = 'https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4';

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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.7) saturate(0.9)' }}
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/50" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-3xl px-6 py-12">
        <AnimatePresence mode="wait">
          {!showAuth ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="dictionary-entry"
            >
              {/* Dictionary-style word */}
              <h1 className="dictionary-word">Highlight</h1>

              {/* Phonetic */}
              <p className="dictionary-phonetic">/ˈhaɪˌlaɪt/</p>

              {/* Part of speech */}
              <p className="dictionary-pos">noun</p>

              {/* Definition that works for both dictionary and app */}
              <p className="dictionary-definition">
                A passage marked for its significance; the act of
                bringing <strong>dormant wisdom</strong> back to light.
                To preserve not just words, but the moment they moved you
                — and to encounter them again, transformed into memory.
              </p>

              {/* Auth Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                {/* Google Sign In - Primary */}
                <motion.button
                  onClick={loginWithGoogle}
                  className="flex-1 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-[#f5f0e8] font-light tracking-wide hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#fff" fillOpacity="0.9" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#fff" fillOpacity="0.7" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fff" fillOpacity="0.5" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#fff" fillOpacity="0.4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </motion.button>

                {/* Email Sign In - Secondary */}
                <motion.button
                  onClick={() => setShowAuth(true)}
                  className="flex-1 px-6 py-3 bg-transparent border border-white/10 rounded-full text-white/60 font-light tracking-wide hover:bg-white/5 hover:text-white/80 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign in with Email
                </motion.button>
              </div>

              {/* Divider */}
              <div className="mt-8 flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Preview the app */}
              <motion.button
                onClick={enterPreviewMode}
                className="mt-4 w-full text-center text-white/40 hover:text-white/60 text-sm transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Preview the experience
              </motion.button>

              {/* Subtle tagline */}
              <p className="mt-6 text-sm text-white/40 italic">
                Your highlights deserve to be remembered.
              </p>
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
                className="mb-6 flex items-center gap-2 text-white/50 hover:text-white/80 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {/* Auth Card */}
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-light text-[#f5f0e8] mb-2 font-['Playfair_Display']">
                  {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="text-white/50 text-sm mb-6">
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
                        <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-[#f5f0e8] placeholder-white/30 focus:outline-none focus:border-white/30 transition"
                          placeholder="Your name"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-[#f5f0e8] placeholder-white/30 focus:outline-none focus:border-white/30 transition"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-[#f5f0e8] placeholder-white/30 focus:outline-none focus:border-white/30 transition"
                      placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                      required
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-amber-400/80 text-sm bg-amber-400/10 rounded-lg p-3 border border-amber-400/20"
                    >
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-lg bg-white/10 border border-white/20 text-[#f5f0e8] font-medium hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="text-white/40 hover:text-white/70 transition text-sm"
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
      </div>
    </div>
  );
}
