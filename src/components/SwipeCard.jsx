import { useState, useEffect, useMemo } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { getBookCover, getCachedCover } from '../utils/bookCovers';
import { getAuthorPhoto, getGoodreadsUrl } from '../utils/authorPhotos';
import { getBackgroundForHighlight } from '../utils/backgrounds';
import { getSourceLabel, formatTimestamp, SOURCE_TYPES } from '../hooks/useHighlights';
import { IntegrationBar } from './IntegrationBar';
import { TagPills } from './TagPills';

// Extract first sentence for highlighting
function getFirstSentence(text) {
  const match = text.match(/^[^.!?]+[.!?]/);
  if (match) {
    return match[0];
  }
  return text.length > 100 ? text.slice(0, 100) : text;
}

// Get icon for source type
function getSourceIcon(source) {
  switch (source) {
    case SOURCE_TYPES.KINDLE:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case SOURCE_TYPES.JOURNAL:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case SOURCE_TYPES.VOICE:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      );
    case SOURCE_TYPES.THOUGHT:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case SOURCE_TYPES.QUOTE:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      );
  }
}

export function SwipeCard({ highlight, isTop = false, onDelete, onAddNote, onChallenge, onAddTag, onRemoveTag, onExport, notes = [], backgroundY }) {
  const [cover, setCover] = useState(() => getCachedCover(highlight.title, highlight.author));
  const [imageLoaded, setImageLoaded] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [authorPhoto, setAuthorPhoto] = useState(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const background = getBackgroundForHighlight(highlight.id);

  const { firstSentence, restOfText } = useMemo(() => {
    const first = getFirstSentence(highlight.text);
    const rest = highlight.text.slice(first.length);
    return { firstSentence: first, restOfText: rest };
  }, [highlight.text]);

  // Get the timestamp message
  const timestampMessage = useMemo(() => {
    const source = highlight.source || SOURCE_TYPES.KINDLE;
    const label = getSourceLabel(source);
    const date = formatTimestamp(highlight.capturedAt || highlight.dateHighlighted);

    if (date) {
      return `${label} on ${date}`;
    }
    return label;
  }, [highlight]);

  // Check if this is a personal entry (not from a book)
  const isPersonalEntry = highlight.source === SOURCE_TYPES.THOUGHT ||
                          highlight.source === SOURCE_TYPES.VOICE ||
                          highlight.source === SOURCE_TYPES.JOURNAL;

  useEffect(() => {
    let mounted = true;

    // Only fetch book covers for book-based highlights
    if (!isPersonalEntry) {
      getBookCover(highlight.title, highlight.author).then((result) => {
        if (mounted) setCover(result);
      });

      getAuthorPhoto(highlight.author).then((photo) => {
        if (mounted) setAuthorPhoto(photo);
      });
    }

    const bgImg = new Image();
    bgImg.onload = () => { if (mounted) setBgLoaded(true); };
    bgImg.src = background.src;

    return () => { mounted = false; };
  }, [highlight.title, highlight.author, highlight.id, background.src, isPersonalEntry]);

  useEffect(() => {
    if (cover.type === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageLoaded(true);
      img.src = cover.value;
    }
  }, [cover]);

  const getFontSize = () => {
    const len = highlight.text.length;
    if (len < 80) return 'text-xl md:text-2xl';
    if (len < 150) return 'text-lg md:text-xl';
    if (len < 300) return 'text-base md:text-lg';
    return 'text-sm md:text-base';
  };

  const goodreadsUrl = getGoodreadsUrl(highlight.title, highlight.author);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ willChange: 'transform' }}>
      {/* Background image with parallax effect */}
      <motion.div
        className="absolute transition-opacity duration-700"
        style={{
          // Extend beyond bounds for parallax room
          top: '-5%',
          left: '-2%',
          right: '-2%',
          bottom: '-5%',
          backgroundImage: `url(${background.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: bgLoaded ? 1 : 0,
          y: backgroundY || 0,
          willChange: 'transform',
          transform: 'translateZ(0)' // GPU acceleration
        }}
      />

      {/* Scrim for contrast */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 30%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0.5) 100%)'
        }}
      />

      {/* TOP: Source info - different layout for personal vs book entries */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="absolute top-0 left-0 right-0 p-4 md:p-6 pt-14 md:pt-16"
      >
        {isPersonalEntry ? (
          // Personal entry header (thoughts, voice, journal)
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80">
                {getSourceIcon(highlight.source)}
              </div>
              <div>
                <h3
                  className="font-semibold text-white text-base md:text-lg"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                  }}
                >
                  {highlight.title}
                </h3>
                <p
                  className="text-white/60 text-sm"
                  style={{ textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}
                >
                  {timestampMessage}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Book entry header (kindle highlights, quotes)
          <div className="flex items-start gap-4 max-w-2xl mx-auto">
            {/* Book cover */}
            {cover.type === 'image' && (
              <div
                className="w-16 h-24 md:w-20 md:h-28 rounded-lg overflow-hidden flex-shrink-0"
                style={{ boxShadow: '0 8px 25px rgba(0,0,0,0.4)' }}
              >
                <img
                  src={cover.value}
                  alt={highlight.title}
                  className="w-full h-full object-cover"
                  style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
                />
              </div>
            )}

            {/* Book info */}
            <div className="flex-1 min-w-0 pt-1">
              <h3
                className="font-semibold text-white text-base md:text-lg line-clamp-2 leading-tight"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}
              >
                {highlight.title}
              </h3>

              <div className="flex items-center gap-2 mt-2">
                {authorPhoto && (
                  <img
                    src={authorPhoto}
                    alt={highlight.author}
                    className="w-7 h-7 rounded-full object-cover"
                    style={{ border: '2px solid rgba(255,255,255,0.3)' }}
                  />
                )}
                <p
                  className="text-white/70 text-sm"
                  style={{ textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}
                >
                  {highlight.author}
                </p>

                {/* Goodreads */}
                <a
                  href={goodreadsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors ml-1"
                  title="View on Goodreads"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.43 23.995c-3.608-.208-6.274-2.077-6.448-5.078.695.007 1.375-.013 2.07-.006.224 1.342 1.065 2.43 2.683 3.026 1.558.496 3.085.31 4.354-.763.949-.726 1.427-1.796 1.427-3.612V15.87c-.975 1.09-2.574 1.725-4.514 1.725-4.292 0-6.549-3.168-6.549-7.108 0-4.004 2.456-7.242 6.665-7.242 1.913 0 3.392.65 4.398 1.888V3.705h1.963v13.263c0 2.595-.62 4.404-2.003 5.59-1.396 1.201-3.396 1.564-5.046 1.437zm.502-8.965c2.395 0 4.238-1.724 4.238-5.18 0-3.39-1.851-5.126-4.238-5.126-2.445 0-4.36 1.8-4.36 5.126 0 3.382 1.856 5.18 4.36 5.18z"/>
                  </svg>
                </a>

                {/* Share on X */}
                <a
                  href={`https://x.com/intent/tweet?text=${encodeURIComponent(`"${highlight.text.slice(0, 200)}${highlight.text.length > 200 ? '...' : ''}"\n\n— ${highlight.author}, ${highlight.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  title="Share on X"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>

              {(highlight.page || highlight.location) && (
                <p className="text-white/40 text-xs mt-1">
                  {highlight.page && `Page ${highlight.page}`}
                  {highlight.page && highlight.location && ' · '}
                  {highlight.location && `Loc ${highlight.location}`}
                </p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* CENTER: Quote card - slightly left and down from center */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4 md:p-8"
        style={{ paddingTop: '12%', paddingRight: '2%' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            delay: 0.15,
            type: 'spring',
            stiffness: 300,
            damping: 24
          }}
          className="w-full max-w-xl"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* The Digital Marginalia Card */}
          <motion.div
            className="rounded-2xl md:rounded-3xl p-6 md:p-8 relative"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.97)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 10px 25px -10px rgba(0, 0, 0, 0.3)'
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {/* Opening quote mark - positioned absolutely */}
            <span
              className="absolute text-gray-200/80 select-none"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '4rem',
                lineHeight: 1,
                top: '0.5rem',
                left: '1rem'
              }}
            >
              "
            </span>

            <blockquote
              className={`${getFontSize()} text-center px-6 md:px-8`}
              style={{
                fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
                color: '#1a1a1a',
                fontWeight: 400,
                letterSpacing: '-0.01em',
                lineHeight: 1.6
              }}
            >
              {/* Highlighted first sentence */}
              <span
                style={{
                  backgroundColor: 'rgba(196, 168, 130, 0.25)',
                  padding: '1px 0',
                  boxDecorationBreak: 'clone',
                  WebkitBoxDecorationBreak: 'clone'
                }}
              >
                {firstSentence}
              </span>
              {/* Rest of text - with thin space if needed */}
              {restOfText && <span>{restOfText}</span>}
            </blockquote>

            {/* Closing quote mark - positioned absolutely */}
            <span
              className="absolute text-gray-200/80 select-none"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '4rem',
                lineHeight: 1,
                bottom: '0.25rem',
                right: '1rem'
              }}
            >
              "
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Tags - above integration bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="absolute bottom-32 left-4 right-20 md:left-8 md:right-24"
      >
        <TagPills
          highlight={highlight}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
          compact
        />
      </motion.div>

      {/* Integration bar - bottom center */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-20 left-4 right-20 md:left-8 md:right-24"
      >
        <IntegrationBar highlight={highlight} />
      </motion.div>

      {/* Action buttons - bottom right */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-20 right-4 flex flex-col gap-2"
      >
        {/* Export/Share button */}
        {onExport && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport(highlight);
            }}
            className="p-3 rounded-full bg-[#a08060]/30 backdrop-blur-sm hover:bg-[#a08060]/50 transition-colors group"
            title="Export as image"
          >
            <svg className="w-5 h-5 text-[#c4a882] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        )}

        {/* Challenge me button */}
        {onChallenge && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChallenge(highlight);
            }}
            className="p-3 rounded-full bg-[#c4a882]/30 backdrop-blur-sm hover:bg-[#c4a882]/50 transition-colors group"
            title="Challenge me"
          >
            <svg className="w-5 h-5 text-[#c4a882] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </button>
        )}

        {/* Add note button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowNoteInput(true);
          }}
          className="p-3 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
          title="Add note"
        >
          <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          {(notes.length > 0 || highlight.comment) && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#c4a882] text-[#1a1916] text-xs rounded-full flex items-center justify-center">
              {notes.length || (highlight.comment ? 1 : 0)}
            </span>
          )}
        </button>

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirmDelete(true);
            }}
            className="p-3 rounded-full bg-black/30 backdrop-blur-sm hover:bg-red-500/50 transition-colors group"
            title="Delete"
          >
            <svg className="w-5 h-5 text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </motion.div>

      {/* Notes sidebar - slides in from right */}
      {showNoteInput && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="absolute top-20 right-4 bottom-24 w-72 bg-[#1a1916]/95 backdrop-blur-xl rounded-2xl border border-[#3d3a36] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-[#3d3a36] flex items-center justify-between">
            <h3 className="text-[#ebe6dc] font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Notes
            </h3>
            <button
              onClick={() => setShowNoteInput(false)}
              className="p-1 rounded-full hover:bg-white/10 transition"
            >
              <svg className="w-5 h-5 text-[#6b5c4c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Existing notes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {highlight.comment && (
              <div className="p-3 bg-[#2d2a26] rounded-lg">
                <p className="text-[#ebe6dc] text-sm">{highlight.comment}</p>
                <p className="text-[#6b5c4c] text-xs mt-1">Earlier</p>
              </div>
            )}
            {notes.map((note, i) => (
              <div key={i} className="p-3 bg-[#2d2a26] rounded-lg">
                <p className="text-[#ebe6dc] text-sm">{note.text}</p>
                <p className="text-[#6b5c4c] text-xs mt-1">{note.timestamp}</p>
              </div>
            ))}
            {!highlight.comment && notes.length === 0 && (
              <p className="text-[#6b5c4c] text-sm italic text-center py-4">
                No notes yet. Add your thoughts below.
              </p>
            )}
          </div>

          {/* Add note input */}
          <div className="p-4 border-t border-[#3d3a36]">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="What does this inspire in you?"
              className="w-full h-20 p-3 rounded-lg bg-[#0a0a0a] border border-[#3d3a36] focus:border-[#a08060] focus:outline-none resize-none text-[#ebe6dc] text-sm"
              autoFocus
            />
            <button
              onClick={() => {
                if (noteText.trim() && onAddNote) {
                  onAddNote(highlight.id, noteText.trim());
                  setNoteText('');
                }
              }}
              disabled={!noteText.trim()}
              className="w-full mt-2 py-2 rounded-lg bg-[#a08060] hover:bg-[#b08c6a] disabled:opacity-50 disabled:cursor-not-allowed transition text-[#1a1916] font-medium text-sm"
            >
              Add Note
            </button>
          </div>
        </motion.div>
      )}

      {/* Delete confirmation */}
      {showConfirmDelete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirmDelete(false);
          }}
        >
          <div
            className="bg-[#1a1916] rounded-2xl p-6 border border-[#3d3a36] max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[#ebe6dc] font-semibold text-lg mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Delete this highlight?
            </h3>
            <p className="text-[#8a8578] text-sm mb-4">
              This will permanently remove it from your collection.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-2 rounded-lg bg-[#2d2a26] hover:bg-[#3d3a36] transition text-[#ebe6dc]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(highlight.id);
                  setShowConfirmDelete(false);
                }}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition text-white font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
