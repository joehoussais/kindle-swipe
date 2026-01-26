import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBookCover, getCachedCover, getColorForTitle } from '../utils/bookCovers';
import { SOURCE_TYPES } from '../hooks/useHighlights';

// Hook for lazy loading with Intersection Observer
function useLazyLoad(ref, options = {}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Stop observing once visible
        }
      },
      { rootMargin: '100px', threshold: 0.1, ...options }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);

  return isVisible;
}

// Generate a deterministic "fun" cover for personal entries
function getPersonalCover(title, source) {
  // Deterministic hash for consistent colors
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash = hash & hash;
  }

  // Imperial/stoic color palettes for personal entries
  const palettes = [
    { bg: '#1a1a1a', accent: '#2d3748', icon: '◇' }, // Charcoal & bronze
    { bg: '#1a2a2a', accent: '#7ab3a2', icon: '◎' }, // Deep teal
    { bg: '#2a1a2a', accent: '#a87ca8', icon: '❧' }, // Plum
    { bg: '#2a2a1a', accent: '#a8a87c', icon: '▣' }, // Olive
    { bg: '#1a1a2a', accent: '#7c8ca8', icon: '◈' }, // Slate blue
    { bg: '#2a1a1a', accent: '#a87c7c', icon: '✦' }, // Rust
  ];

  const palette = palettes[Math.abs(hash) % palettes.length];

  // Different icons based on source type
  let icon = palette.icon;
  if (source === SOURCE_TYPES.JOURNAL) icon = '▣';
  else if (source === SOURCE_TYPES.THOUGHT) icon = '◇';
  else if (source === SOURCE_TYPES.VOICE) icon = '◎';
  else if (source === SOURCE_TYPES.QUOTE) icon = '❧';

  return { ...palette, icon };
}

