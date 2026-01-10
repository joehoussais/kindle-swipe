import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { BACKGROUNDS } from '../utils/backgrounds';
import { generateStarterHighlights } from '../utils/starterPack';
import { SwipeCard } from './SwipeCard';

export function AuthScreen() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo quotes for the preview
  const [demoHighlights] = useState(() => generateStarterHighlights());
  const [demoIndex, setDemoIndex] = useState(0);

  const { login, register, loginWithGoogle } = useAuth();

  // Pick a random background for the left side
  const bg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
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
        await register(email, password, name);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  // Handle demo navigation
  const handleDemoNext = () => {
    setDemoIndex(prev => (prev + 1) % demoHighlights.length);
  };

  const handleDemoPrev = () => {
    setDemoIndex(prev => (prev - 1 + demoHighlights.length) % demoHighlights.length);
  };

  // Handle wheel/touch for demo
  useEffect(() => {
    let lastScroll = 0;
    const handleWheel = (e) => {
      const now = Date.now();
      if (now - lastScroll < 500) return;

      if (e.deltaY > 50) {
        handleDemoNext();
        lastScroll = now;
      } else if (e.deltaY < -50) {
        handleDemoPrev();
        lastScroll = now;
      }
    };

    const demoArea = document.getElementById('demo-area');
    if (demoArea) {
      demoArea.addEventListener('wheel', handleWheel, { passive: true });
      return () => demoArea.removeEventListener('wheel', handleWheel);
    }
  }, []);

  return (
    <div className="h-screen w-screen flex">
      {/* LEFT SIDE: Auth */}
      <div className="w-full lg:w-1/2 relative overflow-hidden flex items-center justify-center">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bg.src})` }}
        />
        <div className="absolute inset-0 bg-black/70" />

        {/* Auth Content */}
        <div className="relative z-10 w-full max-w-md p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Logo/Title */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Kindle Swipe</h1>
              <p className="text-white/60">Your highlights, beautifully presented</p>
            </div>

            {/* Auth Card */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-semibold text-white mb-6">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {mode === 'register' && (
                    <motion.div
                      key="name"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-white/80 text-sm mb-1">Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition"
                        placeholder="Your name"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-white/80 text-sm mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition"
                    placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                    required
                  />
                </div>

                {mode === 'login' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-white/70 text-sm">Remember me</span>
                  </label>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-sm bg-red-500/10 rounded-lg p-3"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? 'Please wait...'
                    : mode === 'login'
                    ? 'Sign in'
                    : 'Create account'}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-white/20" />
                  <span className="text-white/40 text-sm">or</span>
                  <div className="flex-1 h-px bg-white/20" />
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="w-full py-3 rounded-lg bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={switchMode}
                  className="text-white/60 hover:text-white transition text-sm"
                >
                  {mode === 'login'
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>

            {/* Teaser - only show on mobile */}
            <div className="mt-6 text-center lg:hidden">
              <p className="text-white/40 text-sm">
                Scroll down to try it out
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE: Demo Swipe (hidden on mobile, shown on lg+) */}
      <div
        id="demo-area"
        className="hidden lg:block lg:w-1/2 relative overflow-hidden"
      >
        {/* Demo SwipeCard */}
        <AnimatePresence mode="wait">
          <motion.div
            key={demoIndex}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <SwipeCard
              highlight={demoHighlights[demoIndex]}
              isTop={true}
            />
          </motion.div>
        </AnimatePresence>

        {/* Demo indicator */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm">
            <span className="text-white/80 text-sm font-medium">
              {demoIndex + 1} / {demoHighlights.length}
            </span>
            <span className="text-white/50 text-xs">
              Scroll to explore
            </span>
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={handleDemoPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-black/50 transition"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={handleDemoNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-black/50 transition"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
