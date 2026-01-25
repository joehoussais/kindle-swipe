import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchBooks, debounce } from '../utils/bookSearch';

export function QuickAddQuote({ onClose, onAddQuote, onAddAndExport }) {
  // Form state
  const [quoteText, setQuoteText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  // Success state - shows the added quote nicely
  const [addedQuote, setAddedQuote] = useState(null);

  const textareaRef = useRef(null);
  const searchInputRef = useRef(null);

  // Auto-focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (query.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      const results = await searchBooks(query);
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
  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setSearchQuery(book.title);
    setSearchResults([]);
    // Focus the quote textarea after selecting a book
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  // Get final book info (from selection or manual entry)
  const getBookInfo = () => {
    if (showManualEntry) {
      return {
        title: manualTitle.trim() || 'Saved Quotes',
        author: manualAuthor.trim() || 'Unknown'
      };
    }
    if (selectedBook) {
      return {
        title: selectedBook.title,
        author: selectedBook.author
      };
    }
    return {
      title: 'Saved Quotes',
      author: 'Unknown'
    };
  };

  // Handle Add button - shows success state instead of closing
  const handleAdd = async () => {
    if (!quoteText.trim()) return;
    setIsAdding(true);
    const { title, author } = getBookInfo();
    const highlight = onAddQuote(quoteText.trim(), author, title);
    setIsAdding(false);
    // Show success state with the added quote
    setAddedQuote({
      text: quoteText.trim(),
      title,
      author,
      highlight
    });
  };

  // Handle Add & Export button
  const handleAddAndExport = async () => {
    if (!quoteText.trim()) return;
    setIsAdding(true);
    const { title, author } = getBookInfo();
    onAddAndExport(quoteText.trim(), author, title);
    setIsAdding(false);
  };

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const canSubmit = quoteText.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
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
            <h2 className="text-lg font-semibold text-white">Add Quote</h2>
            <p className="text-sm text-[#666] mt-0.5">Save a highlight from any book</p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Success state - show added quote nicely */}
          {addedQuote ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6"
              >
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>

              {/* Quote preview - Kindle style */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full max-w-sm bg-[#fffef7] rounded-lg p-6 shadow-lg border border-[#e8e6dd]"
              >
                <p className="text-[#1a1a1a] text-base leading-relaxed font-serif">
                  {addedQuote.text}
                </p>
                <div className="mt-4 pt-4 border-t border-[#e8e6dd]">
                  <p className="text-[#666] text-sm font-medium">{addedQuote.title}</p>
                  {addedQuote.author && addedQuote.author !== 'Unknown' && (
                    <p className="text-[#888] text-sm">{addedQuote.author}</p>
                  )}
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-[#888] text-sm mt-6"
              >
                Quote added to your library
              </motion.p>
            </div>
          ) : (
          <>
          {/* Book section - FIRST */}
          <div>
            <label className="block text-xs text-[#666] uppercase tracking-wider mb-2 font-medium">
              Book
            </label>

            {!showManualEntry ? (
              <>
                {/* Search input */}
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search for book..."
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

                {/* Selected book display */}
                {selectedBook && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-[#1a1a1a] border border-[#333] rounded-xl flex items-center gap-3"
                  >
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
                      <p className="text-white font-medium truncate">{selectedBook.title}</p>
                      <p className="text-[#888] text-sm truncate">{selectedBook.author}</p>
                      {selectedBook.year && (
                        <p className="text-[#555] text-xs mt-0.5">{selectedBook.year}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBook(null);
                        setSearchQuery('');
                        setTimeout(() => searchInputRef.current?.focus(), 100);
                      }}
                      className="p-2 rounded-full hover:bg-white/10 text-[#666]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.div>
                )}

                {/* Search results dropdown */}
                <AnimatePresence>
                  {searchResults.length > 0 && !selectedBook && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden max-h-60 overflow-y-auto"
                    >
                      {searchResults.map((book) => (
                        <button
                          key={book.id}
                          onClick={() => handleSelectBook(book)}
                          className="w-full p-3 flex items-center gap-3 hover:bg-[#1a1a1a] transition text-left border-b border-[#222] last:border-b-0"
                        >
                          {book.coverUrl ? (
                            <img
                              src={book.coverUrl}
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
                            <p className="text-white font-medium truncate">{book.title}</p>
                            <p className="text-[#888] text-sm truncate">{book.author}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* No results message */}
                {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && !selectedBook && (
                  <p className="mt-2 text-[#666] text-sm">No books found</p>
                )}

                {/* Manual entry toggle */}
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="mt-3 text-sm text-[#888] hover:text-white transition flex items-center gap-1"
                >
                  <span>Can't find your book?</span>
                  <span className="text-[#666]">Enter manually</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            ) : (
              /* Manual entry mode */
              <div className="space-y-3">
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Book title"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#444] focus:ring-1 focus:ring-[#444]"
                  autoFocus
                />
                <input
                  type="text"
                  value={manualAuthor}
                  onChange={(e) => setManualAuthor(e.target.value)}
                  placeholder="Author name"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#444] focus:ring-1 focus:ring-[#444]"
                />
                <button
                  onClick={() => {
                    setShowManualEntry(false);
                    setManualTitle('');
                    setManualAuthor('');
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

          {/* Quote textarea - SECOND */}
          <div>
            <label className="block text-xs text-[#666] uppercase tracking-wider mb-2 font-medium">
              Quote
            </label>
            <textarea
              ref={textareaRef}
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder="Paste or type your quote here..."
              className="w-full h-32 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#444] focus:ring-1 focus:ring-[#444] resize-none text-base leading-relaxed"
            />
          </div>
          </>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-[#1a1a1a] flex gap-3">
          {addedQuote ? (
            /* Success state actions */
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3.5 px-4 rounded-xl bg-[#1a1a1a] hover:bg-[#303030] transition text-white font-medium text-sm"
              >
                Done
              </button>
              <button
                onClick={() => {
                  onAddAndExport(addedQuote.text, addedQuote.author, addedQuote.title);
                }}
                className="flex-1 py-3.5 px-4 rounded-xl bg-white hover:bg-gray-100 transition text-black font-semibold text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Export
              </button>
            </>
          ) : (
            /* Form state actions */
            <>
              <button
                onClick={handleAdd}
                disabled={!canSubmit || isAdding}
                className="flex-1 py-3.5 px-4 rounded-xl bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-black font-semibold text-sm flex items-center justify-center gap-2"
              >
                {isAdding ? (
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
                    Add Quote
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
