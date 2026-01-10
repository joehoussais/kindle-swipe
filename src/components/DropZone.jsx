import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BACKGROUNDS } from '../utils/backgrounds';

export function DropZone({ onImportClippings, onImportAmazon, onLoadStarterPack }) {
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [bgLoaded, setBgLoaded] = useState(false);

  // Pick a random background on mount
  const [background] = useState(() => {
    const randomIndex = Math.floor(Math.random() * BACKGROUNDS.length);
    return BACKGROUNDS[randomIndex];
  });

  // Preload background
  useEffect(() => {
    const img = new Image();
    img.onload = () => setBgLoaded(true);
    img.src = background.src;
  }, [background.src]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, []);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, []);

  const handleFile = async (file) => {
    const text = await file.text();
    const count = onImportClippings(text);
    setImportResult({ type: 'clippings', count });
    setTimeout(() => setImportResult(null), 3000);
  };

  const handlePasteSubmit = () => {
    if (pasteContent.trim()) {
      const count = onImportAmazon(pasteContent);
      setImportResult({ type: 'amazon', count });
      setPasteContent('');
      setShowPasteModal(false);
      setTimeout(() => setImportResult(null), 3000);
    }
  };

  // Determine text colors based on background theme
  const isDark = background.theme === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-white/60' : 'text-gray-600';
  const textMuted = isDark ? 'text-white/40' : 'text-gray-500';
  const borderColor = isDark ? 'border-white/20' : 'border-gray-400/50';
  const bgOverlay = isDark ? 'bg-black/30' : 'bg-white/40';
  const bgCard = isDark ? 'bg-black/40' : 'bg-white/60';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Full-screen background image */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          backgroundImage: `url(${background.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: bgLoaded ? 1 : 0
        }}
      />

      {/* Overlay for better text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)'
            : 'linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.5) 100%)'
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)'
        }}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-lg w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1
            className={`text-4xl font-bold mb-3 ${textPrimary}`}
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              textShadow: isDark ? '0 2px 20px rgba(0,0,0,0.5)' : '0 1px 10px rgba(255,255,255,0.5)'
            }}
          >
            Kindle Swipe
          </h1>
          <p
            className={`text-lg ${textSecondary}`}
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              textShadow: isDark ? '0 1px 10px rgba(0,0,0,0.5)' : 'none'
            }}
          >
            Your highlights, beautifully displayed
          </p>
        </motion.div>

        {/* Drop zone for file */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-2xl p-10 text-center
            transition-all duration-300 cursor-pointer backdrop-blur-sm
            ${isDragging
              ? `border-purple-400 ${isDark ? 'bg-purple-500/20' : 'bg-purple-500/30'}`
              : `${borderColor} hover:border-opacity-60 ${bgCard}`
            }
          `}
          style={{
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}
        >
          <input
            type="file"
            accept=".txt"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="pointer-events-none">
            <div className="text-5xl mb-4">📚</div>
            <h3
              className={`text-xl font-semibold mb-2 ${textPrimary}`}
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Drop My Clippings.txt here
            </h3>
            <p className={`text-sm ${textSecondary}`}>
              Connect your Kindle via USB and find this file in the documents folder
            </p>
          </div>
        </motion.div>

        {/* Other options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <div className={`text-center text-sm mb-4 ${textMuted}`}>or</div>

          <div className="flex gap-3">
            {/* Amazon import */}
            <button
              onClick={() => setShowPasteModal(true)}
              className={`flex-1 py-4 px-4 rounded-xl backdrop-blur-sm
                         border transition-all duration-300 text-left
                         ${borderColor} ${bgCard} hover:bg-opacity-80`}
              style={{
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔗</span>
                <div>
                  <h3
                    className={`font-semibold text-sm ${textPrimary}`}
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Import from Amazon
                  </h3>
                  <p className={`text-xs ${textSecondary}`}>
                    read.amazon.com/notebook
                  </p>
                </div>
              </div>
            </button>

            {/* Just Start with starter pack */}
            <button
              onClick={onLoadStarterPack}
              className={`flex-1 py-4 px-4 rounded-xl backdrop-blur-sm
                         border transition-all duration-300 text-left
                         ${borderColor} ${bgCard} hover:bg-opacity-80`}
              style={{
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <h3
                    className={`font-semibold text-sm ${textPrimary}`}
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Just Start
                  </h3>
                  <p className={`text-xs ${textSecondary}`}>
                    50 classic quotes
                  </p>
                </div>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`mt-8 p-4 rounded-xl backdrop-blur-sm text-sm ${bgCard} ${textSecondary}`}
          style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
        >
          <h4 className={`font-medium mb-2 ${textPrimary}`}>Quick Start:</h4>
          <ol className="list-decimal list-inside space-y-1">
            <li>Connect your Kindle via USB</li>
            <li>Open the Kindle drive on your computer</li>
            <li>Find <code className={`${isDark ? 'bg-black/30' : 'bg-black/10'} px-1 rounded`}>documents/My Clippings.txt</code></li>
            <li>Drag and drop it here</li>
          </ol>
        </motion.div>
      </div>

      {/* Import result toast */}
      <AnimatePresence>
        {importResult && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full
                       bg-green-500/20 border border-green-500/50 text-green-300 backdrop-blur-sm"
          >
            Imported {importResult.count} highlights!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paste modal */}
      <AnimatePresence>
        {showPasteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80"
            onClick={() => setShowPasteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-gray-900 rounded-2xl p-6 border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4 text-white">Import from Amazon</h2>

              <p className="text-gray-400 text-sm mb-4">
                Go to{' '}
                <a
                  href="https://read.amazon.com/notebook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline"
                >
                  read.amazon.com/notebook
                </a>
                {' '}and copy-paste your highlights:
              </p>

              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Paste your highlights here..."
                className="w-full h-48 p-4 rounded-xl bg-black/50 border border-gray-700
                           focus:border-purple-500 focus:outline-none resize-none
                           font-mono text-sm text-white"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowPasteModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pasteContent.trim()}
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500
                             disabled:opacity-50 disabled:cursor-not-allowed transition text-white"
                >
                  Import
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
