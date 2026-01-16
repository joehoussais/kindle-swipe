import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

// Get current month/year for display
function getCurrentMonthYear() {
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Truncate text with ellipsis
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function ShareModal({ highlights, onClose, userName }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [step, setStep] = useState('select'); // 'select' | 'preview'
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [imageBlob, setImageBlob] = useState(null);
  const templateRef = useRef(null);

  // Get highlights from this month for suggestions
  const thisMonthHighlights = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return highlights.filter(h => {
      const date = new Date(h.capturedAt || h.dateHighlighted);
      return date >= startOfMonth;
    });
  }, [highlights]);

  // Suggested highlights (most viewed or recent)
  const suggestedHighlights = useMemo(() => {
    // Sort by integration score (most engaged with) then by recency
    return [...highlights]
      .sort((a, b) => {
        const scoreA = a.integrationScore || 0;
        const scoreB = b.integrationScore || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.capturedAt || 0) - new Date(a.capturedAt || 0);
      })
      .slice(0, 20);
  }, [highlights]);

  const selectedHighlights = useMemo(() => {
    return highlights.filter(h => selectedIds.has(h.id));
  }, [highlights, selectedIds]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 5) {
        next.add(id);
      }
      return next;
    });
  };

  // Generate image blob from template
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
      const blob = imageBlob || await generateImage();
      if (!imageBlob) setImageBlob(blob);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `top-5-highlights-${new Date().toISOString().slice(0, 7)}.png`;
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
      const blob = imageBlob || await generateImage();
      if (!imageBlob) setImageBlob(blob);

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new window.ClipboardItem({ 'image/png': blob })
        ]);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 2000);
      } else {
        // Fallback to download
        await handleDownload();
      }
    } catch (err) {
      console.error('Copy failed:', err);
      await handleDownload();
    }
    setIsExporting(false);
  };

  // Share to Instagram Stories (mobile only - opens Instagram)
  const handleInstagramShare = async () => {
    setIsExporting(true);
    try {
      const blob = imageBlob || await generateImage();
      if (!imageBlob) setImageBlob(blob);

      // Check if Web Share API is available with files
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'highlights.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My Top 5 Highlights',
          });
          setIsExporting(false);
          return;
        }
      }

      // Fallback: download and show instructions
      await handleDownload();
      alert('Image downloaded! Open Instagram and share from your camera roll.');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Instagram share failed:', err);
        await handleDownload();
      }
    }
    setIsExporting(false);
  };

  // Share to X/Twitter
  const handleTwitterShare = async () => {
    setIsExporting(true);
    try {
      const blob = imageBlob || await generateImage();
      if (!imageBlob) setImageBlob(blob);

      // Check if Web Share API is available
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'highlights.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My Top 5 Highlights',
            text: 'My top 5 reading highlights this month',
          });
          setIsExporting(false);
          return;
        }
      }

      // Fallback: copy image and open Twitter compose
      await handleCopy();
      const tweetText = encodeURIComponent('My top 5 reading highlights this month ✨📚');
      window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Twitter share failed:', err);
      }
    }
    setIsExporting(false);
  };

  // Generic share (uses Web Share API)
  const handleGenericShare = async () => {
    setIsExporting(true);
    try {
      const blob = imageBlob || await generateImage();
      if (!imageBlob) setImageBlob(blob);

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'highlights.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My Top 5 Highlights',
            text: 'My top 5 reading highlights this month',
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
        className="w-full max-w-lg max-h-[90vh] bg-[#1a1916] rounded-2xl overflow-hidden border border-[#2d2a26] flex flex-col relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#2d2a26] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#ebe6dc]">
              {step === 'select' ? 'Share Your Top 5' : 'Preview'}
            </h2>
            <p className="text-sm text-[#6b5c4c]">
              {step === 'select'
                ? `Select ${5 - selectedIds.size} more highlight${5 - selectedIds.size !== 1 ? 's' : ''}`
                : 'Ready to share'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition text-[#8a8578]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {step === 'select' ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 max-h-[60vh] overflow-y-auto"
            >
              {/* Selected pills */}
              {selectedIds.size > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedHighlights.map((h, i) => (
                    <button
                      key={h.id}
                      onClick={() => toggleSelect(h.id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#a08060] text-[#1a1916] text-sm"
                    >
                      <span className="font-medium">{i + 1}</span>
                      <span className="truncate max-w-[150px]">{truncateText(h.text, 30)}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              {/* Highlight list */}
              <div className="space-y-2">
                {suggestedHighlights.map(h => {
                  const isSelected = selectedIds.has(h.id);
                  const isDisabled = !isSelected && selectedIds.size >= 5;

                  return (
                    <button
                      key={h.id}
                      onClick={() => !isDisabled && toggleSelect(h.id)}
                      disabled={isDisabled}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        isSelected
                          ? 'bg-[#a08060]/20 border-[#a08060]'
                          : isDisabled
                            ? 'bg-[#2d2a26]/30 border-[#2d2a26] opacity-50 cursor-not-allowed'
                            : 'bg-[#2d2a26]/50 border-[#3d3a36] hover:bg-[#2d2a26]'
                      }`}
                    >
                      <p className="text-sm text-[#ebe6dc] line-clamp-2">{h.text}</p>
                      <p className="text-xs text-[#6b5c4c] mt-1 truncate">
                        {h.title} {h.author && h.author !== 'You' ? `— ${h.author}` : ''}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4 flex flex-col items-center overflow-y-auto flex-shrink"
            >
              {/* Preview container - scaled down for display */}
              <div className="w-full max-w-[200px] aspect-[9/16] overflow-hidden rounded-lg shadow-2xl mx-auto">
                <div
                  ref={templateRef}
                  className="w-[1080px] h-[1920px] origin-top-left"
                  style={{ transform: 'scale(0.185)', transformOrigin: 'top left' }}
                >
                  <ShareTemplate
                    highlights={selectedHighlights}
                    userName={userName}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer - always visible */}
        <div className="p-4 border-t border-[#2d2a26] flex gap-3 flex-shrink-0">
          {step === 'select' ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-lg bg-[#2d2a26]/50 hover:bg-[#2d2a26]
                           border border-[#3d3a36] transition text-[#ebe6dc] text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('preview')}
                disabled={selectedIds.size !== 5}
                className={`flex-1 py-3 px-4 rounded-lg transition text-sm font-medium ${
                  selectedIds.size === 5
                    ? 'bg-[#a08060] hover:bg-[#b08c6a] text-[#1a1916]'
                    : 'bg-[#2d2a26]/50 border border-[#3d3a36] text-[#6b5c4c] cursor-not-allowed'
                }`}
              >
                Preview ({selectedIds.size}/5)
              </button>
            </>
          ) : (
            <div className="w-full space-y-3">
              {/* Share buttons row */}
              <div className="flex gap-2">
                {/* Instagram */}
                <button
                  onClick={handleInstagramShare}
                  disabled={isExporting}
                  className="flex-1 py-3 px-3 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]
                             hover:opacity-90 transition text-white text-sm font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Stories
                </button>

                {/* X/Twitter */}
                <button
                  onClick={handleTwitterShare}
                  disabled={isExporting}
                  className="flex-1 py-3 px-3 rounded-lg bg-black hover:bg-neutral-900
                             transition text-white text-sm font-medium flex items-center justify-center gap-2 border border-neutral-700"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Post
                </button>

                {/* More/Share */}
                <button
                  onClick={handleGenericShare}
                  disabled={isExporting}
                  className="flex-1 py-3 px-3 rounded-lg bg-[#2d2a26] hover:bg-[#3d3a36]
                             transition text-[#ebe6dc] text-sm font-medium flex items-center justify-center gap-2 border border-[#3d3a36]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  More
                </button>
              </div>

              {/* Secondary actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('select')}
                  className="py-2.5 px-4 rounded-lg bg-[#2d2a26]/50 hover:bg-[#2d2a26]
                             border border-[#3d3a36] transition text-[#8a8578] text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleCopy}
                  disabled={isExporting}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#2d2a26]/50 hover:bg-[#2d2a26]
                             border border-[#3d3a36] transition text-[#ebe6dc] text-sm flex items-center justify-center gap-2"
                >
                  {exportSuccess ? (
                    <>
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isExporting}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#2d2a26]/50 hover:bg-[#2d2a26]
                             border border-[#3d3a36] transition text-[#ebe6dc] text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Save
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
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// The shareable template (1080x1920 for stories)
function ShareTemplate({ highlights, userName }) {
  const monthYear = getCurrentMonthYear();

  return (
    <div
      className="w-[1080px] h-[1920px] relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0f0f0d 0%, #1a1916 50%, #0f0f0d 100%)',
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
      <div className="absolute inset-8 border border-[#3d3a36]/50 rounded-sm" />
      <div className="absolute inset-12 border border-[#3d3a36]/30 rounded-sm" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-16">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[#6b5c4c] text-2xl tracking-[0.3em] uppercase mb-4">
            My Top 5
          </p>
          <h1 className="text-[#ebe6dc] text-6xl font-light tracking-wide">
            {monthYear}
          </h1>
          <div className="w-24 h-px bg-[#a08060] mx-auto mt-8" />
        </div>

        {/* Highlights */}
        <div className="flex-1 flex flex-col justify-center space-y-8 px-8">
          {highlights.map((h, index) => (
            <div key={h.id} className="relative">
              {/* Number */}
              <div className="absolute -left-4 top-0 text-[#a08060]/30 text-8xl font-light leading-none">
                {index + 1}
              </div>

              {/* Quote */}
              <div className="pl-16">
                <p
                  className="text-[#ebe6dc] text-3xl font-light leading-relaxed italic"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  "{truncateText(h.text, 180)}"
                </p>
                <p className="text-[#8a8578] text-xl mt-3">
                  — {h.title}
                  {h.author && h.author !== 'You' && h.author !== 'Unknown' && (
                    <span className="text-[#6b5c4c]">, {h.author}</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="w-24 h-px bg-[#a08060] mx-auto mb-8" />
          {userName && (
            <p className="text-[#8a8578] text-2xl mb-3">
              Curated by {userName}
            </p>
          )}
          <p className="text-[#4d4a46] text-lg tracking-widest uppercase">
            Highlight
          </p>
        </div>
      </div>
    </div>
  );
}
