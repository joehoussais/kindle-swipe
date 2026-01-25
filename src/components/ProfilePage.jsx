import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CoinAvatar } from './CoinAvatar';

// Book search modal for adding defining books
function BookSearchModal({ onClose, onSelectBook, existingBooks }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchBooks = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=10`
      );
      const data = await response.json();

      const books = data.docs.map(doc => ({
        id: doc.key,
        title: doc.title,
        author: doc.author_name?.[0] || 'Unknown',
        coverId: doc.cover_i,
        firstPublishYear: doc.first_publish_year
      }));

      setResults(books);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchBooks(query);
    }, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const isBookSelected = (book) => {
    return existingBooks.some(b => b.title === book.title && b.author === book.author);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-[#141414] rounded-2xl border border-[#292524] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#f5f0e8] font-medium">Add a Defining Book</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#292524] transition text-[#78716c]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a book..."
            autoFocus
            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#292524] rounded-xl
                       text-[#f5f0e8] placeholder-[#78716c] text-sm
                       focus:outline-none focus:border-[#d4c4b0]/50 transition"
          />
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isSearching ? (
            <div className="p-8 text-center text-[#78716c]">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-[#1a1a1a]">
              {results.map((book) => {
                const selected = isBookSelected(book);
                return (
                  <button
                    key={book.id}
                    onClick={() => !selected && onSelectBook(book)}
                    disabled={selected}
                    className={`w-full p-4 flex items-center gap-3 text-left transition
                               ${selected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#1a1a1a]'}`}
                  >
                    {/* Cover */}
                    <div className="w-12 h-16 rounded bg-[#1a1a1a] flex-shrink-0 overflow-hidden">
                      {book.coverId ? (
                        <img
                          src={`https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#78716c] text-xs">
                          No cover
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[#f5f0e8] font-medium truncate">{book.title}</p>
                      <p className="text-[#78716c] text-sm truncate">{book.author}</p>
                      {book.firstPublishYear && (
                        <p className="text-[#292524] text-xs">{book.firstPublishYear}</p>
                      )}
                    </div>
                    {selected && (
                      <span className="text-[#d4c4b0] text-xs">Added</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : query.trim() ? (
            <div className="p-8 text-center text-[#78716c]">
              No books found
            </div>
          ) : (
            <div className="p-8 text-center text-[#78716c]">
              Start typing to search
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ProfilePage({ onClose, user, stats, highlights }) {
  const [showBookSearch, setShowBookSearch] = useState(false);
  const [definingBooks, setDefiningBooks] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem(`defining-books-${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Save defining books to localStorage
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`defining-books-${user.id}`, JSON.stringify(definingBooks));
    }
  }, [definingBooks, user?.id]);

  // Calculate reading stats
  const readingStats = useMemo(() => {
    const bookSet = new Set();
    const authorSet = new Set();
    let totalHighlights = 0;

    highlights.forEach(h => {
      if (h.title && h.title !== 'Personal Thoughts' && h.title !== 'Saved Quotes') {
        bookSet.add(h.title);
      }
      if (h.author && h.author !== 'You' && h.author !== 'Unknown') {
        authorSet.add(h.author);
      }
      totalHighlights++;
    });

    return {
      booksRead: bookSet.size,
      authors: authorSet.size,
      highlights: totalHighlights
    };
  }, [highlights]);

  const handleAddBook = (book) => {
    if (definingBooks.length >= 5) return;

    const newBook = {
      id: book.id,
      title: book.title,
      author: book.author,
      coverId: book.coverId
    };

    setDefiningBooks(prev => [...prev, newBook]);
    setShowBookSearch(false);
  };

  const handleRemoveBook = (index) => {
    setDefiningBooks(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start justify-center py-8 px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-2xl bg-[#0a0a0a] rounded-2xl border border-[#292524] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header with back button */}
          <div className="p-4 flex items-center justify-between border-b border-[#ffffff0a]">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#292524] transition text-[#78716c]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#292524] transition text-[#78716c]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Profile Header - Oku inspired */}
          <div className="px-6 pt-6 pb-8">
            <div className="flex items-start justify-between">
              {/* Name and info */}
              <div className="flex-1">
                <h1
                  className="text-3xl font-semibold text-[#f5f0e8] mb-1"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                >
                  {user?.name || 'Reader'}
                </h1>
                {user?.email && (
                  <p className="text-[#78716c] text-sm">{user.email}</p>
                )}
              </div>

              {/* Profile Picture - Circular, Oku-inspired */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-[#141414] border-2 border-[#292524] overflow-hidden flex items-center justify-center">
                  <CoinAvatar type={user?.avatar || 'augustus'} size={88} />
                </div>
                {/* Online indicator / badge */}
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#17bf63] border-2 border-[#0a0a0a] flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Stats Row - Oku-style tabs */}
            <div className="mt-8 flex gap-8 border-b border-[#ffffff0a] pb-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-[#f5f0e8]">{readingStats.booksRead}</div>
                <div className="text-sm text-[#78716c]">Books</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-[#f5f0e8]">{readingStats.authors}</div>
                <div className="text-sm text-[#78716c]">Authors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-[#f5f0e8]">{readingStats.highlights}</div>
                <div className="text-sm text-[#78716c]">Highlights</div>
              </div>
            </div>
          </div>

          {/* 5 Books That Define Me Section */}
          <div className="px-6 pb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  className="text-lg font-medium text-[#f5f0e8]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  5 Books That Define Me
                </h2>
                <p className="text-[#78716c] text-sm mt-0.5">
                  Your literary fingerprint
                </p>
              </div>
              {definingBooks.length < 5 && (
                <button
                  onClick={() => setShowBookSearch(true)}
                  className="px-4 py-2 rounded-full bg-[#292524] hover:bg-[#ffffff1a]
                             text-[#f5f0e8] text-sm font-medium transition
                             flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Book
                </button>
              )}
            </div>

            {/* Book Grid */}
            <div className="grid grid-cols-5 gap-3">
              {/* Existing books */}
              {definingBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative"
                >
                  <div className="aspect-[2/3] rounded-lg bg-[#141414] border border-[#292524] overflow-hidden">
                    {book.coverId ? (
                      <img
                        src={`https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2 text-center">
                        <span className="text-[#78716c] text-xs leading-tight">{book.title}</span>
                      </div>
                    )}
                  </div>
                  {/* Remove button on hover */}
                  <button
                    onClick={() => handleRemoveBook(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#e0245e]
                               text-white opacity-0 group-hover:opacity-100 transition
                               flex items-center justify-center shadow-lg"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {/* Title tooltip */}
                  <p className="text-[#78716c] text-xs mt-2 truncate text-center">{book.title}</p>
                </motion.div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: 5 - definingBooks.length }).map((_, index) => (
                <button
                  key={`empty-${index}`}
                  onClick={() => setShowBookSearch(true)}
                  className="aspect-[2/3] rounded-lg border-2 border-dashed border-[#292524]
                             hover:border-[#ffffff2a] hover:bg-[#ffffff05] transition
                             flex items-center justify-center group"
                >
                  <svg
                    className="w-6 h-6 text-[#78716c] group-hover:text-[#a8a29e] transition"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ))}
            </div>

            {definingBooks.length === 0 && (
              <p className="text-center text-[#292524] text-sm mt-4 italic">
                Choose 5 books that shaped who you are
              </p>
            )}
          </div>

          {/* Reading Taste Section */}
          {stats?.bookCounts?.length > 0 && (
            <div className="px-6 pb-8 border-t border-[#ffffff0a] pt-6">
              <h2
                className="text-lg font-medium text-[#f5f0e8] mb-4"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Most Highlighted
              </h2>
              <div className="space-y-2">
                {stats.bookCounts.slice(0, 5).map((book, index) => (
                  <div
                    key={book.title}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#141414]/50 hover:bg-[#141414] transition"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#292524] flex items-center justify-center text-[#78716c] text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#f5f0e8] text-sm truncate">{book.title}</p>
                      <p className="text-[#78716c] text-xs">{book.count} passages</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 pb-6 text-center">
            <p className="text-[#292524] text-xs italic">
              Highlight · Your Reading Journey
            </p>
          </div>
        </motion.div>
      </div>

      {/* Book Search Modal */}
      <AnimatePresence>
        {showBookSearch && (
          <BookSearchModal
            onClose={() => setShowBookSearch(false)}
            onSelectBook={handleAddBook}
            existingBooks={definingBooks}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
