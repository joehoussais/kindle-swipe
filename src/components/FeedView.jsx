import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBookCover, getCachedCover } from '../utils/bookCovers';
import { getSourceLabel, formatTimestamp, SOURCE_TYPES } from '../hooks/useHighlights';

// Format relative time like Twitter
function getRelativeTime(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Get source icon for feed
function getSourceIcon(source) {
  switch (source) {
    case SOURCE_TYPES.KINDLE:
      return '📖';
    case SOURCE_TYPES.JOURNAL:
      return '✍️';
    case SOURCE_TYPES.VOICE:
      return '🎙️';
    case SOURCE_TYPES.THOUGHT:
      return '💭';
    case SOURCE_TYPES.QUOTE:
      return '💬';
    case SOURCE_TYPES.TWEET:
      return '𝕏';
    default:
      return '📚';
  }
}

// Individual feed card component
function FeedCard({ highlight, index, onGoToSwipe, onDelete, onAddNote, onTagClick }) {
  const [cover, setCover] = useState(() => getCachedCover(highlight.title, highlight.author));
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isPersonalEntry = highlight.source === SOURCE_TYPES.THOUGHT ||
                          highlight.source === SOURCE_TYPES.VOICE ||
                          highlight.source === SOURCE_TYPES.JOURNAL;

  // Fetch cover
  useEffect(() => {
    if (!isPersonalEntry && !cover) {
      getBookCover(highlight.title, highlight.author).then(setCover);
    }
  }, [highlight.title, highlight.author, isPersonalEntry, cover]);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(highlight.id);
    }, 200);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDeleting ? 0 : 1, y: isDeleting ? -20 : 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white border-b border-[#e1e8ed] hover:bg-[#f7f9fa] transition-colors cursor-pointer"
      onClick={() => onGoToSwipe(index)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-3 p-4">
        {/* Left: Cover or Icon */}
        <div className="flex-shrink-0">
          {isPersonalEntry ? (
            <div className="w-10 h-14 rounded bg-gradient-to-br from-[#e1e8ed] to-[#ccd6dd] flex items-center justify-center text-xl">
              {getSourceIcon(highlight.source)}
            </div>
          ) : cover ? (
            <img
              src={cover}
              alt={highlight.title}
              className="w-10 h-14 rounded object-cover shadow-sm"
            />
          ) : (
            <div className="w-10 h-14 rounded bg-gradient-to-br from-[#e1e8ed] to-[#ccd6dd] flex items-center justify-center">
              <span className="text-[#657786] text-lg">📖</span>
            </div>
          )}
        </div>

        {/* Right: Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[#14171a] text-sm truncate">
              {highlight.title || 'Untitled'}
            </span>
            {highlight.author && highlight.author !== 'You' && highlight.author !== 'Unknown' && (
              <>
                <span className="text-[#657786] text-sm">·</span>
                <span className="text-[#657786] text-sm truncate">
                  {highlight.author}
                </span>
              </>
            )}
            <span className="text-[#657786] text-sm">·</span>
            <span className="text-[#657786] text-sm flex-shrink-0">
              {getRelativeTime(highlight.capturedAt || highlight.dateHighlighted)}
            </span>
          </div>

          {/* Quote text */}
          <p
            className="text-[#14171a] leading-relaxed"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            "{highlight.text}"
          </p>

          {/* Comment if exists */}
          {highlight.comment && (
            <div className="mt-2 pl-3 border-l-2 border-[#1da1f2]">
              <p className="text-[#657786] text-sm italic">
                {highlight.comment}
              </p>
            </div>
          )}

          {/* Tags */}
          {highlight.tags && highlight.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {highlight.tags.slice(0, 3).map(tag => (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick?.(tag);
                  }}
                  className="px-2 py-0.5 bg-[#e8f4fd] text-[#1da1f2] text-xs rounded-full hover:bg-[#cce4f7] transition"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-6 mt-3">
            {/* View count */}
            <button
              className="flex items-center gap-1.5 text-[#657786] hover:text-[#1da1f2] transition group"
              onClick={(e) => {
                e.stopPropagation();
                onGoToSwipe(index);
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-xs">{highlight.viewCount || 0}</span>
            </button>

            {/* Comment */}
            <button
              className="flex items-center gap-1.5 text-[#657786] hover:text-[#1da1f2] transition"
              onClick={(e) => {
                e.stopPropagation();
                onAddNote(highlight.id);
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs">{highlight.comment ? 1 : 0}</span>
            </button>

            {/* Share */}
            <button
              className="flex items-center gap-1.5 text-[#657786] hover:text-[#17bf63] transition"
              onClick={(e) => {
                e.stopPropagation();
                // Share functionality
                if (navigator.share) {
                  navigator.share({
                    title: highlight.title,
                    text: `"${highlight.text}" — ${highlight.author || 'Unknown'}`,
                  });
                }
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>

            {/* Delete - shows on hover */}
            <AnimatePresence>
              {showActions && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 text-[#657786] hover:text-[#e0245e] transition ml-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function FeedView({
  highlights,
  onGoToSwipe,
  onDelete,
  onAddNote,
  onExitFeed,
  isPreviewMode,
  onSignUp
}) {
  const scrollContainerRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  // Extract all unique tags, authors, and books for suggestions
  const suggestions = useMemo(() => {
    const tags = new Set();
    const authors = new Set();
    const books = new Set();

    highlights.forEach(h => {
      // Custom tags
      if (h.tags) {
        h.tags.forEach(tag => tags.add(tag));
      }
      // Authors
      if (h.author && h.author !== 'You' && h.author !== 'Unknown') {
        authors.add(h.author);
      }
      // Books/titles
      if (h.title && h.title !== 'Personal Thoughts' && h.title !== 'Saved Quotes') {
        books.add(h.title);
      }
    });

    return {
      tags: Array.from(tags).slice(0, 10),
      authors: Array.from(authors).slice(0, 10),
      books: Array.from(books).slice(0, 10)
    };
  }, [highlights]);

  // Filter highlights based on search query
  const filteredHighlights = useMemo(() => {
    if (!searchQuery.trim()) return highlights;

    const query = searchQuery.toLowerCase().trim();

    return highlights.filter(h => {
      // Search in text
      if (h.text?.toLowerCase().includes(query)) return true;
      // Search in title
      if (h.title?.toLowerCase().includes(query)) return true;
      // Search in author
      if (h.author?.toLowerCase().includes(query)) return true;
      // Search in tags
      if (h.tags?.some(tag => tag.toLowerCase().includes(query))) return true;
      // Search in comment
      if (h.comment?.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [highlights, searchQuery]);

  // Get matching suggestions for dropdown
  const matchingSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return { tags: [], authors: [], books: [] };

    const query = searchQuery.toLowerCase().trim();

    return {
      tags: suggestions.tags.filter(t => t.toLowerCase().includes(query)).slice(0, 5),
      authors: suggestions.authors.filter(a => a.toLowerCase().includes(query)).slice(0, 5),
      books: suggestions.books.filter(b => b.toLowerCase().includes(query)).slice(0, 5)
    };
  }, [searchQuery, suggestions]);

  const hasMatchingSuggestions = matchingSuggestions.tags.length > 0 ||
                                  matchingSuggestions.authors.length > 0 ||
                                  matchingSuggestions.books.length > 0;

  // Handle scroll for scroll-to-top button
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setShowScrollTop(scrollContainerRef.current.scrollTop > 500);
    }
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSuggestionClick = (value) => {
    setSearchQuery(value);
    setShowSuggestions(false);
    searchInputRef.current?.blur();
  };

  return (
    <div className="h-screen w-screen bg-[#ffffff] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#e1e8ed]">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          {/* Back to swipe */}
          <button
            onClick={onExitFeed}
            className="flex items-center gap-2 text-[#1da1f2] hover:text-[#1a91da] transition flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium hidden sm:inline">Cards</span>
          </button>

          {/* Search bar */}
          <div className="flex-1 max-w-md mx-4 relative">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#657786]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search highlights, tags, authors..."
                className="w-full pl-10 pr-8 py-2 bg-[#e8f4fd] border border-transparent rounded-full text-sm text-[#14171a] placeholder-[#657786] focus:outline-none focus:border-[#1da1f2] focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#657786] hover:text-[#14171a]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Suggestions dropdown */}
            <AnimatePresence>
              {showSuggestions && hasMatchingSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-[#e1e8ed] overflow-hidden z-30"
                >
                  {matchingSuggestions.tags.length > 0 && (
                    <div className="p-2">
                      <p className="text-xs text-[#657786] uppercase tracking-wider px-2 mb-1">Tags</p>
                      {matchingSuggestions.tags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleSuggestionClick(tag)}
                          className="w-full text-left px-2 py-1.5 text-sm text-[#14171a] hover:bg-[#e8f4fd] rounded flex items-center gap-2"
                        >
                          <span className="text-[#1da1f2]">#</span>
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                  {matchingSuggestions.authors.length > 0 && (
                    <div className="p-2 border-t border-[#e1e8ed]">
                      <p className="text-xs text-[#657786] uppercase tracking-wider px-2 mb-1">Authors</p>
                      {matchingSuggestions.authors.map(author => (
                        <button
                          key={author}
                          onClick={() => handleSuggestionClick(author)}
                          className="w-full text-left px-2 py-1.5 text-sm text-[#14171a] hover:bg-[#e8f4fd] rounded flex items-center gap-2"
                        >
                          <span className="text-[#657786]">👤</span>
                          {author}
                        </button>
                      ))}
                    </div>
                  )}
                  {matchingSuggestions.books.length > 0 && (
                    <div className="p-2 border-t border-[#e1e8ed]">
                      <p className="text-xs text-[#657786] uppercase tracking-wider px-2 mb-1">Books</p>
                      {matchingSuggestions.books.map(book => (
                        <button
                          key={book}
                          onClick={() => handleSuggestionClick(book)}
                          className="w-full text-left px-2 py-1.5 text-sm text-[#14171a] hover:bg-[#e8f4fd] rounded truncate flex items-center gap-2"
                        >
                          <span className="text-[#657786]">📖</span>
                          <span className="truncate">{book}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sign up or placeholder */}
          {isPreviewMode ? (
            <button
              onClick={onSignUp}
              className="px-3 py-1.5 bg-[#1da1f2] text-white text-sm font-semibold rounded-full hover:bg-[#1a91da] transition flex-shrink-0"
            >
              Sign up
            </button>
          ) : (
            <div className="w-8 flex-shrink-0" /> // Spacer
          )}
        </div>
      </header>

      {/* Feed content */}
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-2xl mx-auto">
          {/* Search results count */}
          {searchQuery && (
            <div className="px-4 py-3 border-b border-[#e1e8ed] bg-[#f7f9fa]">
              <p className="text-sm text-[#657786]">
                {filteredHighlights.length === 0 ? (
                  <>No results for "<span className="text-[#14171a] font-medium">{searchQuery}</span>"</>
                ) : (
                  <>{filteredHighlights.length} result{filteredHighlights.length !== 1 ? 's' : ''} for "<span className="text-[#14171a] font-medium">{searchQuery}</span>"</>
                )}
              </p>
            </div>
          )}

          {filteredHighlights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              {searchQuery ? (
                <>
                  <span className="text-4xl mb-4">🔍</span>
                  <p className="text-[#657786] text-lg">No matches found</p>
                  <p className="text-[#657786] text-sm mt-2">
                    Try a different search term
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-2 bg-[#1da1f2] text-white text-sm rounded-full hover:bg-[#1a91da] transition"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <span className="text-4xl mb-4">📚</span>
                  <p className="text-[#657786] text-lg">No highlights yet</p>
                  <p className="text-[#657786] text-sm mt-2">
                    Import your Kindle highlights to get started
                  </p>
                </>
              )}
            </div>
          ) : (
            filteredHighlights.map((highlight, index) => (
              <FeedCard
                key={highlight.id}
                highlight={highlight}
                index={index}
                onGoToSwipe={(idx) => {
                  // Find the original index in the full highlights array
                  const originalIndex = highlights.findIndex(h => h.id === filteredHighlights[idx].id);
                  onGoToSwipe(originalIndex);
                }}
                onDelete={onDelete}
                onAddNote={onAddNote}
                onTagClick={(tag) => setSearchQuery(tag)}
              />
            ))
          )}
        </div>
      </main>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 w-12 h-12 bg-[#1da1f2] text-white rounded-full shadow-lg hover:bg-[#1a91da] transition flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
