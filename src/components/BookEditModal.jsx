import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchBooks, debounce } from '../utils/bookSearch';
import { clearCoverCache } from '../utils/bookCovers';

export function BookEditModal({ book, onClose, onSave }) {
  // Form state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTitle, setManualTitle] = useState(book?.title || '');
  const [manualAuthor, setManualAuthor] = useState(book?.author || '');
  const [isSaving, setIsSaving] = useState(false);

  const searchInputRef = useRef(null);

  // Auto-focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Pre-populate search with current title
  useEffect(() => {
    if (book?.title) {
      // Clean up the title for better search results
      const cleanedTitle = book.title
        .split(':')[0]  // Remove subtitle after colon
        .split('(')[0]  // Remove parenthetical info
        .trim();
      setSearchQuery(cleanedTitle);
      // Trigger initial search
      debouncedSearch(cleanedTitle);
    }
  }, [book?.title]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (query.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      const results = await searchBooks(query, 8); // Get more results for better matching
      setSearchResults(results);
      setIsSearching(false);
    }, 300),
    []
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedBook(null);
    if (query.length >= 2) {
      setIsSearching(true);
    }
    debouncedSearch(query);
  };

  // Select a book from results
  const handleSelectBook = (selectedBookResult) => {
    setSelectedBook(selectedBookResult);
    setSearchQuery(selectedBookResult.title);
    setSearchResults([]);
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);

    let newTitle, newAuthor;

    if (showManualEntry) {
      newTitle = manualTitle.trim();
      newAuthor = manualAuthor.trim() || 'Unknown';
    } else if (selectedBook) {
      newTitle = selectedBook.title;
      newAuthor = selectedBook.author;
    } else {
      // No change
      setIsSaving(false);
      onClose();
      return;
    }

    // Clear cover cache for old title so new cover can be fetched
    // The cache key format is `${title}|${author}`
    clearCoverCache();

    await onSave(book.title, newTitle, newAuthor);
    setIsSaving(false);
    onClose();
  };

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const hasChanges = showManualEntry
    ? (manualTitle.trim() !== book?.title || manualAuthor.trim() !== book?.author)
    : selectedBook !== null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg max-h-[90vh] bg-[#151515] rounded-3xl overflow-hidden border border-[#2a2a2a] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit Book</h2>
            <p className="text-sm text-[#666] mt-0.5">Fix the title and link to the correct book</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition text-[#888]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current book info */}
        <div className="px-6 py-4 bg-[#1a1a1a] border-b border-[#1a1a1a]">
          <p className="text-xs text-[#666] uppercase tracking-wider mb-2">Current</p>
          <p className="text-white font-medium truncate">{book?.title}</p>
          <p className="text-[#888] text-sm truncate">{book?.author}</p>
          <p className="text-[#555] text-xs mt-1">{book?.highlights?.length || 0} passages</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!showManualEntry ? (
            <>
              {/* Search input */}
              <div>
                <label className="block text-xs text-[#666] uppercase tracking-wider mb-2 font-medium">
                  Find the correct book
                </label>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search by title or author..."
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 pl-10 text-white placeholder-[#555] focus:outline-none focus:border-[#444] focus:ring-1 focus:ring-[#444]"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <svg className="w-5 h-5 text-[#555]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected book display */}
              {selectedBook && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-[#1f3a1f] border border-[#2d5a2d] rounded-xl"
                >
                  <p className="text-xs text-green-400 uppercase tracking-wider mb-2 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Selected
                  </p>
                  <div className="flex items-center gap-3">
                    {selectedBook.coverUrl ? (
                      <img
                        src={selectedBook.coverUrl}
                        alt=""
                        className="w-12 h-16 object-cover rounded-lg"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-12 h-16 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{selectedBook.title}</p>
                      <p className="text-[#888] text-sm">{selectedBook.author}</p>
                      {selectedBook.year && (
                        <p className="text-[#555] text-xs mt-0.5">{selectedBook.year}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBook(null);
                        setTimeout(() => searchInputRef.current?.focus(), 100);
                      }}
                      className="p-2 rounded-full hover:bg-white/10 text-[#666]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Search results dropdown */}
              <AnimatePresence>
                {searchResults.length > 0 && !selectedBook && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden max-h-72 overflow-y-auto"
                  >
                    {searchResults.map((bookResult) => (
                      <button
                        key={bookResult.id}
                        onClick={() => handleSelectBook(bookResult)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-[#1a1a1a] transition text-left border-b border-[#222] last:border-b-0"
                      >
                        {bookResult.coverUrl ? (
                          <img
                            src={bookResult.coverUrl}
                            alt=""
                            className="w-10 h-14 object-cover rounded"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-10 h-14 bg-[#1a1a1a] rounded flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{bookResult.title}</p>
                          <p className="text-[#888] text-sm truncate">{bookResult.author}</p>
                          {bookResult.year && (
                            <p className="text-[#555] text-xs">{bookResult.year}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* No results message */}
              {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && !selectedBook && (
                <p className="text-[#666] text-sm">No books found</p>
              )}

              {/* Manual entry toggle */}
              <button
                onClick={() => setShowManualEntry(true)}
                className="text-sm text-[#888] hover:text-white transition flex items-center gap-1"
              >
                <span>Can't find it?</span>
                <span className="text-[#666]">Enter manually</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          ) : (
            /* Manual entry mode */
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#666] uppercase tracking-wider mb-2 font-medium">
                  Book Title
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Book title"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#444] focus:ring-1 focus:ring-[#444]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-[#666] uppercase tracking-wider mb-2 font-medium">
                  Author
                </label>
                <input
                  type="text"
                  value={manualAuthor}
                  onChange={(e) => setManualAuthor(e.target.value)}
                  placeholder="Author name"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#444] focus:ring-1 focus:ring-[#444]"
                />
              </div>
              <button
                onClick={() => {
                  setShowManualEntry(false);
                  setManualTitle(book?.title || '');
                  setManualAuthor(book?.author || '');
                }}
                className="text-sm text-[#888] hover:text-white transition flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to search</span>
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-[#1a1a1a] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 px-4 rounded-xl bg-[#1a1a1a] hover:bg-[#303030] transition text-white font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex-1 py-3.5 px-4 rounded-xl bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-black font-semibold text-sm flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </motion.div>
            ) : (
              <>
                Save Changes
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
