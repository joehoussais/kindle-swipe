import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getBookCover, getCachedCover } from '../utils/bookCovers';
import { getAuthorPhoto, getGoodreadsUrl } from '../utils/authorPhotos';
import { getBackgroundForHighlight } from '../utils/backgrounds';

// Extract first sentence for highlighting
function getFirstSentence(text) {
  const match = text.match(/^[^.!?]+[.!?]/);
  if (match) {
    return match[0];
  }
  return text.length > 100 ? text.slice(0, 100) : text;
}

export function SwipeCard({ highlight, isTop = false }) {
  const [cover, setCover] = useState(() => getCachedCover(highlight.title, highlight.author));
  const [imageLoaded, setImageLoaded] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [authorPhoto, setAuthorPhoto] = useState(null);

  const background = getBackgroundForHighlight(highlight.id);

  const { firstSentence, restOfText } = useMemo(() => {
    const first = getFirstSentence(highlight.text);
    const rest = highlight.text.slice(first.length);
    return { firstSentence: first, restOfText: rest };
  }, [highlight.text]);

  useEffect(() => {
    let mounted = true;

    getBookCover(highlight.title, highlight.author).then((result) => {
      if (mounted) setCover(result);
    });

    getAuthorPhoto(highlight.author).then((photo) => {
      if (mounted) setAuthorPhoto(photo);
    });

    const bgImg = new Image();
    bgImg.onload = () => { if (mounted) setBgLoaded(true); };
    bgImg.src = background.src;

    return () => { mounted = false; };
  }, [highlight.title, highlight.author, highlight.id, background.src]);

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
    <div className="absolute inset-0 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          backgroundImage: `url(${background.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: bgLoaded ? 1 : 0
        }}
      />

      {/* Scrim for contrast */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 30%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0.5) 100%)'
        }}
      />

      {/* TOP: Book info - stays at top */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="absolute top-0 left-0 right-0 p-4 md:p-6 pt-14 md:pt-16"
      >
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
      </motion.div>

      {/* CENTER: Quote card - slightly left and down from center */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4 md:p-8"
        style={{ paddingTop: '12%', paddingRight: '2%' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-xl"
        >
          {/* The Digital Marginalia Card */}
          <div
            className="rounded-2xl md:rounded-3xl p-6 md:p-8 relative"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)'
            }}
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
                  backgroundColor: 'rgba(147, 197, 253, 0.3)',
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
          </div>
        </motion.div>
      </div>

      {/* BOTTOM: Scroll hint */}
      {isTop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-6 left-0 right-0 flex justify-center"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur-sm">
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
            <span className="text-white/60 text-xs font-medium">Scroll for more</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
