import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { SwipeCard } from './SwipeCard';
import { SOURCE_TYPES } from '../hooks/useHighlights';

// Memoized card wrapper to prevent unnecessary re-renders
const MemoizedSwipeCard = memo(SwipeCard);

// Filter options with stoic descriptions
const FILTER_OPTIONS = [
  {
    id: 'all',
    label: 'All',
    description: 'Everything you\'ve captured',
    icon: '◉'
  },
  {
    id: 'focus-review',
    label: 'Focus Review',
    description: 'Revisit fading wisdom',
    icon: '◐',
    special: true
  },
  {
    id: SOURCE_TYPES.KINDLE,
    label: 'Books',
    description: 'The authors that shaped you',
    icon: '◈'
  },
  {
    id: SOURCE_TYPES.TWEET,
    label: 'Tweets',
    description: 'Wisdom from the agora',
    icon: '𝕏'
  },
  {
    id: SOURCE_TYPES.THOUGHT,
    label: 'Thoughts',
    description: 'The author that is you',
    icon: '◇'
  },
  {
    id: SOURCE_TYPES.JOURNAL,
    label: 'Journal',
    description: 'Your story, unfolding',
    icon: '▣'
  },
  {
    id: SOURCE_TYPES.VOICE,
    label: 'Voice',
    description: 'Words you spoke to time',
    icon: '◎'
  },
  {
    id: SOURCE_TYPES.QUOTE,
    label: 'Quotes',
    description: 'Wisdom you collected',
    icon: '❧'
  }
];