// Book cover component with lazy loading
function BookCoverImage({ title, author, source, size = 'medium', lazy = true }) {
  const containerRef = useRef(null);
  const isVisible = useLazyLoad(containerRef);

  const [cover, setCover] = useState(() => getCachedCover(title, author));
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [fetchStarted, setFetchStarted] = useState(false);

  const isPersonal = source === SOURCE_TYPES.JOURNAL ||
                     source === SOURCE_TYPES.THOUGHT ||
                     source === SOURCE_TYPES.VOICE;

  // Only fetch cover when visible (lazy loading) or if lazy is disabled
  useEffect(() => {
    if (!isPersonal && (isVisible || !lazy) && !fetchStarted) {
      setFetchStarted(true);
      // Reset states when fetching new cover
      setLoaded(false);
      setError(false);
      getBookCover(title, author).then(setCover);
    }
  }, [title, author, isPersonal, isVisible, lazy, fetchStarted]);

  const sizeClasses = {
    small: 'w-12 h-16',
    medium: 'w-16 h-24',
    large: 'w-24 h-36',
    gallery: 'w-full aspect-[2/3]'
  };

  if (isPersonal) {
    const personalCover = getPersonalCover(title, source);
    return (
      <div
        ref={containerRef}
        className={`${sizeClasses[size]} rounded-lg flex items-center justify-center relative overflow-hidden`}
        style={{
          backgroundColor: personalCover.bg,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, ${personalCover.accent} 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, ${personalCover.accent} 0%, transparent 50%)`
          }}
        />
        {/* Icon */}
        <span
          className="text-2xl relative z-10"
          style={{ color: personalCover.accent }}
        >
          {personalCover.icon}
        </span>
        {/* Title at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 p-1 text-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <span
            className="text-[8px] leading-tight block truncate px-1"
            style={{ color: personalCover.accent, fontFamily: "'Cormorant Garamond', serif" }}
          >
            {title}
          </span>
        </div>
      </div>
    );
  }

  if (cover && !error) {
    return (
      <div
        ref={containerRef}
        className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-[#1a1a1a] relative`}
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
      >
        {/* Show loading placeholder until image loads */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}
        <img
          src={cover}
          alt={title}
          className="w-full h-full object-cover"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      </div>
    );
  }

  // Color fallback for books without covers (or while loading)
  const { r, g, b } = getColorForTitle(title);
  return (
    <div
      ref={containerRef}
      className={`${sizeClasses[size]} rounded-lg flex items-center justify-center p-2`}
      style={{
        backgroundColor: `rgb(${r}, ${g}, ${b})`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}
    >
      <span
        className="text-[10px] text-center text-white/70 line-clamp-3 leading-tight"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        {title}
      </span>
    </div>
  );
}

export function LibraryPanel({ highlights, onClose, onDelete, onEdit, onGoToHighlight, onAddComment, onEditBook }) {
  const [selectedBook, setSelectedBook] = useState(null);
  const [editingHighlight, setEditingHighlight] = useState(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'gallery' - default to list for Twitter feel
  const [commentingHighlight, setCommentingHighlight] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Group highlights by book
  const bookGroups = useMemo(() => {
    const groups = new Map();
    for (const h of highlights) {
      const key = h.title;
      if (!groups.has(key)) {
        groups.set(key, {
          title: h.title,
          author: h.author,
          source: h.source,
          highlights: []
        });
      }
      groups.get(key).highlights.push(h);
    }
    return Array.from(groups.values()).sort((a, b) =>
      b.highlights.length - a.highlights.length
    );
  }, [highlights]);

  // Filter books/highlights by search
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return bookGroups;
    const q = searchQuery.toLowerCase();
    return bookGroups
      .map(book => ({
        ...book,
        highlights: book.highlights.filter(h =>
          h.text.toLowerCase().includes(q) ||
          h.title.toLowerCase().includes(q) ||
          h.author.toLowerCase().includes(q)
        )
      }))
      .filter(book =>
        book.highlights.length > 0 ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q)
      );
  }, [bookGroups, searchQuery]);

  const handleStartEdit = (highlight) => {
    setEditingHighlight(highlight);
    setEditText(highlight.text);
  };

  const handleSaveEdit = () => {
    if (editingHighlight && editText.trim()) {
      onEdit(editingHighlight.id, editText.trim());
      setEditingHighlight(null);
      setEditText('');
    }
  };

  const handleDelete = (id) => {
    if (confirm('Delete this highlight?')) {
      onDelete(id);
    }
  };

  const handleDeleteBook = (bookTitle) => {
    const count = bookGroups.find(b => b.title === bookTitle)?.highlights.length || 0;
    if (confirm(`Delete all ${count} passages from "${bookTitle}"?`)) {
      const idsToDelete = highlights
        .filter(h => h.title === bookTitle)
        .map(h => h.id);
      idsToDelete.forEach(id => onDelete(id));
      setSelectedBook(null);
    }
  };

  const handleStartComment = (highlight) => {
    setCommentingHighlight(highlight);
    setCommentText(highlight.comment || '');
  };

  const handleSaveComment = () => {
    if (commentingHighlight && onAddComment) {
      onAddComment(commentingHighlight.id, commentText.trim());
      setCommentingHighlight(null);
      setCommentText('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-hidden"
    >
      <div className="h-full flex flex-col bg-white max-w-2xl mx-auto shadow-2xl">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-[#e1e8ed] sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={selectedBook ? () => setSelectedBook(null) : onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition text-[#657786]"
              >
                {selectedBook ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
              <h2 className="text-xl font-bold text-[#14171a]">
                {selectedBook ? selectedBook.title : 'Library'}
              </h2>
            </div>
            {/* View toggle - only show when not in book detail */}
            {!selectedBook && (
              <div className="flex rounded-full overflow-hidden border border-[#e1e8ed]">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition ${viewMode === 'list' ? 'bg-[#2d3748] text-white' : 'text-[#657786] hover:bg-gray-100'}`}
                  title="List view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('gallery')}
                  className={`p-2 transition ${viewMode === 'gallery' ? 'bg-[#2d3748] text-white' : 'text-[#657786] hover:bg-gray-100'}`}
                  title="Gallery view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#657786]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search passages..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 border border-transparent
                         focus:border-[#2d3748] focus:bg-white focus:outline-none text-sm text-[#14171a] placeholder-[#657786]"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {!selectedBook ? (
              // Book list/gallery view
              viewMode === 'gallery' ? (
                // Gallery view
                <motion.div
                  key="gallery"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 p-4"
                >
                  {filteredBooks.map((book) => (
                    <motion.button
                      key={book.title}
                      onClick={() => setSelectedBook(book)}
                      className="flex flex-col items-center group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <BookCoverImage
                        title={book.title}
                        author={book.author}
                        source={book.source}
                        size="gallery"
                      />
                      <div className="mt-2 w-full text-center">
                        <h3 className="text-xs text-[#14171a] truncate font-semibold">
                          {book.title}
                        </h3>
                        <p className="text-[10px] text-[#657786] truncate">
                          {book.highlights.length} passage{book.highlights.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              ) : (
                // List view - Twitter-style
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="divide-y divide-[#e1e8ed]"
                >
                  {filteredBooks.map((book) => (
                    <motion.button
                      key={book.title}
                      onClick={() => setSelectedBook(book)}
                      className="w-full p-4 hover:bg-[#f7f9fa] transition text-left group"
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center gap-3">
                        <BookCoverImage
                          title={book.title}
                          author={book.author}
                          source={book.source}
                          size="small"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#14171a] truncate">
                            {book.title}
                          </h3>
                          <p className="text-sm text-[#657786] truncate">
                            {book.author}
                          </p>
                          <p className="text-xs text-[#657786] mt-1">
                            {book.highlights.length} passage{book.highlights.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-[#aab8c2] group-hover:text-[#2d3748] transition flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </motion.button>
                  ))}

                  {filteredBooks.length === 0 && (
                    <div className="text-center text-[#657786] py-12">
                      No sources found
                    </div>
                  )}
                </motion.div>
              )
            ) : (
              // Highlights list for selected book
              <motion.div
                key="highlights"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Book header with cover and delete option */}
                <div className="flex items-start gap-4 p-4 bg-[#f7f9fa] border-b border-[#e1e8ed]">
                  <BookCoverImage
                    title={selectedBook.title}
                    author={selectedBook.author}
                    source={selectedBook.source}
                    size="large"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg text-[#14171a] font-bold">
                      {selectedBook.title}
                    </h3>
                    <p className="text-sm text-[#657786] mt-1">{selectedBook.author}</p>
                    <p className="text-xs text-[#657786] mt-2">
                      {selectedBook.highlights.length} passage{selectedBook.highlights.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => onEditBook && onEditBook(selectedBook)}
                        className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200
                                   text-[#2d3748] text-sm transition border border-gray-300 flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Book
                      </button>
                      <button
                        onClick={() => handleDeleteBook(selectedBook.title)}
                        className="px-3 py-1.5 rounded-full bg-[#ffeef1] hover:bg-[#ffdddf]
                                   text-[#e0245e] text-sm transition border border-[#ffccd5]"
                      >
                        Delete All
                      </button>
                    </div>
                  </div>
                </div>

                {/* Highlights as Twitter-style feed items */}
                <div className="divide-y divide-[#e1e8ed]">
                  {selectedBook.highlights
                    .filter(h => !searchQuery || h.text.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((highlight, index) => (
                    <motion.div
                      key={highlight.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-4 hover:bg-[#f7f9fa] transition group"
                    >
                      {editingHighlight?.id === highlight.id ? (
                        // Edit mode
                        <div className="space-y-3">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full h-32 p-3 rounded-xl bg-white border border-[#e1e8ed]
                                       focus:border-[#2d3748] focus:outline-none resize-none text-sm text-[#14171a]"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingHighlight(null)}
                              className="flex-1 py-2 rounded-full bg-[#f7f9fa] hover:bg-[#e1e8ed] text-sm text-[#14171a] transition border border-[#e1e8ed]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="flex-1 py-2 rounded-full bg-[#2d3748] hover:bg-[#1a202c] text-sm text-white font-bold transition"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : commentingHighlight?.id === highlight.id ? (
                        // Comment mode
                        <div className="space-y-3">
                          <p className="text-[#657786] text-sm leading-relaxed mb-2 italic">
                            "{highlight.text.slice(0, 100)}..."
                          </p>
                          <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add your thoughts about this passage..."
                            className="w-full h-24 p-3 rounded-xl bg-white border border-[#e1e8ed]
                                       focus:border-[#2d3748] focus:outline-none resize-none text-sm text-[#14171a]
                                       placeholder-[#657786]"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setCommentingHighlight(null)}
                              className="flex-1 py-2 rounded-full bg-[#f7f9fa] hover:bg-[#e1e8ed] text-sm text-[#14171a] transition border border-[#e1e8ed]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveComment}
                              className="flex-1 py-2 rounded-full bg-[#2d3748] hover:bg-[#1a202c] text-sm text-white font-bold transition"
                            >
                              Save Comment
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <>
                          <p
                            className="text-[#14171a] leading-relaxed mb-2"
                            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                          >
                            "{highlight.text}"
                          </p>

                          {/* Show existing comment */}
                          {highlight.comment && (
                            <div className="mt-3 pl-3 border-l-2 border-[#2d3748]">
                              <p className="text-sm text-[#657786] italic">{highlight.comment}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            <p className="text-xs text-[#657786]">
                              {highlight.location && `Location ${highlight.location}`}
                              {highlight.page && `Page ${highlight.page}`}
                            </p>
                            <div className="flex gap-4">
                              <button
                                onClick={() => {
                                  const idx = highlights.findIndex(h => h.id === highlight.id);
                                  if (idx !== -1) {
                                    onGoToHighlight(idx);
                                    onClose();
                                  }
                                }}
                                className="text-[#657786] hover:text-[#2d3748] transition"
                                title="View in swiper"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleStartComment(highlight)}
                                className="text-[#657786] hover:text-[#2d3748] transition"
                                title="Add comment"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleStartEdit(highlight)}
                                className="text-[#657786] hover:text-[#2d3748] transition"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(highlight.id)}
                                className="text-[#657786] hover:text-[#e0245e] transition"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {filteredBooks.length === 0 && !selectedBook && (
            <div className="text-center text-[#657786] py-12">
              No sources found
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className="flex-shrink-0 p-4 border-t border-[#e1e8ed] text-center text-xs text-[#657786] bg-white">
          {highlights.length} passages from {bookGroups.length} sources
        </div>
      </div>
    </motion.div>
  );
}
