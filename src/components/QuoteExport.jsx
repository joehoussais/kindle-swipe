import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { getBookCover, getCachedCover } from '../utils/bookCovers';

// Format dimensions (width x height)
const FORMATS = {
  story: { width: 1080, height: 1920, label: 'Story', ratio: '9:16' },
  square: { width: 1080, height: 1080, label: 'Square', ratio: '1:1' },
  landscape: { width: 1920, height: 1080, label: 'Landscape', ratio: '16:9' }
};

// Template types
const TEMPLATES = {
  parchment: 'Parchment',
  marble: 'Marble',
  ink: 'Ink'
};

// Truncate text intelligently
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  // Find the last complete word before maxLength
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.slice(0, lastSpace) + '...';
}

// Get font size based on text length and format
function getFontSize(textLength, format) {
  const baseSize = format === 'landscape' ? 48 : format === 'square' ? 52 : 56;

  if (textLength < 100) return baseSize * 1.3;
  if (textLength < 200) return baseSize * 1.1;
  if (textLength < 350) return baseSize;
  if (textLength < 500) return baseSize * 0.85;
  return baseSize * 0.7;
}

// Get max text length for format
function getMaxLength(format) {
  if (format === 'story') return 500;
  if (format === 'square') return 350;
  return 400; // landscape
}

// Parchment Template - warm sepia, classic literary feel
function ParchmentTemplate({ highlight, format, showCover, cover }) {
  const { width, height } = FORMATS[format];
  const fontSize = getFontSize(highlight.text.length, format);
  const maxLength = getMaxLength(format);
  const displayText = truncateText(highlight.text, maxLength);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: 'linear-gradient(180deg, #0f0f0d 0%, #191919 50%, #0f0f0d 100%)',
        fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif"
      }}
    >
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative border */}
      <div className="absolute inset-8 border border-[#ffffff14]/50 rounded-sm" />
      <div className="absolute inset-12 border border-[#ffffff14]/30 rounded-sm" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-16 justify-center">
        {/* Book cover if enabled */}
        {showCover && cover && (
          <div className="flex justify-center mb-12">
            <img
              src={cover}
              alt=""
              className="h-32 w-auto rounded shadow-xl"
              crossOrigin="anonymous"
            />
          </div>
        )}

        {/* Quote */}
        <div className="text-center px-8">
          <div className="w-16 h-px bg-[#2383e2] mx-auto mb-8" />

          <p
            className="text-[#ffffffeb] font-light leading-relaxed italic"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: `${fontSize}px`,
              lineHeight: 1.5
            }}
          >
            "{displayText}"
          </p>

          <div className="w-16 h-px bg-[#2383e2] mx-auto mt-8 mb-8" />

          {/* Attribution */}
          <p className="text-[#9b9a97]" style={{ fontSize: `${fontSize * 0.4}px` }}>
            {highlight.title}
          </p>
          {highlight.author && highlight.author !== 'You' && highlight.author !== 'Unknown' && (
            <p className="text-[#787774] mt-2" style={{ fontSize: `${fontSize * 0.35}px` }}>
              {highlight.author}
            </p>
          )}
        </div>

        {/* Watermark */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-[#ffffff14] text-sm tracking-widest uppercase">
            Highlight
          </p>
        </div>
      </div>
    </div>
  );
}

