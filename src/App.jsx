import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useHighlights } from './hooks/useHighlights';
import { DropZone } from './components/DropZone';
import { SwipeDeck } from './components/SwipeDeck';
import { SettingsPanel } from './components/SettingsPanel';
import { LibraryPanel } from './components/LibraryPanel';

function App() {
  const {
    highlights,
    currentIndex,
    isLoading,
    hasHighlights,
    importClippings,
    importAmazonNotebook,
    goNext,
    goPrev,
    goTo,
    shuffle,
    clearAll,
    deleteHighlight,
    editHighlight,
    getStats
  } = useHighlights();

  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

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
        />
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
        totalCount={highlights.length}
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
            stats={getStats()}
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
    </>
  );
}

export default App;
