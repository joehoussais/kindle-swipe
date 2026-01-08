import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function DropZone({ onImportClippings, onImportAmazon }) {
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [importResult, setImportResult] = useState(null);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-lg w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Kindle Swipe
          </h1>
          <p className="text-gray-400 text-lg">
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
            transition-all duration-300 cursor-pointer
            ${isDragging
              ? 'border-purple-400 bg-purple-500/10'
              : 'border-gray-700 hover:border-gray-500 bg-white/5'
            }
          `}
        >
          <input
            type="file"
            accept=".txt"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="pointer-events-none">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">
              Drop My Clippings.txt here
            </h3>
            <p className="text-gray-400 text-sm">
              Connect your Kindle via USB and find this file in the documents folder
            </p>
          </div>
        </motion.div>

        {/* Amazon import option */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <div className="text-center text-gray-500 text-sm mb-4">or</div>

          <button
            onClick={() => setShowPasteModal(true)}
            className="w-full py-4 px-6 rounded-xl bg-white/5 hover:bg-white/10
                       border border-gray-700 hover:border-gray-600
                       transition-all duration-300 text-left"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🔗</span>
              <div>
                <h3 className="font-semibold">Import from Amazon</h3>
                <p className="text-gray-400 text-sm">
                  Paste Bookcision JSON or notebook HTML
                </p>
              </div>
            </div>
          </button>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-4 rounded-xl bg-white/5 text-sm text-gray-400"
        >
          <h4 className="font-medium text-gray-300 mb-2">Quick Start:</h4>
          <ol className="list-decimal list-inside space-y-1">
            <li>Connect your Kindle via USB</li>
            <li>Open the Kindle drive on your computer</li>
            <li>Find <code className="bg-black/30 px-1 rounded">documents/My Clippings.txt</code></li>
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
                       bg-green-500/20 border border-green-500/50 text-green-300"
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
              <h2 className="text-xl font-semibold mb-4">Import from Amazon</h2>

              <p className="text-gray-400 text-sm mb-4">
                Use{' '}
                <a
                  href="https://readwise.io/bookcision"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline"
                >
                  Bookcision
                </a>
                {' '}to export your highlights as JSON, then paste below:
              </p>

              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Paste Bookcision JSON here..."
                className="w-full h-48 p-4 rounded-xl bg-black/50 border border-gray-700
                           focus:border-purple-500 focus:outline-none resize-none
                           font-mono text-sm"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowPasteModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pasteContent.trim()}
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500
                             disabled:opacity-50 disabled:cursor-not-allowed transition"
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
