import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { getBookCover, getCachedCover } from '../utils/bookCovers';
import { BACKGROUNDS } from '../utils/backgrounds';

// Format dimensions (width x height)
const FORMATS = {
  story: { width: 1080, height: 1920, label: 'Story', ratio: '9:16' },
  square: { width: 1080, height: 1080, label: 'Square', ratio: '1:1' },
  landscape: { width: 1920, height: 1080, label: 'Landscape', ratio: '16:9' }
};

// Get font size based on text length and format
function getFontSize(textLength, format) {
  const baseSize = format === 'landscape' ? 36 : format === 'square' ? 40 : 44;

  if (textLength < 100) return baseSize * 1.2;
  if (textLength < 200) return baseSize * 1.05;
  if (textLength < 350) return baseSize;
  if (textLength < 500) return baseSize * 0.85;
  return baseSize * 0.72;
}

// Get first sentence from text (for blue underline highlight)
function getFirstSentence(text) {
  // Match sentence endings: period, exclamation, question mark followed by space or end
  const match = text.match(/^[^.!?]*[.!?]/);
  if (match) {
    return match[0];
  }
  // If no sentence ending found, return first 100 chars or full text
  if (text.length <= 100) return text;
  const spaceIndex = text.indexOf(' ', 80);
  return spaceIndex > -1 ? text.slice(0, spaceIndex) : text.slice(0, 100);
}

// Kindle-style Template - Scenic background with white card, book info at top
function KindleTemplate({ highlight, format, cover, background, onCoverError }) {
  const { width, height } = FORMATS[format];
  const fontSize = getFontSize(highlight.text.length, format);
  const firstSentence = getFirstSentence(highlight.text);
  const restOfText = highlight.text.slice(firstSentence.length).trim();

  // Scale factors for different formats
  const coverHeight = format === 'landscape' ? 120 : format === 'square' ? 140 : 160;
  const padding = format === 'landscape' ? 60 : format === 'square' ? 80 : 100;
  const cardPadding = format === 'landscape' ? 40 : format === 'square' ? 50 : 60;
  const bookInfoGap = format === 'landscape' ? 16 : 20;
  const titleSize = format === 'landscape' ? 28 : format === 'square' ? 32 : 36;
  const authorSize = format === 'landscape' ? 22 : format === 'square' ? 26 : 28;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${background?.src || BACKGROUNDS[0]?.src})`,
        }}
      />

      {/* Subtle dark overlay for better contrast */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.25) 100%)'
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col h-full justify-center items-center"
        style={{ padding: `${padding}px` }}
      >
        {/* Book info section - above the card */}
        <div
          className="flex items-center justify-center mb-8"
          style={{ gap: `${bookInfoGap}px` }}
        >
          {cover && (
            <img
              src={cover}
              alt=""
              className="rounded-lg shadow-2xl"
              style={{
                height: `${coverHeight}px`,
                width: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
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
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                maxWidth: cover ? '400px' : '600px'
              }}
            >
              {highlight.title}
            </p>
            {highlight.author && highlight.author !== 'You' && highlight.author !== 'Unknown' && (
              <p
                className="text-white/80 mt-1"
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

        {/* White quote card */}
        <div
          className="rounded-2xl w-full max-w-full"
          style={{
            background: 'rgba(255, 255, 255, 0.97)',
            padding: `${cardPadding}px`,
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          }}
        >
          {/* Quote text with first sentence highlighted */}
          <div style={{ fontSize: `${fontSize}px`, lineHeight: 1.6, color: '#1a1a1a' }}>
            {/* First sentence with blue underline highlight - using border for html2canvas compatibility */}
            <span
              style={{
                borderBottom: '0.15em solid rgba(35, 131, 226, 0.4)',
                paddingBottom: '0.05em'
              }}
            >
              {firstSentence}
            </span>
            {/* Rest of the text */}
            {restOfText && <span> {restOfText}</span>}
          </div>
        </div>

        {/* Watermark */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p
            className="text-sm tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.4)', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
          >
            Highlight
          </p>
        </div>
      </div>
    </div>
  );
}

export function QuoteExport({ highlight, onClose }) {
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUNDS[0]);
  const [format, setFormat] = useState('story');
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

  // Handle cover load error - try Open Library directly
  const handleCoverError = async () => {
    if (coverFailed) return; // Avoid infinite loop
    setCoverFailed(true);

    // Try Open Library as fallback
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

  // Generate image blob with correct dimensions
  const generateImage = async () => {
    if (!templateRef.current) return null;

    const { width, height } = FORMATS[format];

    const canvas = await html2canvas(templateRef.current, {
      scale: 2,
      backgroundColor: null,
      logging: false,
      useCORS: true,
    });

    // Resize canvas to exact target dimensions
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
            <p className="text-sm text-[#787774]">Choose a background</p>
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

        {/* Preview - fixed size container to prevent truncation */}
        <div className="flex-1 p-4 flex flex-col items-center justify-center min-h-0">
          <div
            className="rounded-lg shadow-2xl overflow-hidden flex-shrink-0"
            style={{
              width: width * previewScale,
              height: height * previewScale,
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
              <KindleTemplate
                highlight={highlight}
                format={format}
                cover={cover}
                background={selectedBackground}
                onCoverError={handleCoverError}
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="p-4 border-t border-[#252525] space-y-4 overflow-y-auto max-h-[40vh]">
          {/* Background thumbnail grid */}
          <div>
            <p className="text-xs text-[#787774] uppercase tracking-wider mb-2">Background</p>
            <div className="grid grid-cols-6 gap-2">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBackground(bg)}
                  className={`aspect-square rounded-lg overflow-hidden transition border-2 ${
                    selectedBackground?.id === bg.id
                      ? 'border-[#2383e2] ring-2 ring-[#2383e2]/30'
                      : 'border-transparent hover:border-[#ffffff14]'
                  }`}
                >
                  <img
                    src={bg.src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
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
                      ? 'bg-[#2383e2] text-white'
                      : 'bg-[#252525] text-[#ffffffeb] hover:bg-[#ffffff14]'
                  }`}
                >
                  <span className="block">{label}</span>
                  <span className="block text-xs opacity-70">{ratio}</span>
                </button>
              ))}
            </div>
          </div>

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