// Marble Template - clean white, minimal, modern
function MarbleTemplate({ highlight, format, showCover, cover }) {
  const { width, height } = FORMATS[format];
  const fontSize = getFontSize(highlight.text.length, format);
  const maxLength = getMaxLength(format);
  const displayText = truncateText(highlight.text, maxLength);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: '#f8f8f8',
        fontFamily: "'Playfair Display', Georgia, serif"
      }}
    >
      {/* Subtle marble texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Thin border frame */}
      <div className="absolute inset-10 border border-gray-200" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-20 justify-center">
        {/* Book cover if enabled */}
        {showCover && cover && (
          <div className="flex justify-center mb-12">
            <img
              src={cover}
              alt=""
              className="h-28 w-auto rounded shadow-lg"
              crossOrigin="anonymous"
            />
          </div>
        )}

        {/* Quote */}
        <div className="text-center px-12">
          <p
            className="text-gray-800 font-normal leading-relaxed"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: `${fontSize}px`,
              lineHeight: 1.6,
              letterSpacing: '-0.02em'
            }}
          >
            "{displayText}"
          </p>

          {/* Simple line */}
          <div className="w-12 h-px bg-gray-300 mx-auto mt-10 mb-8" />

          {/* Attribution */}
          <p className="text-gray-600 font-light" style={{ fontSize: `${fontSize * 0.4}px` }}>
            {highlight.title}
          </p>
          {highlight.author && highlight.author !== 'You' && highlight.author !== 'Unknown' && (
            <p className="text-gray-400 mt-2 font-light" style={{ fontSize: `${fontSize * 0.35}px` }}>
              {highlight.author}
            </p>
          )}
        </div>

        {/* Watermark */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-gray-300 text-sm tracking-widest uppercase">
            Highlight
          </p>
        </div>
      </div>
    </div>
  );
}

// Ink Template - elegant dark mode
function InkTemplate({ highlight, format, showCover, cover }) {
  const { width, height } = FORMATS[format];
  const fontSize = getFontSize(highlight.text.length, format);
  const maxLength = getMaxLength(format);
  const displayText = truncateText(highlight.text, maxLength);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: '#191919',
        fontFamily: "'Playfair Display', Georgia, serif"
      }}
    >
      {/* Subtle gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, #242220 0%, #191919 70%)'
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-20 justify-center">
        {/* Book cover if enabled */}
        {showCover && cover && (
          <div className="flex justify-center mb-12">
            <img
              src={cover}
              alt=""
              className="h-28 w-auto rounded shadow-2xl"
              style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
              crossOrigin="anonymous"
            />
          </div>
        )}

        {/* Quote */}
        <div className="text-center px-12">
          {/* Opening accent */}
          <div className="flex justify-center mb-6">
            <div className="w-1 h-12 bg-[#2383e2]" />
          </div>

          <p
            className="text-[#ffffffeb] font-light leading-relaxed"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: `${fontSize}px`,
              lineHeight: 1.55,
              fontStyle: 'italic'
            }}
          >
            "{displayText}"
          </p>

          {/* Closing accent */}
          <div className="flex justify-center mt-6 mb-8">
            <div className="w-1 h-12 bg-[#2383e2]" />
          </div>

          {/* Attribution */}
          <p className="text-[#2383e2]" style={{ fontSize: `${fontSize * 0.4}px` }}>
            {highlight.title}
          </p>
          {highlight.author && highlight.author !== 'You' && highlight.author !== 'Unknown' && (
            <p className="text-[#787774] mt-2" style={{ fontSize: `${fontSize * 0.35}px` }}>
              {highlight.author}
            </p>
          )}
        </div>

        {/* Watermark */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-[#252525] text-sm tracking-widest uppercase">
            Highlight
          </p>
        </div>
      </div>
    </div>
  );
}

