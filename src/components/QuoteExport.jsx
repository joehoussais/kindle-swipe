import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { getBookCover, getCachedCover } from '../utils/bookCovers';
import { BACKGROUNDS } from '../utils/backgrounds';

// Format dimensions (width x height)
const FORMATS = {
  story: { width: 1080, height: 1920, label: 'Story', ratio: '9:16' },
  square: { width: 1080, height: 1080, label: 'Square', ratio: '1:1' },
  landscape: { width: 1920, height: 1080, label: 'Landscape', ratio: '16:9' }
};

// Template styles
const TEMPLATES = {
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    description: 'Floating text on background'
  },
  classic: {
    id: 'classic',
    label: 'Classic',
    description: 'Elegant card design'
  },
  glass: {
    id: 'glass',
    label: 'Glass',
    description: 'Modern frosted effect'
  },
  editorial: {
    id: 'editorial',
    label: 'Editorial',
    description: 'Magazine typography'
  }
};

// Get dynamic font size based on text length and format
function getFontSize(textLength, format, template) {
  // Base sizes vary by format
  const baseSizes = {
    story: { minimal: 52, classic: 44, glass: 46, editorial: 56 },
    square: { minimal: 46, classic: 40, glass: 42, editorial: 50 },
    landscape: { minimal: 42, classic: 36, glass: 38, editorial: 46 }
  };

  const baseSize = baseSizes[format]?.[template] || 44;

  // Scale down for longer text
  if (textLength < 80) return baseSize * 1.15;
  if (textLength < 150) return baseSize;
  if (textLength < 250) return baseSize * 0.88;
  if (textLength < 400) return baseSize * 0.76;
  if (textLength < 600) return baseSize * 0.66;
  return baseSize * 0.58;
}

// Get line height based on template
function getLineHeight(template) {
  const heights = {
    minimal: 1.55,
    classic: 1.6,
    glass: 1.55,
    editorial: 1.45
  };
  return heights[template] || 1.55;
}

// Extract first sentence for highlight effect
function getFirstSentence(text) {
  const match = text.match(/^[^.!?]*[.!?]/);
  if (match) return match[0];
  if (text.length <= 100) return text;
  const spaceIndex = text.indexOf(' ', 80);
  return spaceIndex > -1 ? text.slice(0, spaceIndex) : text.slice(0, 100);
}

// ============================================================================
// TEMPLATE: Minimal - Quote floats directly on background
// ============================================================================
function MinimalTemplate({ highlight, format, background }) {
  const { width, height } = FORMATS[format];
  const fontSize = getFontSize(highlight.text.length, format, 'minimal');
  const lineHeight = getLineHeight('minimal');

  // Responsive padding and sizing
  const padding = format === 'landscape' ? 120 : format === 'square' ? 100 : 120;
  const authorSize = fontSize * 0.42;
  const quoteMarkSize = fontSize * 2.2;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        fontFamily: "'Playfair Display', Georgia, serif"
      }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${background?.src || BACKGROUNDS[0]?.src})` }}
      />

      {/* Gradient overlays for depth and readability */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%),
            linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.3) 100%)
          `
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col h-full justify-center"
        style={{ padding: `${padding}px` }}
      >
        {/* Large decorative opening quote */}
        <div
          className="absolute opacity-20"
          style={{
            top: format === 'landscape' ? '15%' : '12%',
            left: `${padding * 0.8}px`,
            fontSize: `${quoteMarkSize}px`,
            fontFamily: "'Playfair Display', Georgia, serif",
            color: 'white',
            lineHeight: 1
          }}
        >
          "
        </div>

        {/* Quote text */}
        <div
          className="relative z-10"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight,
            color: 'white',
            textShadow: '0 4px 30px rgba(0,0,0,0.5), 0 2px 10px rgba(0,0,0,0.3)',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            fontStyle: 'italic'
          }}
        >
          {highlight.text}
        </div>

        {/* Author & Book */}
        <div
          className="mt-auto pt-12"
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: `${authorSize}px`,
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontWeight: 500,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}
        >
          {highlight.author && highlight.author !== 'Unknown' && highlight.author !== 'You' && (
            <span>{highlight.author}</span>
          )}
          {highlight.author && highlight.author !== 'Unknown' && highlight.author !== 'You' && highlight.title && (
            <span style={{ opacity: 0.5, margin: '0 12px' }}>·</span>
          )}
          {highlight.title && (
            <span style={{ fontStyle: 'italic', textTransform: 'none', letterSpacing: '0.02em' }}>
              {highlight.title}
            </span>
          )}
        </div>
      </div>

      {/* Watermark */}
      <div
        className="absolute bottom-8 right-10"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '14px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)',
          textShadow: '0 1px 4px rgba(0,0,0,0.3)'
        }}
      >
        Highlight
      </div>
    </div>
  );
}

