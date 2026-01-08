import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function LibraryPanel({ highlights, onClose, onDelete, onEdit, onGoToHighlight }) {
  const [selectedBook, setSelectedBook] = useState(null);
  const [editingHighlight, setEditingHighlight] = useState(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Group highlights by book
  const bookGroups = useMemo(() => {
    const groups = new Map();
    for (const h of highlights) {
      const key = h.title;
      if (!groups.has(key)) {
        groups.set(key, {
          title: h.title,
          author: h.author,
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
    if (confirm(`Delete all ${count} highlights from "${bookTitle}"?`)) {
      const idsToDelete = highlights
        .filter(h => h.title === bookTitle)
        .map(h => h.id);
      idsToDelete.forEach(id => onDelete(id));
      setSelectedBook(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm overflow-hidden"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {selectedBook ? selectedBook.title : 'Your Library'}
            </h2>
            <button
              onClick={selectedBook ? () => setSelectedBook(null) : onClose}
              className="p-2 rounded-full hover:bg-white/10 transition"
            >
              {selectedBook ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search highlights..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10
                         focus:border-white/30 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {!selectedBook ? (
              // Book list view
              <motion.div
                key="books"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-2"
              >
                {filteredBooks.map((book) => (
                  <motion.button
                    key={book.title}
                    onClick={() => setSelectedBook(book)}
                    className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10
                               border border-white/5 hover:border-white/10
                               transition text-left group"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white/90 truncate">
                          {book.title}
                        </h3>
                        <p className="text-sm text-white/50 truncate">
                          {book.author}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white/40">
                          {book.highlights.length} highlight{book.highlights.length !== 1 ? 's' : ''}
                        </span>
                        <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </motion.button>
                ))}

                {filteredBooks.length === 0 && (
                  <div className="text-center text-white/40 py-12">
                    No books found
                  </div>
                )}
              </motion.div>
            ) : (
              // Highlights list for selected book
              <motion.div
                key="highlights"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                {/* Book header with delete option */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                  <div>
                    <p className="text-sm text-white/50">{selectedBook.author}</p>
                    <p className="text-xs text-white/30 mt-1">
                      {selectedBook.highlights.length} highlight{selectedBook.highlights.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteBook(selectedBook.title)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30
                               text-red-400 text-sm transition"
                  >
                    Delete All
                  </button>
                </div>

                {selectedBook.highlights
                  .filter(h => !searchQuery || h.text.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((highlight, index) => (
                  <motion.div
                    key={highlight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/5 group"
                  >
                    {editingHighlight?.id === highlight.id ? (
                      // Edit mode
                      <div className="space-y-3">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full h-32 p-3 rounded-lg bg-black/50 border border-white/20
                                     focus:border-white/40 focus:outline-none resize-none text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingHighlight(null)}
                            className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm transition"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <>
                        <p className="text-white/80 text-sm leading-relaxed mb-3">
                          "{highlight.text}"
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-white/30">
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
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition"
                              title="View in swiper"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleStartEdit(highlight)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(highlight.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
        </div>

        {/* Footer stats */}
        <div className="flex-shrink-0 p-4 border-t border-white/10 text-center text-xs text-white/30">
          {highlights.length} highlights from {bookGroups.length} books
        </div>
      </div>
    </motion.div>
  );
}
