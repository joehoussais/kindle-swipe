import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBookCover, getCachedCover, getColorForTitle } from '../utils/bookCovers';
import { SOURCE_TYPES } from '../hooks/useHighlights';

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
    { bg: '#252525', accent: '#2383e2', icon: '◇' }, // Charcoal & bronze
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

// Book cover component
function BookCoverImage({ title, author, source, size = 'medium' }) {
  const [cover, setCover] = useState(() => getCachedCover(title, author));
  const [loaded, setLoaded] = useState(false);

  const isPersonal = source === SOURCE_TYPES.JOURNAL ||
                     source === SOURCE_TYPES.THOUGHT ||
                     source === SOURCE_TYPES.VOICE;

  useEffect(() => {
    if (!isPersonal) {
      getBookCover(title, author).then(setCover);
    }
  }, [title, author, isPersonal]);

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

  if (cover) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-[#252525]`}
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
      >
        <img
          src={cover}
          alt={title}
          className="w-full h-full object-cover"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
          onLoad={() => setLoaded(true)}
        />
      </div>
    );
  }

  // Color fallback for books without covers
  const { r, g, b } = getColorForTitle(title);
  return (
    <div
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

export function LibraryPanel({ highlights, onClose, onDelete, onEdit, onGoToHighlight, onAddComment }) {
  const [selectedBook, setSelectedBook] = useState(null);
  const [editingHighlight, setEditingHighlight] = useState(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('gallery'); // 'list' or 'gallery'
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
      className="fixed inset-0 z-50 bg-[#0a0a0a]/98 backdrop-blur-sm overflow-hidden"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-[#252525]">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xl font-semibold text-[#ffffffeb]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {selectedBook ? selectedBook.title : 'Your Library'}
            </h2>
            <div className="flex items-center gap-2">
              {/* View toggle - only show when not in book detail */}
              {!selectedBook && (
                <div className="flex rounded-lg overflow-hidden border border-[#ffffff14]">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition ${viewMode === 'list' ? 'bg-[#252525] text-[#2383e2]' : 'text-[#787774] hover:bg-[#252525]/50'}`}
                    title="List view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('gallery')}
                    className={`p-2 transition ${viewMode === 'gallery' ? 'bg-[#252525] text-[#2383e2]' : 'text-[#787774] hover:bg-[#252525]/50'}`}
                    title="Gallery view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  </button>
                </div>
              )}
              <button
                onClick={selectedBook ? () => setSelectedBook(null) : onClose}
                className="p-2 rounded-full hover:bg-[#252525] transition text-[#9b9a97]"
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
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787774]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search passages..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#191919] border border-[#ffffff14]
                         focus:border-[#2383e2] focus:outline-none text-sm text-[#ffffffeb] placeholder-[#787774]"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
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
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4"
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
                        <h3 className="text-xs text-[#ffffffeb] truncate font-medium">
                          {book.title}
                        </h3>
                        <p className="text-[10px] text-[#787774] truncate">
                          {book.highlights.length} passage{book.highlights.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              ) : (
                // List view
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-2"
                >
                  {filteredBooks.map((book) => (
                    <motion.button
                      key={book.title}
                      onClick={() => setSelectedBook(book)}
                      className="w-full p-3 rounded-xl bg-[#191919] hover:bg-[#252525]/50
                                 border border-[#252525] hover:border-[#ffffff14]
                                 transition text-left group"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center gap-4">
                        <BookCoverImage
                          title={book.title}
                          author={book.author}
                          source={book.source}
                          size="small"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#ffffffeb] truncate">
                            {book.title}
                          </h3>
                          <p className="text-sm text-[#9b9a97] truncate">
                            {book.author}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-[#787774]">
                            {book.highlights.length} passage{book.highlights.length !== 1 ? 's' : ''}
                          </span>
                          <svg className="w-4 h-4 text-[#4d4a46] group-hover:text-[#9b9a97] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </motion.button>
                  ))}

                  {filteredBooks.length === 0 && (
                    <div className="text-center text-[#787774] py-12">
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
                className="space-y-3"
              >
                {/* Book header with cover and delete option */}
                <div className="flex items-start gap-4 mb-6 pb-4 border-b border-[#252525]">
                  <BookCoverImage
                    title={selectedBook.title}
                    author={selectedBook.author}
                    source={selectedBook.source}
                    size="large"
                  />
                  <div className="flex-1">
                    <h3
                      className="text-lg text-[#ffffffeb] font-medium"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {selectedBook.title}
                    </h3>
                    <p className="text-sm text-[#9b9a97] mt-1">{selectedBook.author}</p>
                    <p className="text-xs text-[#787774] mt-2">
                      {selectedBook.highlights.length} passage{selectedBook.highlights.length !== 1 ? 's' : ''}
                    </p>
                    <button
                      onClick={() => handleDeleteBook(selectedBook.title)}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20
                                 text-red-400/80 text-sm transition border border-red-500/20"
                    >
                      Delete All
                    </button>
                  </div>
                </div>

                {selectedBook.highlights
                  .filter(h => !searchQuery || h.text.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((highlight, index) => (
                  <motion.div
                    key={highlight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 rounded-xl bg-[#191919] border border-[#252525] group"
                  >
                    {editingHighlight?.id === highlight.id ? (
                      // Edit mode
                      <div className="space-y-3">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full h-32 p-3 rounded-lg bg-[#0a0a0a] border border-[#ffffff14]
                                     focus:border-[#2383e2] focus:outline-none resize-none text-sm text-[#ffffffeb]"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingHighlight(null)}
                            className="flex-1 py-2 rounded-lg bg-[#252525] hover:bg-[#ffffff14] text-sm text-[#ffffffeb] transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="flex-1 py-2 rounded-lg bg-[#2383e2] hover:bg-[#b08c6a] text-sm text-[#191919] font-medium transition"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : commentingHighlight?.id === highlight.id ? (
                      // Comment mode
                      <div className="space-y-3">
                        <p className="text-[#9b9a97] text-sm leading-relaxed mb-2 italic">
                          "{highlight.text.slice(0, 100)}..."
                        </p>
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Add your thoughts about this passage..."
                          className="w-full h-24 p-3 rounded-lg bg-[#0a0a0a] border border-[#ffffff14]
                                     focus:border-[#2383e2] focus:outline-none resize-none text-sm text-[#ffffffeb]
                                     placeholder-[#787774]"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCommentingHighlight(null)}
                            className="flex-1 py-2 rounded-lg bg-[#252525] hover:bg-[#ffffff14] text-sm text-[#ffffffeb] transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveComment}
                            className="flex-1 py-2 rounded-lg bg-[#2383e2] hover:bg-[#b08c6a] text-sm text-[#191919] font-medium transition"
                          >
                            Save Comment
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <>
                        <p className="text-[#ffffffeb]/90 text-sm leading-relaxed mb-2">
                          "{highlight.text}"
                        </p>

                        {/* Show existing comment */}
                        {highlight.comment && (
                          <div className="mt-3 p-3 rounded-lg bg-[#252525]/50 border-l-2 border-[#2383e2]">
                            <p className="text-xs text-[#787774] mb-1">Your note:</p>
                            <p className="text-sm text-[#2383e2] italic">{highlight.comment}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs text-[#787774]">
                            {highlight.location && `Location ${highlight.location}`}
                            {highlight.page && `Page ${highlight.page}`}
                          </p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => {
                                const idx = highlights.findIndex(h => h.id === highlight.id);
                                if (idx !== -1) {
                                  onGoToHighlight(idx);
                                  onClose();
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-[#252525] text-[#787774] hover:text-[#2383e2] transition"
                              title="View in swiper"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleStartComment(highlight)}
                              className="p-1.5 rounded-lg hover:bg-[#252525] text-[#787774] hover:text-[#2383e2] transition"
                              title="Add comment"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleStartEdit(highlight)}
                              className="p-1.5 rounded-lg hover:bg-[#252525] text-[#787774] hover:text-[#2383e2] transition"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(highlight.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#787774] hover:text-red-400 transition"
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
              </motion.div>
            )}
          </AnimatePresence>

          {filteredBooks.length === 0 && !selectedBook && (
            <div className="text-center text-[#787774] py-12">
              No sources found
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className="flex-shrink-0 p-4 border-t border-[#252525] text-center text-xs text-[#787774]">
          {highlights.length} passages from {bookGroups.length} sources
        </div>
      </div>
    </motion.div>
  );
}