// ============================================================================
// TEMPLATE: Classic - Refined card with book info
// ============================================================================
function ClassicTemplate({ highlight, format, cover, background, onCoverError }) {
  const { width, height } = FORMATS[format];
  const fontSize = getFontSize(highlight.text.length, format, 'classic');
  const lineHeight = getLineHeight('classic');
  const firstSentence = getFirstSentence(highlight.text);
  const restOfText = highlight.text.slice(firstSentence.length).trim();

  // Responsive sizing
  const outerPadding = format === 'landscape' ? 80 : format === 'square' ? 90 : 100;
  const cardPadding = format === 'landscape' ? 50 : format === 'square' ? 60 : 70;
  const coverHeight = format === 'landscape' ? 100 : format === 'square' ? 120 : 140;
  const titleSize = format === 'landscape' ? 24 : format === 'square' ? 28 : 32;
  const authorSize = format === 'landscape' ? 18 : format === 'square' ? 20 : 22;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${background?.src || BACKGROUNDS[0]?.src})` }}
      />

      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 100%)'
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col h-full justify-center items-center"
        style={{ padding: `${outerPadding}px` }}
      >
        {/* Book info - above card */}
        <div className="flex items-center justify-center mb-8 gap-5">
          {cover && (
            <img
              src={cover}
              alt=""
              className="rounded-lg"
              style={{
                height: `${coverHeight}px`,
                width: 'auto',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3)'
              }}
              crossOrigin="anonymous"
              onError={onCoverError}
            />
          )}
          <div className="text-left">
            <p
              className="text-white font-semibold leading-tight"
              style={{
                fontSize: `${titleSize}px`,
                textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                maxWidth: cover ? '380px' : '550px'
              }}
            >
              {highlight.title}
            </p>
            {highlight.author && highlight.author !== 'You' && highlight.author !== 'Unknown' && (
              <p
                className="text-white/70 mt-2"
                style={{
                  fontSize: `${authorSize}px`,
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }}
              >
                {highlight.author}
              </p>
            )}
          </div>
        </div>

        {/* Quote card */}
        <div
          className="rounded-3xl w-full"
          style={{
            background: 'rgba(255, 255, 255, 0.96)',
            padding: `${cardPadding}px`,
            boxShadow: '0 30px 80px rgba(0,0,0,0.35), 0 10px 30px rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.3)'
          }}
        >
          <div
            style={{
              fontSize: `${fontSize}px`,
              lineHeight,
              color: '#1a1a1a',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 400
            }}
          >
            {/* First sentence with accent underline */}
            <span
              style={{
                borderBottom: '0.12em solid rgba(35, 131, 226, 0.35)',
                paddingBottom: '0.02em'
              }}
            >
              {firstSentence}
            </span>
            {restOfText && <span> {restOfText}</span>}
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div
        className="absolute bottom-6 left-0 right-0 text-center"
        style={{
          fontSize: '13px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)',
          textShadow: '0 1px 4px rgba(0,0,0,0.3)'
        }}
      >
        Highlight
      </div>
    </div>
  );
}

// ============================================================================
// TEMPLATE: Glass - Modern frosted glass aesthetic
// ============================================================================
function GlassTemplate({ highlight, format, cover, background, onCoverError }) {
  const { width, height } = FORMATS[format];
  const fontSize = getFontSize(highlight.text.length, format, 'glass');
  const lineHeight = getLineHeight('glass');

  // Responsive sizing
  const padding = format === 'landscape' ? 80 : format === 'square' ? 90 : 100;
  const glassPadding = format === 'landscape' ? 50 : format === 'square' ? 60 : 70;
  const coverSize = format === 'landscape' ? 70 : format === 'square' ? 80 : 90;
  const metaSize = format === 'landscape' ? 18 : format === 'square' ? 20 : 22;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${background?.src || BACKGROUNDS[0]?.src})` }}
      />

      {/* Dark overlay for glass effect contrast */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)'
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col h-full justify-center"
        style={{ padding: `${padding}px` }}
      >
        {/* Glass card */}
        <div
          className="rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: `${glassPadding}px`,
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          {/* Quote text */}
          <div
            style={{
              fontSize: `${fontSize}px`,
              lineHeight,
              color: 'white',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 400,
              fontStyle: 'italic',
              letterSpacing: '-0.01em'
            }}
          >
            "{highlight.text}"
          </div>

          {/* Divider */}
          <div
            className="my-8"
            style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.3) 80%, transparent 100%)'
            }}
          />

          {/* Book info row */}
          <div className="flex items-center gap-5">
            {cover && (
              <img
                src={cover}
                alt=""
                className="rounded-lg"
                style={{
                  height: `${coverSize}px`,
                  width: 'auto',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
                }}
                crossOrigin="anonymous"
                onError={onCoverError}
              />
            )}
            <div>
              <p
                className="text-white font-medium"
                style={{ fontSize: `${metaSize}px` }}
              >
                {highlight.title}
              </p>
              {highlight.author && highlight.author !== 'You' && highlight.author !== 'Unknown' && (
                <p
                  className="text-white/60 mt-1"
                  style={{ fontSize: `${metaSize * 0.85}px` }}
                >
                  {highlight.author}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div
        className="absolute bottom-6 left-0 right-0 text-center"
        style={{
          fontSize: '13px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)'
        }}
      >
        Highlight
      </div>
    </div>
  );
}

