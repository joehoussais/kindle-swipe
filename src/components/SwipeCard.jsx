import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getBookCover, getCachedCover } from '../utils/bookCovers';
import { getAuthorPhoto, getGoodreadsUrl } from '../utils/authorPhotos';
import { getBackgroundForHighlight, rgbString } from '../utils/backgrounds';

export function SwipeCard({ highlight, isTop = false }) {
  const [cover, setCover] = useState(() => getCachedCover(highlight.title, highlight.author));
  const [imageLoaded, setImageLoaded] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [authorPhoto, setAuthorPhoto] = useState(null);

  // Get background based on highlight ID
  const background = getBackgroundForHighlight(highlight.id);
  const textColor = rgbString(background.textColor);
  const textColorLight = rgbString(background.textColorLight);
  const textColorFaint = rgbString(background.textColorLight, 0.5);

  useEffect(() => {
    let mounted = true;

    getBookCover(highlight.title, highlight.author).then((result) => {
      if (mounted) {
        setCover(result);
      }
    });

    getAuthorPhoto(highlight.author).then((photo) => {
      if (mounted) {
        setAuthorPhoto(photo);
      }
    });

    // Preload background image
    const bgImg = new Image();
    bgImg.onload = () => {
      if (mounted) setBgLoaded(true);
    };
    bgImg.src = background.src;

    return () => { mounted = false; };
  }, [highlight.title, highlight.author, highlight.id, background.src]);

  useEffect(() => {
    if (cover.type === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImageLoaded(true);
      };
      img.onerror = () => {
        setImageLoaded(true);
      };
      img.src = cover.value;
    }
  }, [cover]);

  const getFontSize = () => {
    const len = highlight.text.length;
    if (len < 100) return 'text-3xl md:text-4xl';
    if (len < 200) return 'text-2xl md:text-3xl';
    if (len < 400) return 'text-xl md:text-2xl';
    return 'text-lg md:text-xl';
  };

  const goodreadsUrl = getGoodreadsUrl(highlight.title, highlight.author);

  return (
    <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl">
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

      {/* Dark overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: background.theme === 'dark'
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.4) 100%)'
            : background.theme === 'light'
              ? 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.1) 70%, rgba(255,255,255,0.3) 100%)'
              : 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.05) 70%, rgba(0,0,0,0.3) 100%)'
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)'
        }}
      />

      {/* Content container */}
      <div className="absolute inset-0 flex flex-col p-6 md:p-10 pt-16 md:pt-20">

        {/* Top section: Book cover + info */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-start gap-4"
        >
          {/* Book cover */}
          {cover.type === 'image' && (
            <div className="relative flex-shrink-0">
              <div
                className="w-24 h-36 md:w-32 md:h-48 rounded shadow-2xl overflow-hidden"
                style={{
                  boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
                }}
              >
                <img
                  src={cover.value}
                  alt={highlight.title}
                  className="w-full h-full object-cover"
                  style={{
                    opacity: imageLoaded ? 1 : 0,
                    transition: 'opacity 0.3s'
                  }}
                />
              </div>
            </div>
          )}

          {/* Book info */}
          <div className="flex-1 min-w-0 pt-1">
            <h3
              className="text-base md:text-lg font-semibold line-clamp-2 leading-tight"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '1.3rem',
                color: textColor,
                letterSpacing: '0.03em',
                fontWeight: 600,
                textShadow: background.theme === 'dark' ? '0 2px 10px rgba(0,0,0,0.5)' : '0 1px 3px rgba(255,255,255,0.3)'
              }}
            >
              {highlight.title}
            </h3>

            {/* Author with links */}
            <div className="flex items-center gap-3 mt-2">
              {authorPhoto && (
                <img
                  src={authorPhoto}
                  alt={highlight.author}
                  className="w-10 h-10 rounded-full object-cover"
                  style={{
                    border: `2px solid ${textColorFaint}`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                  }}
                />
              )}
              <p
                className="text-sm italic"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: textColorLight,
                  textShadow: background.theme === 'dark' ? '0 1px 5px rgba(0,0,0,0.5)' : 'none'
                }}
              >
                {highlight.author}
              </p>

              {/* Goodreads link */}
              <a
                href={goodreadsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded transition-all hover:opacity-80"
                title="View on Goodreads"
                onClick={(e) => e.stopPropagation()}
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill={textColorLight}
                  style={{ filter: background.theme === 'dark' ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' : 'none' }}
                >
                  <path d="M11.43 23.995c-3.608-.208-6.274-2.077-6.448-5.078.695.007 1.375-.013 2.07-.006.224 1.342 1.065 2.43 2.683 3.026 1.558.496 3.085.31 4.354-.763.949-.726 1.427-1.796 1.427-3.612V15.87c-.975 1.09-2.574 1.725-4.514 1.725-4.292 0-6.549-3.168-6.549-7.108 0-4.004 2.456-7.242 6.665-7.242 1.913 0 3.392.65 4.398 1.888V3.705h1.963v13.263c0 2.595-.62 4.404-2.003 5.59-1.396 1.201-3.396 1.564-5.046 1.437zm.502-8.965c2.395 0 4.238-1.724 4.238-5.18 0-3.39-1.851-5.126-4.238-5.126-2.445 0-4.36 1.8-4.36 5.126 0 3.382 1.856 5.18 4.36 5.18z"/>
                </svg>
              </a>

              {/* Share on X */}
              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(`"${highlight.text.slice(0, 200)}${highlight.text.length > 200 ? '...' : ''}"\n\n— ${highlight.author}, ${highlight.title}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded transition-all hover:opacity-80"
                title="Share on X"
                onClick={(e) => e.stopPropagation()}
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill={textColorLight}
                  style={{ filter: background.theme === 'dark' ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' : 'none' }}
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </motion.div>

        {/* Center section: Quote */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex-1 flex items-center justify-center py-8"
        >
          <blockquote
            className={`
              ${getFontSize()} leading-relaxed
              text-center max-w-2xl
              max-h-[50vh] overflow-y-auto
            `}
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              color: textColor,
              fontWeight: 400,
              fontStyle: 'italic',
              letterSpacing: '0.01em',
              lineHeight: 1.7,
              textShadow: background.theme === 'dark'
                ? '0 2px 15px rgba(0,0,0,0.6)'
                : '0 1px 3px rgba(255,255,255,0.5)'
            }}
          >
            <span
              className="text-5xl md:text-6xl leading-none"
              style={{
                fontFamily: "'Caveat', cursive",
                color: textColorFaint,
                fontStyle: 'normal'
              }}
            >
              "
            </span>
            <span className="relative -top-3">
              {highlight.text}
            </span>
            <span
              className="text-5xl md:text-6xl leading-none"
              style={{
                fontFamily: "'Caveat', cursive",
                color: textColorFaint,
                fontStyle: 'normal'
              }}
            >
              "
            </span>
          </blockquote>
        </motion.div>

        {/* Bottom section: Location/page info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          {(highlight.page || highlight.location) && (
            <p
              className="text-xs tracking-widest"
              style={{
                fontFamily: "'Caveat', cursive",
                color: textColorFaint,
                fontSize: '0.9rem',
                textShadow: background.theme === 'dark' ? '0 1px 5px rgba(0,0,0,0.5)' : 'none'
              }}
            >
              {highlight.page && `p. ${highlight.page}`}
              {highlight.page && highlight.location && ' — '}
              {highlight.location && `loc. ${highlight.location}`}
            </p>
          )}
        </motion.div>
      </div>

      {/* Scroll hint */}
      {isTop && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 0.6, 0], y: [10, 0, -10] }}
          transition={{ delay: 2, duration: 2, times: [0, 0.3, 1] }}
          className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none"
        >
          <div
            className="text-sm tracking-wide"
            style={{
              fontFamily: "'Caveat', cursive",
              color: textColorFaint,
              textShadow: '0 1px 5px rgba(0,0,0,0.5)'
            }}
          >
            scroll to continue...
          </div>
        </motion.div>
      )}
    </div>
  );
}
