import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SwipeCard } from './SwipeCard';
import { SOURCE_TYPES } from '../hooks/useHighlights';

// Filter options with stoic descriptions
const FILTER_OPTIONS = [
  {
    id: 'all',
    label: 'All',
    description: 'Everything you\'ve captured',
    icon: '◉'
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
  onRemoveTag
}) {
  const [direction, setDirection] = useState(0);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isScrolling = useRef(false);

  const currentHighlight = highlights[currentIndex];
  const lastRecordedId = useRef(null);

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
    f.id === 'all' || availableSources?.includes(f.id)
  );

  // Handle wheel scroll (desktop)
  const handleWheel = useCallback((e) => {
    if (isScrolling.current || showFilterMenu) return;

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
  }, [currentIndex, highlights.length, onNext, onPrev, showFilterMenu]);

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

    if (isScrolling.current || showFilterMenu) return;

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
  }, [currentIndex, highlights.length, onNext, onPrev, showFilterMenu]);

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
      if (isScrolling.current || showFilterMenu) return;

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
      } else if (e.key === 'Escape') {
        setShowFilterMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, highlights.length, onNext, onPrev, showFilterMenu]);

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
          <svg className="w-6 h-6 text-[#8a8578]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Filter button - center */}
        <button
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2d2a26]/60 hover:bg-[#2d2a26] border border-[#3d3a36]/50 transition"
        >
          <span className="text-[#c4a882] text-sm">{currentFilter.icon}</span>
          <span className="text-[#ebe6dc] text-sm">{currentFilter.label}</span>
          <svg
            className={`w-3 h-3 text-[#6b5c4c] transition-transform ${showFilterMenu ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={onLibrary}
            className="p-2 rounded-full hover:bg-white/10 transition"
            aria-label="Library"
          >
            <svg className="w-6 h-6 text-[#8a8578]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </button>
          <button
            onClick={onShuffle}
            className="p-2 rounded-full hover:bg-white/10 transition"
            aria-label="Shuffle"
          >
            <svg className="w-6 h-6 text-[#8a8578]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {user && (
            <button
              onClick={onBooksHistory}
              className="p-1 rounded-full hover:bg-white/10 transition ml-1"
              aria-label="Your account"
            >
              <div className="w-7 h-7 rounded-full bg-[#2d2a26] border border-[#4d4a46] flex items-center justify-center text-[#c4a882] text-xs font-medium">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
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
              className="absolute inset-0 z-[35] bg-black/50"
              onClick={() => setShowFilterMenu(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-14 left-1/2 -translate-x-1/2 z-40 w-80 max-h-[70vh] bg-[#1a1916] backdrop-blur-xl rounded-lg border border-[#3d3a36] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-2 overflow-y-auto flex-1">
                {/* Source filters */}
                <p className="text-[#6b5c4c] text-xs uppercase tracking-wider mb-2 px-3 py-1">Filter by source</p>
                {availableFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      onFilterChange(filter.id);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition
                      ${activeFilter === filter.id
                        ? 'bg-[#2d2a26] text-[#ebe6dc]'
                        : 'hover:bg-[#2d2a26]/50 text-[#8a8578] hover:text-[#ebe6dc]'
                      }`}
                  >
                    <span className={`text-lg ${activeFilter === filter.id ? 'text-[#c4a882]' : 'text-[#6b5c4c]'}`}>
                      {filter.icon}
                    </span>
                    <div className="flex-1 text-left">
                      <div className="text-sm">{filter.label}</div>
                      <div className="text-xs text-[#6b5c4c] italic">{filter.description}</div>
                    </div>
                    {activeFilter === filter.id && (
                      <svg className="w-4 h-4 text-[#a08060]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                      </svg>
                    )}
                  </button>
                ))}

                {/* Tag filters */}
                {availableTags.length > 0 && (
                  <>
                    <p className="text-[#6b5c4c] text-xs uppercase tracking-wider mt-4 mb-2 px-3 py-1">Filter by tag</p>
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
                                ? 'bg-[#c4a882] text-[#1a1916]'
                                : isAuthor
                                  ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
                                  : isBook
                                    ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
                                    : 'bg-[#2d2a26] text-[#8a8578] hover:bg-[#3d3a36]'
                              }`}
                          >
                            <span className="truncate max-w-[120px]">{displayTag}</span>
                            <span className={`text-[10px] ${isActive ? 'text-[#1a1916]/60' : 'text-[#6b5c4c]'}`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {availableTags.length > 15 && (
                      <p className="text-[#4d4a46] text-xs text-center italic pb-2">
                        +{availableTags.length - 15} more tags
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Counter */}
              <div className="px-4 py-2.5 bg-[#2d2a26]/50 border-t border-[#3d3a36] flex-shrink-0">
                <p className="text-[#6b5c4c] text-xs text-center">
                  {totalCount} {totalCount === 1 ? 'passage' : 'passages'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
            <SwipeCard
              highlight={currentHighlight}
              isTop={true}
              onDelete={onDelete}
              onAddNote={onAddNote}
              onChallenge={onChallenge}
              onAddTag={onAddTag}
              onRemoveTag={onRemoveTag}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Side progress indicator */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        {/* Up indicator */}
        {currentIndex > 0 && (
          <button
            onClick={() => { setDirection(-1); onPrev(); }}
            className="p-2 rounded-full bg-black/30 text-[#6b5c4c] hover:text-[#c4a882] hover:bg-black/50 transition"
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
            className="p-2 rounded-full bg-black/30 text-[#6b5c4c] hover:text-[#c4a882] hover:bg-black/50 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Vertical progress bar (left side) */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-0.5 h-32 bg-[#2d2a26] rounded-full overflow-hidden z-20">
        <motion.div
          className="w-full bg-gradient-to-b from-[#c4a882] to-[#a08060] rounded-full"
          initial={false}
          animate={{ height: `${((currentIndex + 1) / totalCount) * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>

      {/* Counter at bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-sm border border-[#2d2a26]">
          <span className="text-[#6b5c4c] text-sm">{currentIndex + 1} / {totalCount}</span>
        </div>
      </div>

      {/* Scroll hint for first-time users */}
      {currentIndex === 0 && highlights.length > 1 && !showFilterMenu && (
        <motion.div
          className="absolute bottom-16 left-1/2 -translate-x-1/2 text-[#6b5c4c] text-sm flex flex-col items-center gap-2 z-20"
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
