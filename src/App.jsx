import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useHighlights } from './hooks/useHighlights';
import { useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { DropZone } from './components/DropZone';
import { SwipeDeck } from './components/SwipeDeck';
import { SettingsPanel } from './components/SettingsPanel';
import { LibraryPanel } from './components/LibraryPanel';
import { BooksHistory } from './components/BooksHistory';

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
    loadStarterPack,
    goNext,
    goPrev,
    goTo,
    shuffle,
    clearAll,
    deleteHighlight,
    editHighlight,
    getStats
  } = useHighlights(isAuthenticated ? trackBook : null, user?.id);

  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showBooksHistory, setShowBooksHistory] = useState(false);

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
          onLoadStarterPack={() => {
            const count = loadStarterPack();
            if (count > 0) setShowImport(false);
            return count;
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

  // Main swipe view
  return (
    <>
      <SwipeDeck
        highlights={highlights}
        currentIndex={currentIndex}
        onNext={goNext}
        onPrev={goPrev}
        onShuffle={shuffle}
        onSettings={() => setShowSettings(true)}
        onLibrary={() => setShowLibrary(true)}
        onBooksHistory={() => setShowBooksHistory(true)}
        totalCount={highlights.length}
        user={user}
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
            onLogout={logout}
            stats={getStats()}
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
            onGoToHighlight={(index) => {
              goTo(index);
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

  // Show auth screen if not logged in
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <AppContent />;
}

export default App;