export function SwipeDeck({
  highlights,
  currentIndex,
  onNext,
  onPrev,
  onShuffle,
  onSettings,
  onLibrary,
  onBooksHistory,
  onProfile,
  onGoTo,
  totalCount,
  user,
  activeFilter,
  onFilterChange,
  availableSources,
  availableTags = [],
  onDelete,
  onAddNote,
  onChallenge,
  onRecordView,
  onAddTag,
  onRemoveTag,
  onExport,
  focusReviewCount = 0,
  isPreviewMode = false,
  onExitPreview,
  onSignUp,
  viewMode = 'swipe',
  onViewModeChange,
  onImportMore,
  onQuickAdd
}) {
  const [direction, setDirection] = useState(0);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const lastNavigationTime = useRef(0);
  const isAnimating = useRef(false);
  const pendingNavigation = useRef(null);

  // Minimum time between navigation actions (prevents rapid fire issues)
  const NAVIGATION_COOLDOWN = 150; // Reduced for snappier feel
  const ANIMATION_DURATION = 200; // Match this to actual animation time

  // Smooth drag motion values
  const dragY = useMotionValue(0);
  const dragProgress = useTransform(dragY, [-200, 0, 200], [-1, 0, 1]);

  // Parallax effect - background moves slower than content
  const backgroundY = useTransform(dragY, [-200, 0, 200], [-30, 0, 30]);
  const smoothBackgroundY = useSpring(backgroundY, { stiffness: 300, damping: 30 });

  // Card scale/rotation based on drag
  const cardScale = useTransform(dragY, [-200, 0, 200], [0.95, 1, 0.95]);
  const cardOpacity = useTransform(dragY, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);

  // Memoize current highlight to prevent unnecessary re-renders
  const currentHighlight = useMemo(() => highlights[currentIndex], [highlights, currentIndex]);
  const nextHighlight = useMemo(() => highlights[currentIndex + 1] || null, [highlights, currentIndex]);
  const prevHighlight = useMemo(() => highlights[currentIndex - 1] || null, [highlights, currentIndex]);

  const lastRecordedId = useRef(null);

  // Centralized navigation with animation lock
  const navigate = useCallback((dir) => {
    const now = Date.now();

    // If currently animating, queue this navigation and skip
    if (isAnimating.current) {
      pendingNavigation.current = dir;
      return;
    }

    // Cooldown check
    if (now - lastNavigationTime.current < NAVIGATION_COOLDOWN) {
      return;
    }

    // Bounds check
    if (dir > 0 && currentIndex >= highlights.length - 1) return;
    if (dir < 0 && currentIndex <= 0) return;

    // Lock animation
    isAnimating.current = true;
    lastNavigationTime.current = now;
    setDirection(dir);

    // Reset drag position before navigation to prevent stale motion values
    dragY.set(0);

    if (dir > 0) {
      onNext();
    } else {
      onPrev();
    }

    // Unlock after animation completes, check for pending
    setTimeout(() => {
      isAnimating.current = false;
      if (pendingNavigation.current !== null) {
        const pending = pendingNavigation.current;
        pendingNavigation.current = null;
        // Only process if it's in the same direction (user still spamming)
        navigate(pending);
      }
    }, ANIMATION_DURATION);
  }, [currentIndex, highlights.length, onNext, onPrev]);

  // Record view when highlight changes
  useEffect(() => {
    if (currentHighlight && onRecordView && currentHighlight.id !== lastRecordedId.current) {
      lastRecordedId.current = currentHighlight.id;
      onRecordView(currentHighlight.id);
    }
  }, [currentHighlight?.id, onRecordView]);


  // Get current filter info
  const isTagFilter = activeFilter.startsWith('tag:');
  const currentFilter = isTagFilter
    ? {
        id: activeFilter,
        label: activeFilter.startsWith('tag:author:')
          ? activeFilter.slice(11) // Remove 'tag:author:'
          : activeFilter.startsWith('tag:book:')
            ? activeFilter.slice(9) // Remove 'tag:book:'
            : activeFilter.slice(4), // Remove 'tag:'
        icon: '⬡',
        description: 'Filtered by tag'
      }
    : FILTER_OPTIONS.find(f => f.id === activeFilter) || FILTER_OPTIONS[0];

  // Filter options that have content
  const availableFilters = FILTER_OPTIONS.filter(f =>
    f.id === 'all' ||
    (f.id === 'focus-review' && focusReviewCount > 0) ||
    availableSources?.includes(f.id)
  );

  // Handle wheel scroll (desktop)
  const handleWheel = useCallback((e) => {
    if (showFilterMenu) return;

    const threshold = 50;
    if (e.deltaY > threshold) {
      navigate(1);
    } else if (e.deltaY < -threshold) {
      navigate(-1);
    }
  }, [showFilterMenu, navigate]);

  // Handle touch scroll (mobile)
  const touchTargetIsInteractive = useRef(false);

  const handleTouchStart = useCallback((e) => {
    // Check if touch started on an interactive element (link, button)
    const target = e.target;
    touchTargetIsInteractive.current = target.closest('a, button') !== null;

    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback((e) => {
    // If touch started on an interactive element, let it handle the event
    if (touchTargetIsInteractive.current) {
      touchTargetIsInteractive.current = false;
      return;
    }

    if (showFilterMenu) return;

    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;
    const deltaTime = Date.now() - touchStartTime.current;
    const velocity = Math.abs(deltaY) / deltaTime;

    const threshold = 50;
    const velocityThreshold = 0.3;

    if (deltaY > threshold || (velocity > velocityThreshold && deltaY > 0)) {
      // Swiped up - next
      navigate(1);
    } else if (deltaY < -threshold || (velocity > velocityThreshold && deltaY < 0)) {
      // Swiped down - previous
      navigate(-1);
    }
  }, [showFilterMenu, navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore keyboard navigation when typing in input fields
      const activeElement = document.activeElement;
      const tagName = activeElement?.tagName?.toUpperCase();
      const isTyping = tagName === 'INPUT' ||
                       tagName === 'TEXTAREA' ||
                       activeElement?.contentEditable === 'true';

      if (isTyping) return;
      if (showFilterMenu) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        navigate(-1);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        navigate(1);
      } else if (e.key === 'Escape') {
        setShowFilterMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFilterMenu, navigate]);

  // Ultra-smooth TikTok-style variants - minimal travel, instant feel
  const variants = {
    enter: (direction) => ({
      y: direction > 0 ? '15%' : '-15%', // Reduced travel for faster feel
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      y: direction > 0 ? '-10%' : '10%', // Reduced exit travel
      opacity: 0,
      scale: 0.98,
    })
  };

  // Handle drag end with velocity-based navigation
  const handleDragEnd = useCallback((event, info) => {
    setIsDragging(false);
    const { offset, velocity } = info;
    const swipeThreshold = 80;
    const velocityThreshold = 300;

    // Swipe up (next) - drag negative Y
    if (offset.y < -swipeThreshold || velocity.y < -velocityThreshold) {
      navigate(1);
    }
    // Swipe down (prev) - drag positive Y
    else if (offset.y > swipeThreshold || velocity.y > velocityThreshold) {
      navigate(-1);
    }

    // Reset drag position
    dragY.set(0);
  }, [navigate, dragY]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen flex flex-col bg-white relative overflow-hidden"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Floating header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        {isPreviewMode ? (
          <button
            onClick={onExitPreview}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition border border-gray-200"
            aria-label="Back to home"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-gray-600 text-sm">Back</span>
          </button>
        ) : (
          <button
            onClick={onSettings}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            aria-label="Settings"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* View toggle + Filter - center */}
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg border border-gray-200 p-0.5">
            <button
              onClick={() => viewMode !== 'swipe' && onViewModeChange?.('swipe')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                viewMode === 'swipe'
                  ? 'bg-[#2d3748] text-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              aria-label="Card view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>
            <button
              onClick={() => viewMode !== 'feed' && onViewModeChange?.('feed')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                viewMode === 'feed'
                  ? 'bg-[#2d3748] text-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              aria-label="Feed view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 transition"
          >
            <span className="text-gray-600 text-sm">{currentFilter.icon}</span>
            <span className="text-gray-900 text-sm">{currentFilter.label}</span>
            <svg
              className={`w-3 h-3 text-gray-400 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onLibrary}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            aria-label="Library"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </button>
          <button
            onClick={onShuffle}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            aria-label="Shuffle"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {user ? (
            <button
              onClick={onProfile}
              className="p-1 rounded-full hover:bg-gray-100 transition ml-1"
              aria-label="Your profile"
            >
              <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 text-xs font-medium">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>
          ) : isPreviewMode && (
            <button
              onClick={onSignUp}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2d3748] hover:bg-[#1a202c] transition text-white text-sm font-medium ml-1"
              aria-label="Sign up"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              </svg>
              Sign up
            </button>
          )}
        </div>
      </div>

      {/* Filter dropdown menu */}
      <AnimatePresence>
        {showFilterMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[35] bg-black/20"
              onClick={() => setShowFilterMenu(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-14 left-1/2 -translate-x-1/2 z-40 w-80 max-h-[70vh] bg-white backdrop-blur-xl rounded-xl border border-gray-200 overflow-hidden shadow-lucis-xl flex flex-col"
            >
              <div className="p-2 overflow-y-auto flex-1">
                {/* Source filters */}
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 px-3 py-1">Filter by source</p>
                {availableFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      onFilterChange(filter.id);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition
                      ${activeFilter === filter.id
                        ? 'bg-gray-100 text-gray-900'
                        : filter.special
                          ? 'hover:bg-gray-50 text-[#2d3748] hover:text-gray-900'
                          : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <span className={`text-lg ${activeFilter === filter.id ? 'text-[#2d3748]' : filter.special ? 'text-[#2d3748]' : 'text-gray-400'}`}>
                      {filter.icon}
                    </span>
                    <div className="flex-1 text-left">
                      <div className="text-sm flex items-center gap-2">
                        {filter.label}
                        {filter.id === 'focus-review' && focusReviewCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-[#2d3748]/10 text-[#2d3748] rounded">
                            {focusReviewCount}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 italic">{filter.description}</div>
                    </div>
                    {activeFilter === filter.id && (
                      <svg className="w-4 h-4 text-[#2d3748]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                      </svg>
                    )}
                  </button>
                ))}

                {/* Tag filters */}
                {availableTags.length > 0 && (
                  <>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mt-4 mb-2 px-3 py-1">Filter by tag</p>
                    <div className="flex flex-wrap gap-2 px-3 pb-2">
                      {availableTags.slice(0, 15).map(({ tag, count }) => {
                        const isActive = activeFilter === `tag:${tag}`;
                        const isAuthor = tag.startsWith('author:');
                        const isBook = tag.startsWith('book:');
                        const displayTag = isAuthor ? tag.slice(7) : isBook ? tag.slice(5) : tag;

                        return (
                          <button
                            key={tag}
                            onClick={() => {
                              onFilterChange(isActive ? 'all' : `tag:${tag}`);
                              setShowFilterMenu(false);
                            }}
                            className={`px-2.5 py-1.5 rounded-full text-xs transition flex items-center gap-1.5
                              ${isActive
                                ? 'bg-[#2d3748] text-white'
                                : isAuthor
                                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                  : isBook
                                    ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                          >
                            <span className="truncate max-w-[120px]">{displayTag}</span>
                            <span className={`text-[10px] ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {availableTags.length > 15 && (
                      <p className="text-gray-400 text-xs text-center italic pb-2">
                        +{availableTags.length - 15} more tags
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Counter */}
              <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                <p className="text-gray-500 text-xs text-center">
                  {totalCount} {totalCount === 1 ? 'passage' : 'passages'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Full-screen card stack - TikTok/Reels style with pre-rendered cards */}
      <div className="flex-1 relative">
        {/* Pre-render next card underneath for instant transition - only render if exists */}
        {nextHighlight && (
          <div className="absolute inset-0 z-0">
            <MemoizedSwipeCard
              highlight={nextHighlight}
              isTop={false}
              onDelete={onDelete}
              onAddNote={onAddNote}
              onChallenge={onChallenge}
              onAddTag={onAddTag}
              onRemoveTag={onRemoveTag}
              onExport={onExport}
            />
          </div>
        )}

        {/* Pre-render previous card underneath for backwards navigation - only render if exists */}
        {prevHighlight && (
          <div className="absolute inset-0 z-0">
            <MemoizedSwipeCard
              highlight={prevHighlight}
              isTop={false}
              onDelete={onDelete}
              onAddNote={onAddNote}
              onChallenge={onChallenge}
              onAddTag={onAddTag}
              onRemoveTag={onRemoveTag}
              onExport={onExport}
            />
          </div>
        )}

        {/* Current card with smooth crossfade - popLayout mode cleans up exited elements immediately */}
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          {currentHighlight && (
            <motion.div
              key={currentHighlight.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.12}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              style={{
                y: dragY,
                scale: isDragging ? cardScale : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 600,  // Higher = snappier
                damping: 40,     // Higher = less bounce
                mass: 0.3,       // Lower = faster response
                restDelta: 0.01, // Less precision needed for speed
              }}
              className="absolute inset-0 touch-pan-x z-10"
            >
              <MemoizedSwipeCard
                highlight={currentHighlight}
                isTop={true}
                onDelete={onDelete}
                onAddNote={onAddNote}
                onChallenge={onChallenge}
                onAddTag={onAddTag}
                onRemoveTag={onRemoveTag}
                onExport={onExport}
                backgroundY={smoothBackgroundY}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swipe hint indicators */}
        <AnimatePresence>
          {isDragging && (
            <>
              {/* Next hint (swiping up) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: dragY.get() < -30 ? 0.8 : 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
              >
                <div className="px-4 py-2 rounded-full bg-gray-900/10 backdrop-blur-sm border border-gray-200">
                  <span className="text-gray-700 text-sm">Next</span>
                </div>
              </motion.div>

              {/* Prev hint (swiping down) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: dragY.get() > 30 ? 0.8 : 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
              >
                <div className="px-4 py-2 rounded-full bg-gray-900/10 backdrop-blur-sm border border-gray-200">
                  <span className="text-gray-700 text-sm">Previous</span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Side progress indicator */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        {/* Up indicator */}
        {currentIndex > 0 && (
          <button
            onClick={() => { setDirection(-1); onPrev(); }}
            className="p-2 rounded-full bg-white/80 text-gray-400 hover:text-gray-700 hover:bg-white shadow-sm border border-gray-200 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}

        {/* Down indicator */}
        {currentIndex < highlights.length - 1 && (
          <button
            onClick={() => { setDirection(1); onNext(); }}
            className="p-2 rounded-full bg-white/80 text-gray-400 hover:text-gray-700 hover:bg-white shadow-sm border border-gray-200 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Vertical progress bar (left side) */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-0.5 h-32 bg-gray-200 rounded-full overflow-hidden z-20">
        <motion.div
          className="w-full bg-gradient-to-b from-[#2d3748] to-[#2d3748] rounded-full"
          initial={false}
          animate={{ height: `${((currentIndex + 1) / totalCount) * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>

      {/* Counter at bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm">
          <span className="text-gray-500 text-sm">{currentIndex + 1} / {totalCount}</span>
        </div>
      </div>

      {/* Floating Add button - bottom left */}
      {!isPreviewMode && onQuickAdd && (
        <button
          onClick={onQuickAdd}
          className="absolute bottom-4 left-4 z-20 p-3 rounded-full bg-[#2d3748] hover:bg-[#1a202c]
                     shadow-lucis-lg transition-all hover:scale-105 active:scale-95"
          aria-label="Add quote"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Scroll hint for first-time users */}
      {currentIndex === 0 && highlights.length > 1 && !showFilterMenu && (
        <motion.div
          className="absolute bottom-16 left-1/2 -translate-x-1/2 text-gray-500 text-sm flex flex-col items-center gap-2 z-20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
          <span className="italic text-xs">Scroll for more</span>
        </motion.div>
      )}
    </div>
  );
}
