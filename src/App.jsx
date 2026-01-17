import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useHighlights, SOURCE_TYPES } from './hooks/useHighlights';
import { useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { DropZone } from './components/DropZone';
import { SwipeDeck } from './components/SwipeDeck';
import { SettingsPanel } from './components/SettingsPanel';
import { LibraryPanel } from './components/LibraryPanel';
import { BooksHistory } from './components/BooksHistory';
import { ShareModal } from './components/ShareModal';
import { QuoteExport } from './components/QuoteExport';

function AppContent() {
  const { isAuthenticated, isGuestMode, trackBook, logout, user } = useAuth();

  const {
    highlights,
    currentIndex,
    isLoading,
    isSyncing,
    hasHighlights,
    hasCheckedDb,
    importClippings,
    importAmazonNotebook,
    importJournal,
    importTweets,
    loadStarterPack,
    addThought,
    goNext,
    goPrev,
    goTo,
    shuffle,
    clearAll,
    deleteHighlight,
    editHighlight,
    addComment,
    getStats,
    recordView,
    recordRecallAttempt,
    updateTags,
    getRecallStats,
    getGlobalRecallStats,
    getAllTags,
    getReviewQueueStats,
    getFocusReviewHighlights,
    getOnThisDay
  } = useHighlights(isAuthenticated ? trackBook : null, user?.id);

  // Tag handlers
  const handleAddTag = (id, newTag) => {
    const highlight = highlights.find(h => h.id === id);
    if (highlight) {
      const currentTags = highlight.tags || [];
      if (!currentTags.includes(newTag)) {
        updateTags(id, [...currentTags, newTag]);
      }
    }
  };

  const handleRemoveTag = (id, tagToRemove) => {
    const highlight = highlights.find(h => h.id === id);
    if (highlight) {
      const currentTags = highlight.tags || [];
      updateTags(id, currentTags.filter(t => t !== tagToRemove));
    }
  };

  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showBooksHistory, setShowBooksHistory] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportHighlight, setExportHighlight] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', source type, or 'tag:tagname'
  const [filteredIndex, setFilteredIndex] = useState(0);

  // Get available tags for filtering
  const availableTags = useMemo(() => getAllTags(), [highlights]);

  // Get review queue stats
  const reviewQueueStats = useMemo(() => getReviewQueueStats(), [highlights]);

  // Get focus review highlights
  const focusReviewHighlights = useMemo(() => getFocusReviewHighlights(), [highlights]);

  // State for return prompt
  const [showReturnPrompt, setShowReturnPrompt] = useState(false);
  const [daysSinceVisit, setDaysSinceVisit] = useState(0);

  // State for On This Day
  const [showOnThisDay, setShowOnThisDay] = useState(false);
  const [onThisDayHighlights, setOnThisDayHighlights] = useState([]);

  // Check for returning user and show gentle prompt
  useEffect(() => {
    const LAST_VISIT_KEY = 'highlight-last-visit';
    const DAYS_THRESHOLD = 3;

    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const now = new Date();

    if (lastVisit) {
      const lastDate = new Date(lastVisit);
      const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays >= DAYS_THRESHOLD && reviewQueueStats.fadingCount > 0) {
        setDaysSinceVisit(diffDays);
        setShowReturnPrompt(true);
      }
    }

    // Update last visit
    localStorage.setItem(LAST_VISIT_KEY, now.toISOString());
  }, [reviewQueueStats.fadingCount]);

  // Check for "On This Day" highlights
  useEffect(() => {
    const ON_THIS_DAY_SHOWN_KEY = 'highlight-on-this-day-shown';
    const today = new Date().toDateString();

    // Only show once per day
    const lastShown = localStorage.getItem(ON_THIS_DAY_SHOWN_KEY);
    if (lastShown === today) return;

    const matches = getOnThisDay();
    if (matches.length > 0) {
      setOnThisDayHighlights(matches);
      // Delay showing to not overlap with return prompt
      const timeout = setTimeout(() => {
        if (!showReturnPrompt) {
          setShowOnThisDay(true);
          localStorage.setItem(ON_THIS_DAY_SHOWN_KEY, today);
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [highlights, showReturnPrompt, getOnThisDay]);

  // Auto-load starter pack for guest users who have no highlights
  useEffect(() => {
    if (isGuestMode && hasCheckedDb && !hasHighlights && !isLoading) {
      loadStarterPack();
    }
  }, [isGuestMode, hasCheckedDb, hasHighlights, isLoading, loadStarterPack]);

  // Handle export mode
  const handleExport = (highlight) => {
    setExportHighlight(highlight);
    setShowExport(true);
  };

  // Get unique sources that exist in the data
  // Map legacy source values to current SOURCE_TYPES
  const availableSources = useMemo(() => {
    const sources = new Set();
    highlights.forEach(h => {
      if (h.source) {
        // Map old source values to new ones for filtering
        if (h.source === 'amazon' || h.source === 'clippings') {
          sources.add('kindle');
        } else {
          sources.add(h.source);
        }
      }
    });
    return Array.from(sources);
  }, [highlights]);

  // Filter highlights based on active filter (source or tag)
  const filteredHighlights = useMemo(() => {
    if (activeFilter === 'all') return highlights;

    // Focus review mode - show fading highlights
    if (activeFilter === 'focus-review') {
      return focusReviewHighlights;
    }

    // Tag-based filtering
    if (activeFilter.startsWith('tag:')) {
      const tag = activeFilter.slice(4); // Remove 'tag:' prefix
      return highlights.filter(h => {
        const allTags = [...(h.tags || [])];
        // Also check auto-generated tags
        if (h.source) allTags.push(h.source);
        if (h.author && h.author !== 'You' && h.author !== 'Unknown') {
          allTags.push(`author:${h.author.toLowerCase()}`);
        }
        if (h.title && h.title !== 'Personal Thoughts' && h.title !== 'Saved Quotes') {
          allTags.push(`book:${h.title.toLowerCase().slice(0, 50)}`);
        }
        return allTags.includes(tag);
      });
    }

    // Source-based filtering
    return highlights.filter(h => {
      // Handle legacy source values
      if (activeFilter === 'kindle') {
        return h.source === 'kindle' || h.source === 'amazon' || h.source === 'clippings';
      }
      return h.source === activeFilter;
    });
  }, [highlights, activeFilter, focusReviewHighlights]);

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setActiveFilter(newFilter);
    setFilteredIndex(0); // Reset to first item when changing filter
  };

  // Navigation for filtered view
  const handleNext = () => {
    if (filteredIndex < filteredHighlights.length - 1) {
      setFilteredIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (filteredIndex > 0) {
      setFilteredIndex(prev => prev - 1);
    }
  };

  const handleShuffle = () => {
    shuffle();
    setFilteredIndex(0);
  };

  // Show loading state - also wait for DB check to complete before showing import screen
  if (isLoading || !hasCheckedDb) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-white/50">Loading...</div>
      </div>
    );
  }

  // Show import screen if no highlights or user requested it
  if (!hasHighlights || showImport) {
    return (
      <div className="relative">
        {showImport && hasHighlights && (
          <button
            onClick={() => setShowImport(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {/* User menu button - only show for logged in users */}
        {user && (
          <button
            onClick={() => setShowBooksHistory(true)}
            className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="text-white/80 text-sm">{user.name}</span>
          </button>
        )}
        {/* Guest mode indicator */}
        {isGuestMode && !user && (
          <div className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-xs">
              G
            </div>
            <span className="text-white/50 text-sm">Guest</span>
          </div>
        )}
        <DropZone
          onImportClippings={(content) => {
            const count = importClippings(content);
            if (count > 0) setShowImport(false);
            return count;
          }}
          onImportAmazon={(content) => {
            const count = importAmazonNotebook(content);
            if (count > 0) setShowImport(false);
            return count;
          }}
          onImportJournal={(content, journalName) => {
            const count = importJournal(content, journalName);
            if (count > 0) setShowImport(false);
            return count;
          }}
          onImportTweets={(content) => {
            const count = importTweets(content);
            if (count > 0) setShowImport(false);
            return count;
          }}
          onLoadStarterPack={() => {
            const count = loadStarterPack();
            if (count > 0) setShowImport(false);
            return count;
          }}
          onAddThought={(text) => {
            addThought(text);
            setShowImport(false);
          }}
        />
        <AnimatePresence>
          {showBooksHistory && (
            <BooksHistory onClose={() => setShowBooksHistory(false)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Handle case where filter has no results
  if (filteredHighlights.length === 0) {
    setActiveFilter('all');
    return null;
  }

  // Main swipe view
  return (
    <>
      <SwipeDeck
        highlights={filteredHighlights}
        currentIndex={filteredIndex}
        onNext={handleNext}
        onPrev={handlePrev}
        onShuffle={handleShuffle}
        onSettings={() => setShowSettings(true)}
        onLibrary={() => setShowLibrary(true)}
        onBooksHistory={() => setShowBooksHistory(true)}
        totalCount={filteredHighlights.length}
        user={user}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        availableSources={availableSources}
        availableTags={availableTags}
        onDelete={deleteHighlight}
        onAddNote={addComment}
        onRecordView={recordView}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        onExport={handleExport}
        focusReviewCount={reviewQueueStats.needsAttentionCount}
      />

      {/* On This Day modal */}
      <AnimatePresence>
        {showOnThisDay && onThisDayHighlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowOnThisDay(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-[#191919] rounded-2xl border border-[#ffffff14] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-[#252525] text-center">
                <p className="text-[#787774] text-xs uppercase tracking-widest mb-2">On This Day</p>
                <h2 className="text-[#ffffffeb] text-xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {onThisDayHighlights[0].yearsAgo === 1
                    ? 'A year ago today'
                    : `${onThisDayHighlights[0].yearsAgo} years ago today`}
                </h2>
              </div>

              {/* Content */}
              <div className="p-5 max-h-[60vh] overflow-y-auto">
                {onThisDayHighlights.slice(0, 3).map((h, i) => (
                  <div key={h.id} className={`${i > 0 ? 'mt-4 pt-4 border-t border-[#252525]' : ''}`}>
                    <p
                      className="text-[#ffffffeb] text-lg italic leading-relaxed"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      "{h.text.length > 200 ? h.text.slice(0, 200) + '...' : h.text}"
                    </p>
                    <p className="text-[#787774] text-sm mt-3">
                      — {h.title}
                      {h.author && h.author !== 'You' && h.author !== 'Unknown' && (
                        <span className="text-[#37352f]">, {h.author}</span>
                      )}
                    </p>
                  </div>
                ))}
                {onThisDayHighlights.length > 3 && (
                  <p className="text-[#37352f] text-sm text-center mt-4 italic">
                    +{onThisDayHighlights.length - 3} more from this day
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#252525]">
                <button
                  onClick={() => setShowOnThisDay(false)}
                  className="w-full py-3 px-4 rounded-lg bg-[#2383e2] hover:bg-[#1a73d1] transition text-[#191919] font-medium"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return prompt - gentle reminder for absent users */}
      <AnimatePresence>
        {showReturnPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 z-30 flex justify-center"
          >
            <div className="bg-[#191919]/95 backdrop-blur-xl rounded-2xl border border-[#ffffff14] p-4 max-w-sm shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2383e2]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#2383e2] text-lg">◐</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#ffffffeb] text-sm font-medium" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Some passages have been waiting for you
                  </p>
                  <p className="text-[#787774] text-xs mt-1">
                    {reviewQueueStats.fadingCount} {reviewQueueStats.fadingCount === 1 ? 'highlight is' : 'highlights are'} fading from memory
                  </p>
                </div>
                <button
                  onClick={() => setShowReturnPrompt(false)}
                  className="p-1 rounded-full hover:bg-white/10 transition text-[#787774]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setActiveFilter('focus-review');
                    setFilteredIndex(0);
                    setShowReturnPrompt(false);
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#2383e2] hover:bg-[#1a73d1] transition text-[#191919] text-sm font-medium"
                >
                  Review Now
                </button>
                <button
                  onClick={() => setShowReturnPrompt(false)}
                  className="py-2 px-3 rounded-lg bg-[#252525] hover:bg-[#ffffff14] transition text-[#9b9a97] text-sm"
                >
                  Later
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            onClear={() => {
              clearAll();
              setShowSettings(false);
            }}
            onImportMore={() => {
              setShowImport(true);
              setShowSettings(false);
            }}
            onOpenLibrary={() => {
              setShowLibrary(true);
              setShowSettings(false);
            }}
            onOpenBooksHistory={() => {
              setShowBooksHistory(true);
              setShowSettings(false);
            }}
            onShare={() => setShowShare(true)}
            onLogout={logout}
            stats={getStats()}
            recallStats={getGlobalRecallStats()}
            user={user}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLibrary && (
          <LibraryPanel
            highlights={highlights}
            onClose={() => setShowLibrary(false)}
            onDelete={deleteHighlight}
            onEdit={editHighlight}
            onAddComment={addComment}
            onGoToHighlight={(index) => {
              // Find the highlight in filtered view
              const highlight = highlights[index];
              const filteredIdx = filteredHighlights.findIndex(h => h.id === highlight.id);
              if (filteredIdx !== -1) {
                setFilteredIndex(filteredIdx);
              } else {
                setActiveFilter('all');
                setFilteredIndex(index);
              }
              setShowLibrary(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBooksHistory && (
          <BooksHistory onClose={() => setShowBooksHistory(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShare && (
          <ShareModal
            highlights={highlights}
            onClose={() => setShowShare(false)}
            userName={user?.name}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && exportHighlight && (
          <QuoteExport
            highlight={exportHighlight}
            onClose={() => {
              setShowExport(false);
              setExportHighlight(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-white/50">Loading...</div>
      </div>
    );
  }

  // Show landing page if not logged in
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <AppContent />;
}

export default App;
