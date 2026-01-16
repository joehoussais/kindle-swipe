import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useHighlights, SOURCE_TYPES } from './hooks/useHighlights';
import { useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { DropZone } from './components/DropZone';
import { SwipeDeck } from './components/SwipeDeck';
import { SettingsPanel } from './components/SettingsPanel';
import { LibraryPanel } from './components/LibraryPanel';
import { BooksHistory } from './components/BooksHistory';
import { ChallengeMode } from './components/ChallengeMode';
import { ShareModal } from './components/ShareModal';

function AppContent() {
  const { isAuthenticated, trackBook, logout, user } = useAuth();

  const {
    highlights,
    currentIndex,
    isLoading,
    isSyncing,
    hasHighlights,
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
    getAllTags
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
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeHighlight, setChallengeHighlight] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', source type, or 'tag:tagname'
  const [filteredIndex, setFilteredIndex] = useState(0);

  // Get available tags for filtering
  const availableTags = useMemo(() => getAllTags(), [highlights]);

  // Handle challenge mode
  const handleChallenge = (highlight) => {
    setChallengeHighlight(highlight);
    setShowChallenge(true);
  };

  const handleChallengeComplete = (wasSuccessful) => {
    if (challengeHighlight) {
      recordRecallAttempt(challengeHighlight.id, wasSuccessful);
    }
    setShowChallenge(false);
    setChallengeHighlight(null);
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
  }, [highlights, activeFilter]);

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

  // Show loading state
  if (isLoading) {
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
        {/* User menu button */}
        <button
          onClick={() => setShowBooksHistory(true)}
          className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 transition"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-white/80 text-sm">{user?.name}</span>
        </button>
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
        onChallenge={handleChallenge}
        onRecordView={recordView}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
      />

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
        {showChallenge && challengeHighlight && (
          <ChallengeMode
            highlight={challengeHighlight}
            onComplete={handleChallengeComplete}
            onCancel={() => {
              setShowChallenge(false);
              setChallengeHighlight(null);
            }}
          />
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
