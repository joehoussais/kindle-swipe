import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UpgradeModal } from './UpgradeModal';

// Kindle-style portrait format only (like an actual Kindle screen)
const FORMAT = { width: 1080, height: 1620, label: 'Kindle', ratio: '2:3' };

// Get dynamic font size that works for ANY quote length
function getKindleFontSize(textLength) {
  // Base size for Kindle-style readability
  if (textLength < 100) return 48;
  if (textLength < 200) return 44;
  if (textLength < 350) return 38;
  if (textLength < 500) return 34;
  if (textLength < 700) return 30;
  if (textLength < 1000) return 26;
  if (textLength < 1500) return 22;
  return 18; // Very long quotes still readable
}

// ============================================================================
// KINDLE TEMPLATE - Looks exactly like a Kindle screen
// Works for ANY quote length with dynamic font sizing
// ============================================================================
function KindleTemplate({ highlight }) {
  const { width, height } = FORMAT;
  const fontSize = getKindleFontSize(highlight.text.length);
  const lineHeight = 1.7;

  // Padding scales with font size for very long quotes
  const padding = fontSize < 30 ? 60 : 80;
  const authorSize = Math.max(18, fontSize * 0.45);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        fontFamily: "'Bookerly', 'Georgia', 'Times New Roman', serif",
        // Kindle cream/warm white background
        background: '#FAF8F0'
      }}
    >
      {/* Subtle paper texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(0,0,0,0.01) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(0,0,0,0.02) 0%, transparent 50%)
          `
        }}
      />

      {/* Content area - centered with flex */}
      <div
        className="relative z-10 flex flex-col h-full"
        style={{ padding: `${padding}px` }}
      >
        {/* Quote text with blue underline highlight - Kindle style */}
        <div
          className="flex-1 flex items-center"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight,
            color: '#1a1a1a',
            fontWeight: 400,
            letterSpacing: '-0.01em'
          }}
        >
          <div>
            <span
              style={{
                // Blue underline like Kindle highlighting
                borderBottom: '3px solid #2d3748',
                paddingBottom: '2px',
                // Slight blue tint to simulate Kindle highlight
                backgroundColor: 'rgba(35, 131, 226, 0.08)'
              }}
            >
              {highlight.text}
            </span>
          </div>
        </div>

        {/* Author & Book - bottom, simple Kindle style */}
        <div
          className="pt-8 mt-auto"
          style={{
            borderTop: '1px solid #e0ddd4'
          }}
        >
          <p
            style={{
              fontSize: `${authorSize}px`,
              color: '#666',
              fontWeight: 500,
              marginBottom: '4px'
            }}
          >
            {highlight.title}
          </p>
          {highlight.author && highlight.author !== 'Unknown' && highlight.author !== 'You' && (
            <p
              style={{
                fontSize: `${authorSize * 0.9}px`,
                color: '#888',
                fontStyle: 'italic'
              }}
            >
              {highlight.author}
            </p>
          )}
        </div>
      </div>

      {/* Kindle-style page edge shadow on right */}
      <div
        className="absolute top-0 right-0 w-4 h-full pointer-events-none"
        style={{
          background: 'linear-gradient(to left, rgba(0,0,0,0.08), transparent)'
        }}
      />

      {/* Subtle watermark */}
      <div
        className="absolute bottom-4 right-6"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '12px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'rgba(0,0,0,0.15)'
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
export function QuoteExport({ highlight, onClose, subscription }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const templateRef = useRef(null);

  // Subscription info (passed from parent or default to unlimited for guests)
  const canExport = subscription?.canExport ?? true;
  const exportsRemaining = subscription?.exportsRemaining ?? Infinity;
  const isPro = subscription?.isPro ?? false;

  // Calculate preview scale for the Kindle format
  const getPreviewScale = () => {
    const { width, height } = FORMAT;
    const maxWidth = 300;
    const maxHeight = 500;
    const scaleW = maxWidth / width;
    const scaleH = maxHeight / height;
    return Math.min(scaleW, scaleH);
  };

  // Generate image blob (dynamically imports html2canvas)
  const generateImage = async () => {
    if (!templateRef.current) return null;

    const { width, height } = FORMAT;

    // Dynamic import - only loads when user actually exports
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(templateRef.current, {
      scale: 2,
      backgroundColor: '#FAF8F0', // Kindle cream background
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

  // Check export limit before exporting
  const checkExportLimit = () => {
    if (!canExport) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  // Handle upgrade
  const handleUpgrade = async () => {
    if (!subscription?.createCheckoutSession) {
      console.error('Checkout not available');
      return;
    }
    setIsUpgrading(true);
    try {
      await subscription.createCheckoutSession();
    } catch (err) {
      console.error('Upgrade failed:', err);
      throw err;
    } finally {
      setIsUpgrading(false);
    }
  };

  // Download image
  const handleDownload = async () => {
    if (!checkExportLimit()) return;

    setIsExporting(true);
    try {
      const blob = await generateImage();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `highlight-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Increment export count after successful export
      if (subscription?.incrementExportCount) {
        await subscription.incrementExportCount();
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    } catch (err) {
      console.error('Download failed:', err);
    }
    setIsExporting(false);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!checkExportLimit()) return;

    setIsExporting(true);
    try {
      const blob = await generateImage();
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new window.ClipboardItem({ 'image/png': blob })
        ]);

        // Increment export count after successful export
        if (subscription?.incrementExportCount) {
          await subscription.incrementExportCount();
        }

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
    if (!checkExportLimit()) return;

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

          // Increment export count after successful export
          if (subscription?.incrementExportCount) {
            await subscription.incrementExportCount();
          }

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
  const { width, height } = FORMAT;

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
        className="w-full max-w-md max-h-[92vh] bg-[#151515] rounded-3xl overflow-hidden border border-[#2a2a2a] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Export as Image</h2>
            <p className="text-sm text-[#666] mt-0.5">
              {isPro ? (
                'Unlimited exports with Pro'
              ) : exportsRemaining === Infinity ? (
                'Kindle-style highlight'
              ) : (
                <span>
                  {exportsRemaining} free export{exportsRemaining !== 1 ? 's' : ''} remaining
                  {exportsRemaining <= 1 && (
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="ml-2 text-indigo-400 hover:text-indigo-300 underline"
                    >
                      Upgrade
                    </button>
                  )}
                </span>
              )}
            </p>
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

        {/* Preview - Kindle style, centered */}
        <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center min-h-0 bg-[#0a0a0a]">
          <div
            className="rounded-lg shadow-2xl overflow-hidden flex-shrink-0"
            style={{
              width: width * previewScale,
              height: height * previewScale,
              boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)'
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
              <KindleTemplate highlight={highlight} />
            </div>
          </div>
        </div>

        {/* Actions - simplified */}
        <div className="px-6 py-4 border-t border-[#1a1a1a] flex gap-3">
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

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <UpgradeModal
            onClose={() => setShowUpgradeModal(false)}
            onUpgrade={handleUpgrade}
            isLoading={isUpgrading}
            feature="export"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