export function QuoteExport({ highlight, onClose }) {
  const [template, setTemplate] = useState('parchment');
  const [format, setFormat] = useState('story');
  const [showCover, setShowCover] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [cover, setCover] = useState(() => getCachedCover(highlight.title, highlight.author));
  const templateRef = useRef(null);

  // Load book cover
  useEffect(() => {
    getBookCover(highlight.title, highlight.author).then(setCover);
  }, [highlight.title, highlight.author]);

  // Calculate preview scale
  const getPreviewScale = () => {
    const { width, height } = FORMATS[format];
    // Max preview dimensions
    const maxWidth = 280;
    const maxHeight = 400;

    const scaleW = maxWidth / width;
    const scaleH = maxHeight / height;
    return Math.min(scaleW, scaleH);
  };

  // Generate image blob
  const generateImage = async () => {
    if (!templateRef.current) return null;

    const canvas = await html2canvas(templateRef.current, {
      scale: 2,
      backgroundColor: null,
      logging: false,
      useCORS: true,
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
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
      a.download = `highlight-${format}-${Date.now()}.png`;
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
      // Fallback to copy
      await handleCopy();
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
        await handleCopy();
      }
    }
    setIsExporting(false);
  };

  const TemplateComponent = {
    parchment: ParchmentTemplate,
    marble: MarbleTemplate,
    ink: InkTemplate
  }[template];

  const previewScale = getPreviewScale();
  const { width, height } = FORMATS[format];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md max-h-[90vh] bg-[#191919] rounded-2xl overflow-hidden border border-[#252525] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#252525] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#ffffffeb]">Export Quote</h2>
            <p className="text-sm text-[#787774]">Choose a style</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition text-[#9b9a97]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 p-4 flex flex-col items-center justify-center overflow-hidden">
          <div
            className="rounded-lg shadow-2xl overflow-hidden"
            style={{
              width: width * previewScale,
              height: height * previewScale,
            }}
          >
            <div
              ref={templateRef}
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}
            >
              <TemplateComponent
                highlight={highlight}
                format={format}
                showCover={showCover}
                cover={cover}
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="p-4 border-t border-[#252525] space-y-4">
          {/* Template selector */}
          <div>
            <p className="text-xs text-[#787774] uppercase tracking-wider mb-2">Style</p>
            <div className="flex gap-2">
              {Object.entries(TEMPLATES).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTemplate(key)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm transition ${
                    template === key
                      ? 'bg-[#2383e2] text-[#191919]'
                      : 'bg-[#252525] text-[#ffffffeb] hover:bg-[#ffffff14]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Format selector */}
          <div>
            <p className="text-xs text-[#787774] uppercase tracking-wider mb-2">Format</p>
            <div className="flex gap-2">
              {Object.entries(FORMATS).map(([key, { label, ratio }]) => (
                <button
                  key={key}
                  onClick={() => setFormat(key)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm transition ${
                    format === key
                      ? 'bg-[#2383e2] text-[#191919]'
                      : 'bg-[#252525] text-[#ffffffeb] hover:bg-[#ffffff14]'
                  }`}
                >
                  <span className="block">{label}</span>
                  <span className="block text-xs opacity-70">{ratio}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Book cover toggle */}
          {cover && (
            <button
              onClick={() => setShowCover(!showCover)}
              className={`w-full py-2 px-3 rounded-lg text-sm transition flex items-center justify-between ${
                showCover
                  ? 'bg-[#2383e2]/20 border border-[#2383e2]/50 text-[#ffffffeb]'
                  : 'bg-[#252525] border border-[#ffffff14] text-[#9b9a97]'
              }`}
            >
              <span>Include book cover</span>
              <div className={`w-8 h-5 rounded-full transition ${showCover ? 'bg-[#2383e2]' : 'bg-[#ffffff14]'}`}>
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow transition-transform mt-0.5 ${
                    showCover ? 'translate-x-3.5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-[#252525] flex gap-2">
          <button
            onClick={handleShare}
            disabled={isExporting}
            className="flex-1 py-3 px-4 rounded-lg bg-[#2383e2] hover:bg-[#b08c6a] transition text-[#191919] font-medium text-sm flex items-center justify-center gap-2"
          >
            {exportSuccess ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Done
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </>
            )}
          </button>
          <button
            onClick={handleCopy}
            disabled={isExporting}
            className="py-3 px-4 rounded-lg bg-[#252525] hover:bg-[#ffffff14] transition text-[#ffffffeb] text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="py-3 px-4 rounded-lg bg-[#252525] hover:bg-[#ffffff14] transition text-[#ffffffeb] text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>

        {/* Loading overlay */}
        {isExporting && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
            <div className="flex items-center gap-2 text-white">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Preparing...
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
