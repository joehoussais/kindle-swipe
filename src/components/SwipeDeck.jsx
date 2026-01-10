import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SwipeCard } from './SwipeCard';

export function SwipeDeck({
  highlights,
  currentIndex,
  onNext,
  onPrev,
  onShuffle,
  onSettings,
  onLibrary,
  onBooksHistory,
  onGoTo,
  totalCount,
  user
}) {
  const [direction, setDirection] = useState(0);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isScrolling = useRef(false);

  const currentHighlight = highlights[currentIndex];

  // Handle wheel scroll (desktop)
  const handleWheel = useCallback((e) => {
    if (isScrolling.current) return;

    const threshold = 50;
    if (e.deltaY > threshold && currentIndex < highlights.length - 1) {
      isScrolling.current = true;
      setDirection(1);
      onNext();
      setTimeout(() => { isScrolling.current = false; }, 400);
    } else if (e.deltaY < -threshold && currentIndex > 0) {
      isScrolling.current = true;
      setDirection(-1);
      onPrev();
      setTimeout(() => { isScrolling.current = false; }, 400);
    }
  }, [currentIndex, highlights.length, onNext, onPrev]);

  // Handle touch scroll (mobile)
  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (isScrolling.current) return;

    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;
    const deltaTime = Date.now() - touchStartTime.current;
    const velocity = Math.abs(deltaY) / deltaTime;

    const threshold = 50;
    const velocityThreshold = 0.3;

    if ((deltaY > threshold || velocity > velocityThreshold) && currentIndex < highlights.length - 1) {
      // Swiped up - next
      isScrolling.current = true;
      setDirection(1);
      onNext();
      setTimeout(() => { isScrolling.current = false; }, 400);
    } else if ((deltaY < -threshold || velocity > velocityThreshold) && deltaY < 0 && currentIndex > 0) {
      // Swiped down - previous
      isScrolling.current = true;
      setDirection(-1);
      onPrev();
      setTimeout(() => { isScrolling.current = false; }, 400);
    }
  }, [currentIndex, highlights.length, onNext, onPrev]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isScrolling.current) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          isScrolling.current = true;
          setDirection(-1);
          onPrev();
          setTimeout(() => { isScrolling.current = false; }, 400);
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (currentIndex < highlights.length - 1) {
          isScrolling.current = true;
          setDirection(1);
          onNext();
          setTimeout(() => { isScrolling.current = false; }, 400);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, highlights.length, onNext, onPrev]);

  const variants = {
    enter: (direction) => ({
      y: direction > 0 ? '100%' : '-100%',
      opacity: 0.5,
      scale: 0.95
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction) => ({
      y: direction > 0 ? '-100%' : '100%',
      opacity: 0.5,
      scale: 0.95
    })
  };

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen flex flex-col bg-[#0a0a0a] relative overflow-hidden"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Floating header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-30 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={onSettings}
          className="p-2 rounded-full hover:bg-white/10 transition"
          aria-label="Settings"
        >
          <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="text-white/70 text-sm font-medium">
          {currentIndex + 1} / {totalCount}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onLibrary}
            className="p-2 rounded-full hover:bg-white/10 transition"
            aria-label="Library"
          >
            <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </button>
          <button
            onClick={onShuffle}
            className="p-2 rounded-full hover:bg-white/10 transition"
            aria-label="Shuffle"
          >
            <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {user && (
            <button
              onClick={onBooksHistory}
              className="p-1 rounded-full hover:bg-white/10 transition ml-1"
              aria-label="Your account"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Full-screen card with vertical animation */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={currentHighlight.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 35,
              mass: 0.8
            }}
            className="absolute inset-0"
          >
            <SwipeCard highlight={currentHighlight} isTop={true} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Side progress indicator (like TikTok) */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        {/* Up indicator */}
        {currentIndex > 0 && (
          <button
            onClick={() => { setDirection(-1); onPrev(); }}
            className="p-2 rounded-full bg-black/30 text-white/50 hover:text-white hover:bg-black/50 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}

        {/* Down indicator */}
        {currentIndex < highlights.length - 1 && (
          <button
            onClick={() => { setDirection(1); onNext(); }}
            className="p-2 rounded-full bg-black/30 text-white/50 hover:text-white hover:bg-black/50 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Vertical progress bar (left side, like Reels) */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-32 bg-white/10 rounded-full overflow-hidden z-20">
        <motion.div
          className="w-full bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"
          initial={false}
          animate={{ height: `${((currentIndex + 1) / totalCount) * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>

      {/* Scroll hint for first-time users */}
      {currentIndex === 0 && highlights.length > 1 && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-sm flex flex-col items-center gap-2 z-20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
          <span>Scroll for more</span>
        </motion.div>
      )}
    </div>
  );
}