// ============================================================================
// TEMPLATE: Editorial - Magazine-style typography hero
// ============================================================================
function EditorialTemplate({ highlight, format, background }) {
  const { width, height } = FORMATS[format];
  const fontSize = getFontSize(highlight.text.length, format, 'editorial');
  const lineHeight = getLineHeight('editorial');

  // Responsive sizing
  const padding = format === 'landscape' ? 100 : format === 'square' ? 100 : 120;
  const titleSize = format === 'landscape' ? 20 : format === 'square' ? 22 : 24;
  const dropCapSize = fontSize * 3.5;

  // Extract first letter for drop cap, rest of first word, and rest of text
  const firstLetter = highlight.text.charAt(0).toUpperCase();
  const words = highlight.text.slice(1).split(' ');
  const restOfFirstWord = words[0] || '';
  const remainingText = words.slice(1).join(' ');

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        fontFamily: "'Playfair Display', Georgia, serif"
      }}
    >
      {/* Background with stronger overlay for text legibility */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${background?.src || BACKGROUNDS[0]?.src})` }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.6) 100%)'
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col h-full justify-center"
        style={{ padding: `${padding}px` }}
      >
        {/* Book title - small, elegant, top */}
        <div
          className="mb-auto"
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: `${titleSize}px`,
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            fontWeight: 500
          }}
        >
          {highlight.title}
        </div>

        {/* Quote with editorial drop cap */}
        <div className="my-auto">
          <div
            style={{
              fontSize: `${fontSize}px`,
              lineHeight,
              color: 'white',
              fontWeight: 400,
              letterSpacing: '-0.01em'
            }}
          >
            {/* Drop cap */}
            <span
              style={{
                float: 'left',
                fontSize: `${dropCapSize}px`,
                lineHeight: 0.8,
                marginRight: '12px',
                marginTop: '8px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)'
              }}
            >
              {firstLetter}
            </span>
            <span style={{ fontVariant: 'small-caps', letterSpacing: '0.05em' }}>
              {restOfFirstWord}
            </span>
            {remainingText && <span> {remainingText}</span>}
          </div>
        </div>

        {/* Author - bottom, elegant */}
        {highlight.author && highlight.author !== 'You' && highlight.author !== 'Unknown' && (
          <div
            className="mt-auto pt-8"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: `${titleSize * 1.3}px`,
              color: 'rgba(255,255,255,0.7)',
              fontStyle: 'italic'
            }}
          >
            — {highlight.author}
          </div>
        )}
      </div>

      {/* Watermark */}
      <div
        className="absolute bottom-8 right-10"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '13px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.2)'
        }}
      >
        Highlight
      </div>
    </div>
  );
}

// ============================================================================
// MAIN EXPORT COMPONENT
// ============================================================================
export function QuoteExport({ highlight, onClose }) {
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUNDS[0]);
  const [format, setFormat] = useState('story');
  const [template, setTemplate] = useState('minimal');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [cover, setCover] = useState(() => getCachedCover(highlight.title, highlight.author));
  const [coverFailed, setCoverFailed] = useState(false);
  const templateRef = useRef(null);

  // Load book cover
  useEffect(() => {
    setCoverFailed(false);
    getBookCover(highlight.title, highlight.author).then(setCover);
  }, [highlight.title, highlight.author]);

  // Handle cover load error
  const handleCoverError = async () => {
    if (coverFailed) return;
    setCoverFailed(true);

    try {
      const cleanedTitle = highlight.title.split(':')[0].split('(')[0].trim();
      const searchQuery = highlight.author && highlight.author !== 'Unknown' && highlight.author !== 'You'
        ? `${cleanedTitle} ${highlight.author}`
        : cleanedTitle;

      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=3&fields=cover_i`
      );
      const data = await response.json();
      const firstWithCover = data.docs?.find(d => d.cover_i);
      if (firstWithCover) {
        setCover(`https://covers.openlibrary.org/b/id/${firstWithCover.cover_i}-L.jpg`);
      } else {
        setCover(null);
      }
    } catch {
      setCover(null);
    }
  };

  // Calculate preview scale - larger preview
  const getPreviewScale = () => {
    const { width, height } = FORMATS[format];
    const maxWidth = 340;
    const maxHeight = 480;
    const scaleW = maxWidth / width;
    const scaleH = maxHeight / height;
    return Math.min(scaleW, scaleH);
  };

  // Generate image blob
  const generateImage = async () => {
    if (!templateRef.current) return null;

    const { width, height } = FORMATS[format];

    const canvas = await html2canvas(templateRef.current, {
      scale: 2,
      backgroundColor: null,
      logging: false,
      useCORS: true,
      allowTaint: false
    });

    // Resize to exact target dimensions
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = width;
    resizedCanvas.height = height;
    const ctx = resizedCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, width, height);

    return new Promise((resolve) => {
      resizedCanvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  // Download image
  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const blob = await generateImage();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `highlight-${template}-${format}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    } catch (err) {
      console.error('Download failed:', err);
    }
    setIsExporting(false);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    setIsExporting(true);
    try {
      const blob = await generateImage();
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new window.ClipboardItem({ 'image/png': blob })
        ]);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 2000);
      } else {
        await handleDownload();
      }
    } catch (err) {
      console.error('Copy failed:', err);
      await handleDownload();
    }
    setIsExporting(false);
  };

  // Share via native API
  const handleShare = async () => {
    setIsExporting(true);
    try {
      const blob = await generateImage();
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'highlight.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: highlight.title,
            text: `"${highlight.text.slice(0, 100)}..." — ${highlight.author || highlight.title}`,
          });
          setIsExporting(false);
          return;
        }
      }
      await handleCopy();
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
        await handleCopy();
      }
    }
    setIsExporting(false);
  };

  const previewScale = getPreviewScale();
  const { width, height } = FORMATS[format];

  // Render the selected template
  const renderTemplate = () => {
    const props = {
      highlight,
      format,
      cover,
      background: selectedBackground,
      onCoverError: handleCoverError
    };

    switch (template) {
      case 'minimal':
        return <MinimalTemplate {...props} />;
      case 'classic':
        return <ClassicTemplate {...props} />;
      case 'glass':
        return <GlassTemplate {...props} />;
      case 'editorial':
        return <EditorialTemplate {...props} />;
      default:
        return <MinimalTemplate {...props} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg max-h-[92vh] bg-[#151515] rounded-3xl overflow-hidden border border-[#2a2a2a] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#252525] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Create Image</h2>
            <p className="text-sm text-[#666] mt-0.5">Share your highlight beautifully</p>
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

        {/* Preview */}
        <div className="flex-1 px-6 py-6 flex flex-col items-center justify-center min-h-0 bg-[#0a0a0a]">
          <div
            className="rounded-2xl shadow-2xl overflow-hidden flex-shrink-0"
            style={{
              width: width * previewScale,
              height: height * previewScale,
              boxShadow: '0 25px 80px rgba(0,0,0,0.6)'
            }}
          >
            <div
              ref={templateRef}
              style={{
                width: `${width}px`,
                height: `${height}px`,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}
            >
              {renderTemplate()}
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="px-6 py-4 border-t border-[#252525] space-y-4 max-h-[35vh] overflow-y-auto">
          {/* Template selector */}
          <div>
            <p className="text-xs text-[#666] uppercase tracking-wider mb-2 font-medium">Style</p>
            <div className="flex gap-2">
              {Object.entries(TEMPLATES).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => setTemplate(key)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                    template === key
                      ? 'bg-white text-black'
                      : 'bg-[#222] text-[#aaa] hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Background thumbnails */}
          <div>
            <p className="text-xs text-[#666] uppercase tracking-wider mb-2 font-medium">Background</p>
            <div className="grid grid-cols-7 gap-1.5">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBackground(bg)}
                  className={`aspect-square rounded-lg overflow-hidden transition-all ${
                    selectedBackground?.id === bg.id
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#151515] scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={bg.src}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Format selector */}
          <div>
            <p className="text-xs text-[#666] uppercase tracking-wider mb-2 font-medium">Format</p>
            <div className="flex gap-2">
              {Object.entries(FORMATS).map(([key, { label, ratio }]) => (
                <button
                  key={key}
                  onClick={() => setFormat(key)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm transition-all ${
                    format === key
                      ? 'bg-white text-black font-medium'
                      : 'bg-[#222] text-[#aaa] hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  <span className="block font-medium">{label}</span>
                  <span className="block text-xs opacity-60 mt-0.5">{ratio}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-[#252525] flex gap-3">
          <button
            onClick={handleShare}
            disabled={isExporting}
            className="flex-1 py-3.5 px-4 rounded-xl bg-white hover:bg-gray-100 transition text-black font-semibold text-sm flex items-center justify-center gap-2"
          >
            <AnimatePresence mode="wait">
              {exportSuccess ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-2"
                >
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Done
                </motion.div>
              ) : (
                <motion.div
                  key="share"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          <button
            onClick={handleCopy}
            disabled={isExporting}
            className="py-3.5 px-4 rounded-xl bg-[#222] hover:bg-[#2a2a2a] transition text-white"
            title="Copy to clipboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="py-3.5 px-4 rounded-xl bg-[#222] hover:bg-[#2a2a2a] transition text-white"
            title="Download"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>

        {/* Loading overlay */}
        <AnimatePresence>
          {isExporting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-3xl"
            >
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </motion.div>
                <p className="text-white text-sm font-medium">Creating image...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
