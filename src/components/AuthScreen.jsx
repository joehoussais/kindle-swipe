import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { BACKGROUNDS } from '../utils/backgrounds';
import { generateStarterHighlights } from '../utils/starterPack';
import { SwipeCard } from './SwipeCard';
import { AvatarSelector, AVATAR_TYPES } from './CoinAvatar';

export function AuthScreen() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_TYPES.augustus);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo quotes for the preview
  const [demoHighlights] = useState(() => generateStarterHighlights());
  const [demoIndex, setDemoIndex] = useState(0);

  const { login, register, loginWithGoogle } = useAuth();

  // Pick a random background for the left side (stable - doesn't change on re-render)
  const [bg] = useState(() => BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
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
        await register(email, password, name, avatar);
      }
    } catch (err) {
      // Check if this is actually a success (email confirmation needed)
      if (err.isConfirmationNeeded) {
        setSuccessMessage(err.message);
      } else {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setSuccessMessage('');
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
    <div className="h-screen w-screen flex bg-[#0a0a0a]">
      {/* LEFT SIDE: Auth */}
      <div className="w-full lg:w-1/2 relative overflow-hidden flex items-center justify-center">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bg.src})` }}
        />
        <div className="absolute inset-0 bg-black/75" />

        {/* Auth Content */}
        <div className="relative z-10 w-full max-w-md p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Logo/Title */}
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-light text-[#f5f0e8] mb-3 tracking-wide leading-tight">
                Highlights are capture.<br />
                <span className="text-[#d4c4b0]">This is recall.</span>
              </h1>
              <p className="text-[#a8a29e] italic text-sm">
                You didn't highlight to highlight. You highlighted to remember.
              </p>
            </div>

            {/* Value prop bullets */}
            <div className="mb-6 space-y-3">
              <div className="flex gap-3 items-start">
                <span className="text-[#d4c4b0] mt-0.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <p className="text-[#a09080] text-sm leading-relaxed">
                  <strong className="text-[#f5f0e8]">Active recall beats rereading</strong> — Testing yourself strengthens retention more than seeing it again.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-[#d4c4b0] mt-0.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <p className="text-[#a09080] text-sm leading-relaxed">
                  <strong className="text-[#f5f0e8]">Spacing makes it stick</strong> — Resurfacing ideas over time improves long-term memory.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-[#d4c4b0] mt-0.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <p className="text-[#a09080] text-sm leading-relaxed">
                  <strong className="text-[#f5f0e8]">Rewrite to own it</strong> — Putting an idea in your own words deepens understanding.
                </p>
              </div>
            </div>

            {/* Auth Card */}
            <div className="bg-[#141414]/90 backdrop-blur-xl rounded-lg p-8 border border-[#1a1a1a]">
              <h2 className="text-xl font-light text-[#f5f0e8] mb-6">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {mode === 'register' && (
                    <motion.div
                      key="register-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-[#a8a29e] text-xs uppercase tracking-wider mb-1.5">Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a]/50 border border-[#292524] text-[#f5f0e8] placeholder-[#78716c] focus:outline-none focus:border-[#d4c4b0] transition"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="block text-[#a8a29e] text-xs uppercase tracking-wider mb-3">Choose Your Coin</label>
                        <AvatarSelector selected={avatar} onSelect={setAvatar} size={56} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-[#a8a29e] text-xs uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a]/50 border border-[#292524] text-[#f5f0e8] placeholder-[#78716c] focus:outline-none focus:border-[#d4c4b0] transition"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#a8a29e] text-xs uppercase tracking-wider mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a]/50 border border-[#292524] text-[#f5f0e8] placeholder-[#78716c] focus:outline-none focus:border-[#d4c4b0] transition"
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
                      className="w-4 h-4 rounded bg-[#1a1a1a] border-[#292524] text-[#d4c4b0] focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[#a8a29e] text-sm">Remember me</span>
                  </label>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[#d4c4b0] text-sm bg-[#1a1a1a] rounded-lg p-3 border border-[#292524]"
                  >
                    {error}
                  </motion.div>
                )}

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-green-400 text-sm bg-green-900/20 rounded-lg p-3 border border-green-800/50"
                  >
                    {successMessage}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg bg-[#d4c4b0] text-[#141414] font-medium hover:bg-[#b08c6a] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? 'Please wait...'
                    : mode === 'login'
                    ? 'Start Recalling'
                    : 'Start Recalling'}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-[#1a1a1a]" />
                  <span className="text-[#78716c] text-xs uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-[#1a1a1a]" />
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="w-full py-3 rounded-lg bg-[#1a1a1a]/50 border border-[#292524] text-[#f5f0e8] hover:bg-[#1a1a1a] transition flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#d4c4b0" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#d4c4b0" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#a8a29e" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#78716c" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={switchMode}
                  className="text-[#78716c] hover:text-[#d4c4b0] transition text-sm"
                >
                  {mode === 'login'
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>

            {/* Features teaser - only show on mobile */}
            <div className="mt-6 text-center lg:hidden">
              <p className="text-[#78716c] text-sm italic">
                Scroll down to try it out
              </p>
            </div>

            {/* Research references link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => window.open('https://en.wikipedia.org/wiki/Testing_effect', '_blank')}
                className="text-[#78716c] hover:text-[#d4c4b0] transition text-xs"
              >
                Built on decades of memory science. See the research →
              </button>
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

        {/* Demo indicator with timestamp preview */}
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center z-20 gap-2">
          <div className="px-4 py-2 rounded-lg bg-black/40 backdrop-blur-sm border border-[#1a1a1a]">
            <span className="text-[#a8a29e] text-sm italic">
              "You highlighted this on January 15, 2024"
            </span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-black/40 backdrop-blur-sm border border-[#1a1a1a]">
            <span className="text-[#d4c4b0] text-sm">
              {demoIndex + 1} / {demoHighlights.length}
            </span>
            <span className="text-[#78716c] text-xs italic">
              Scroll to explore
            </span>
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={handleDemoPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-black/50 transition border border-[#1a1a1a]"
        >
          <svg className="w-5 h-5 text-[#a8a29e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={handleDemoNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-black/50 transition border border-[#1a1a1a]"
        >
          <svg className="w-5 h-5 text-[#a8a29e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
