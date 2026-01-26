import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateBookmarkletCode } from '../utils/kindleBookmarklet';

export function DropZone({ onImportClippings, onImportAmazon, onImportJournal, onImportTweets, onLoadStarterPack, onAddThought }) {
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showThoughtModal, setShowThoughtModal] = useState(false);
  const [showTweetsModal, setShowTweetsModal] = useState(false);
  const [cloudContent, setCloudContent] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [journalName, setJournalName] = useState('');
  const [thoughtContent, setThoughtContent] = useState('');
  const [tweetsContent, setTweetsContent] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [userPath, setUserPath] = useState(null); // null = choosing, 'kindle' = has kindle, 'explore' = no kindle
  const [activeTab, setActiveTab] = useState('kindle'); // 'kindle', 'journal', 'tweets', 'thought'
  const [waitingForKindle, setWaitingForKindle] = useState(false);
  const [bookmarkletCopied, setBookmarkletCopied] = useState(false);
  const kindleWindowRef = useRef(null);

  // Generate bookmarklet code with current origin
  const bookmarkletCode = generateBookmarkletCode();

  // Listen for postMessage from Kindle bookmarklet
  useEffect(() => {
    const handleMessage = (event) => {
      // Accept messages from Amazon's Kindle Notebook (when using postMessage from popup)
      // The bookmarklet sends to our origin, so we check the message type instead
      if (event.data?.type === 'kindle-highlights-import' && event.data?.data) {
        const exportData = event.data.data;
        if (exportData.source === 'kindle-notebook-scraper' && exportData.books) {
          // Convert to JSON string and import
          const jsonStr = JSON.stringify(exportData);
          const count = onImportAmazon(jsonStr);
          setImportResult({ type: 'cloud', count });
          setWaitingForKindle(false);
          setShowCloudModal(false);
          setTimeout(() => setImportResult(null), 3000);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onImportAmazon]);

  // Check for pending highlights in localStorage (fallback mechanism)
  useEffect(() => {
    const checkPendingHighlights = () => {
      try {
        const pending = localStorage.getItem('kindle-highlights-pending');
        if (pending) {
          const exportData = JSON.parse(pending);
          if (exportData.source === 'kindle-notebook-scraper' && exportData.books) {
            const count = onImportAmazon(pending);
            setImportResult({ type: 'cloud', count });
            setWaitingForKindle(false);
            setShowCloudModal(false);
            localStorage.removeItem('kindle-highlights-pending');
            setTimeout(() => setImportResult(null), 3000);
          }
        }
      } catch (e) {
        console.error('Error checking pending highlights:', e);
      }
    };

    // Check immediately and also on window focus
    checkPendingHighlights();
    window.addEventListener('focus', checkPendingHighlights);
    return () => window.removeEventListener('focus', checkPendingHighlights);
  }, [onImportAmazon]);

  // Open Kindle Notebook in a new tab (NOT popup - so bookmarks bar is visible!)
  const openKindleNotebook = useCallback((e) => {
    if (e) e.preventDefault();
    // Open in a regular new tab so the user can see their bookmarks bar
    kindleWindowRef.current = window.open('https://read.amazon.com/notebook', '_blank');
  }, []);

  // Copy bookmarklet to clipboard
  const copyBookmarklet = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletCode);
      setBookmarkletCopied(true);
      setTimeout(() => setBookmarkletCopied(false), 2000);
    } catch (e) {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = bookmarkletCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setBookmarkletCopied(true);
      setTimeout(() => setBookmarkletCopied(false), 2000);
    }
  }, [bookmarkletCode]);

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
    setImportResult({ type: 'kindle', count });
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

  const handleCloudSubmit = () => {
    if (cloudContent.trim()) {
      const count = onImportAmazon(cloudContent);
      setImportResult({ type: 'cloud', count });
      setCloudContent('');
      setShowCloudModal(false);
      setTimeout(() => setImportResult(null), 3000);
    }
  };

  const handleJournalSubmit = () => {
    if (journalContent.trim() && onImportJournal) {
      const count = onImportJournal(journalContent, journalName || 'Journal');
      setImportResult({ type: 'journal', count });
      setJournalContent('');
      setJournalName('');
      setShowJournalModal(false);
      setTimeout(() => setImportResult(null), 3000);
    }
  };

  const handleThoughtSubmit = () => {
    if (thoughtContent.trim() && onAddThought) {
      onAddThought(thoughtContent);
      setImportResult({ type: 'thought', count: 1 });
      setThoughtContent('');
      setShowThoughtModal(false);
      setTimeout(() => setImportResult(null), 3000);
    }
  };

  const handleTweetsSubmit = () => {
    if (tweetsContent.trim() && onImportTweets) {
      const count = onImportTweets(tweetsContent);
      setImportResult({ type: 'tweets', count });
      setTweetsContent('');
      setShowTweetsModal(false);
      setTimeout(() => setImportResult(null), 3000);
    }
  };

  // Use consistent light theme
  const textPrimary = 'text-gray-900';
  const textSecondary = 'text-gray-600';
  const textMuted = 'text-gray-400';
  const borderColor = 'border-gray-200';
  const bgCard = 'bg-white';

  const getResultMessage = () => {
    if (!importResult) return '';
    switch (importResult.type) {
      case 'kindle':
      case 'amazon':
      case 'cloud':
        return `Imported ${importResult.count} highlights!`;
      case 'journal':
        return `Imported ${importResult.count} journal entries!`;
      case 'thought':
        return 'Thought captured!';
      case 'tweets':
        return `Imported ${importResult.count} tweets!`;
      default:
        return `Imported ${importResult.count} items!`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gray-50">
      {/* Subtle gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(45, 55, 72, 0.02) 0%, transparent 50%)'
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
              fontFamily: "'Playfair Display', Georgia, serif"
            }}
          >
            Highlight
          </h1>
          <p
            className={`text-lg ${textSecondary}`}
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic'
            }}
          >
            {userPath === null ? "Rediscover what you've read" : 'Import your highlights'}
          </p>
        </motion.div>

        {/* Initial choice: Kindle or Explore */}
        {userPath === null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* I have a Kindle option */}
            <button
              onClick={() => setUserPath('kindle')}
              className={`w-full p-6 rounded-2xl border transition-all duration-300 text-left shadow-lucis
                         ${borderColor} ${bgCard} hover:shadow-lucis-lg hover:border-gray-300`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl text-gray-600">◈</span>
                <div>
                  <h3
                    className={`text-xl font-semibold mb-2 ${textPrimary}`}
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    I have a Kindle
                  </h3>
                  <p className={`text-sm ${textSecondary}`}>
                    Import your highlights from Kindle, Amazon Cloud, or other reading apps
                  </p>
                </div>
              </div>
            </button>

            {/* No Kindle - Explore option */}
            <button
              onClick={() => {
                onLoadStarterPack();
              }}
              className={`w-full p-6 rounded-2xl border transition-all duration-300 text-left shadow-lucis
                         ${borderColor} ${bgCard} hover:shadow-lucis-lg hover:border-gray-300`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl text-[#2d3748]">&#10022;</span>
                <div>
                  <h3
                    className={`text-xl font-semibold mb-2 ${textPrimary}`}
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Explore Great Ideas
                  </h3>
                  <p className={`text-sm ${textSecondary}`}>
                    Start with curated wisdom from history's greatest books. Add your own quotes as you discover them.
                  </p>
                  <div className={`mt-3 flex flex-wrap gap-2`}>
                    {['Stoicism', 'Philosophy', 'Literature', 'Psychology'].map(tag => (
                      <span key={tag} className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${textSecondary}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>

            <p className={`text-center text-xs ${textMuted} mt-6`}>
              You can always import more later from Settings
            </p>
          </motion.div>
        )}

        {/* Source tabs - only show after choosing Kindle path */}
        {userPath === 'kindle' && (
          <>
            {/* Back button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setUserPath(null)}
              className={`mb-4 text-sm ${textSecondary} hover:${textPrimary} transition flex items-center gap-1`}
            >
              <span>&#8592;</span> Back to options
            </motion.button>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 mb-4"
        >
          {[
            { id: 'kindle', icon: '◈', label: 'Kindle' },
            { id: 'tweets', icon: '𝕏', label: 'Tweets' },
            { id: 'journal', icon: '▣', label: 'Journal' },
            { id: 'thought', icon: '◇', label: 'Thought' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-2 rounded-xl backdrop-blur-sm border transition-all duration-300
                         ${activeTab === tab.id
                           ? `${borderColor} ${bgCard} ring-2 ring-[#2d3748]/30`
                           : `${borderColor} ${bgCard} opacity-60 hover:opacity-100`
                         }`}
            >
              <span className={`text-lg mr-1 ${activeTab === tab.id ? 'text-[#2d3748]' : ''}`}>{tab.icon}</span>
              <span className={`text-xs font-medium ${textPrimary}`}>{tab.label}</span>
            </button>
          ))}
        </motion.div>
          </>
        )}

        {/* Kindle import */}
        {userPath === 'kindle' && activeTab === 'kindle' && (
          <>
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
                  ? 'border-[#2d3748] bg-[#2d3748]/10'
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
                <div className="text-4xl mb-4 text-[#2d3748]">◈</div>
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

              <div className="flex gap-3 mb-3">
                {/* Kindle Cloud import - auto scraper */}
                <button
                  onClick={() => setShowCloudModal(true)}
                  className={`flex-1 py-4 px-4 rounded-xl backdrop-blur-sm
                             border transition-all duration-300 text-left
                             ${borderColor} ${bgCard} hover:bg-opacity-80 hover:ring-2 hover:ring-[#4CAF50]/50`}
                  style={{
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✨</span>
                    <div>
                      <h3
                        className={`font-semibold text-sm ${textPrimary}`}
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      >
                        Magic Import
                      </h3>
                      <p className={`text-xs ${textSecondary}`}>
                        One-click sync
                      </p>
                    </div>
                  </div>
                </button>

                {/* Amazon import - manual paste */}
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
                    <span className="text-xl text-[#2d3748]">⟡</span>
                    <div>
                      <h3
                        className={`font-semibold text-sm ${textPrimary}`}
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      >
                        Copy & Paste
                      </h3>
                      <p className={`text-xs ${textSecondary}`}>
                        Manual import
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Just Start with starter pack */}
              <button
                onClick={onLoadStarterPack}
                className={`w-full py-4 px-4 rounded-xl backdrop-blur-sm
                           border transition-all duration-300 text-left
                           ${borderColor} ${bgCard} hover:bg-opacity-80`}
                style={{
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xl text-[#2d3748]">❖</span>
                  <div>
                    <h3
                      className={`font-semibold text-sm ${textPrimary}`}
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      Just Start with 100 Classic Quotes
                    </h3>
                  </div>
                </div>
              </button>
            </motion.div>

        {/* Tweets import */}
        {userPath === 'kindle' && activeTab === 'tweets' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl p-6 backdrop-blur-sm ${bgCard}`}
            style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
          >
            <div className="text-center mb-6">
              <div className="text-4xl mb-4 text-[#2d3748]">𝕏</div>
              <h3
                className={`text-xl font-semibold mb-2 ${textPrimary}`}
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Import Bookmarked Tweets
              </h3>
              <p className={`text-sm ${textSecondary}`}>
                Wisdom from the digital agora
              </p>
            </div>

            <button
              onClick={() => setShowTweetsModal(true)}
              className={`w-full py-4 rounded-xl border ${borderColor} ${textPrimary}
                         hover:bg-white/10 transition-all`}
            >
              Paste Tweets
            </button>

            <p className={`text-xs ${textMuted} text-center mt-4`}>
              Paste tweets as text, or JSON export from X
            </p>
          </motion.div>
        )}

        {/* Journal import */}
        {userPath === 'kindle' && activeTab === 'journal' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl p-6 backdrop-blur-sm ${bgCard}`}
            style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
          >
            <div className="text-center mb-6">
              <div className="text-4xl mb-4 text-[#2d3748]">▣</div>
              <h3
                className={`text-xl font-semibold mb-2 ${textPrimary}`}
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Import Journal Entries
              </h3>
              <p className={`text-sm ${textSecondary}`}>
                Paste your journal entries, separated by blank lines
              </p>
            </div>

            <button
              onClick={() => setShowJournalModal(true)}
              className={`w-full py-4 rounded-xl border ${borderColor} ${textPrimary}
                         hover:bg-white/10 transition-all`}
            >
              Paste Journal Entries
            </button>

            <p className={`text-xs ${textMuted} text-center mt-4`}>
              Supports plain text exports from Day One, Bear, Apple Notes, etc.
            </p>
          </motion.div>
        )}

        {/* Quick thought capture */}
        {userPath === 'kindle' && activeTab === 'thought' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl p-6 backdrop-blur-sm ${bgCard}`}
            style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
          >
            <div className="text-center mb-6">
              <div className="text-4xl mb-4 text-[#2d3748]">◇</div>
              <h3
                className={`text-xl font-semibold mb-2 ${textPrimary}`}
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Capture a Thought
              </h3>
              <p className={`text-sm ${textSecondary}`}>
                A fleeting idea, a moment of clarity, a note to your future self
              </p>
            </div>

            <button
              onClick={() => setShowThoughtModal(true)}
              className={`w-full py-4 rounded-xl border ${borderColor} ${textPrimary}
                         hover:bg-white/10 transition-all`}
            >
              Write a Thought
            </button>

            <p className={`text-xs ${textMuted} text-center mt-4`}>
              Voice input coming soon
            </p>
          </motion.div>
        )}

        {/* Instructions */}
        {userPath === 'kindle' && activeTab === 'kindle' && (
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
              <li>Find <code className="bg-gray-200 px-1 rounded">documents/My Clippings.txt</code></li>
              <li>Drag and drop it here</li>
            </ol>
          </motion.div>
        )}
          </>
        )}
      </div>

      {/* Import result toast */}
      <AnimatePresence>
        {importResult && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full
                       bg-[#2d3748] text-white shadow-lucis-lg"
          >
            {getResultMessage()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Amazon paste modal */}
      <AnimatePresence>
        {showPasteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30"
            onClick={() => setShowPasteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-2xl p-6 border border-gray-200 shadow-lucis-xl"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Import from Amazon</h2>

              <p className="text-gray-600 text-sm mb-4">
                Go to{' '}
                <a
                  href="https://read.amazon.com/notebook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2d3748] font-medium hover:underline"
                >
                  read.amazon.com/notebook
                </a>
                {' '}and copy-paste your highlights:
              </p>

              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Paste your highlights here..."
                className="w-full h-48 p-4 rounded-xl bg-gray-50 border border-gray-200
                           focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none
                           font-mono text-sm text-gray-900"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowPasteModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pasteContent.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#2d3748] hover:bg-[#1a202c]
                             disabled:opacity-50 disabled:cursor-not-allowed transition text-white font-medium"
                >
                  Import
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kindle Cloud modal with bookmarklet - STREAMLINED */}
      <AnimatePresence>
        {showCloudModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80"
            onClick={() => { setShowCloudModal(false); setWaitingForKindle(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-2xl p-6 border border-gray-200 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-2 text-gray-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Import from Kindle Cloud
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                Choose the easiest method for you
              </p>

              {/* Waiting state */}
              {waitingForKindle ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4CAF50] border-t-transparent mb-4" />
                  <p className="text-gray-900 text-lg mb-2">Waiting for highlights...</p>
                  <p className="text-gray-600 text-sm mb-4">
                    Sign in to Amazon, then click your bookmarklet
                  </p>
                  <button
                    onClick={() => setWaitingForKindle(false)}
                    className="text-gray-600 text-sm hover:text-white transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  {/* TWO OPTIONS: Auto-scrape (recommended) or manual */}

                  {/* Option 1: BOOKMARKLET - Auto-scrapes ALL books */}
                  <div className="bg-gradient-to-r from-[#4CAF50]/20 to-[#8BC34A]/20 rounded-xl p-4 mb-4 border border-[#4CAF50]/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">✨</span>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-900 text-sm font-semibold">Auto-Import All Books</p>
                        <span className="px-2 py-0.5 bg-[#4CAF50] text-white text-[10px] font-bold rounded-full">RECOMMENDED</span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-xs mb-3 ml-7">
                      One-time bookmark setup, then imports ALL books with one click
                    </p>

                    <div className="space-y-3 ml-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#4CAF50] text-white text-[10px] flex items-center justify-center font-bold mt-0.5">1</div>
                        <div className="flex-1">
                          <p className="text-gray-900 text-xs mb-1.5">Drag this to your bookmarks bar:</p>
                          <div className="flex gap-2">
                            <a
                              href={bookmarkletCode}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#4CAF50] to-[#8BC34A] text-white rounded-lg text-xs font-semibold
                                         hover:from-[#43a047] hover:to-[#7cb342] transition shadow-md cursor-grab active:cursor-grabbing"
                              onClick={(e) => e.preventDefault()}
                              draggable="true"
                            >
                              ✨ Get All Highlights
                            </a>
                            <button
                              onClick={copyBookmarklet}
                              className={`px-3 py-2 rounded-lg text-xs transition ${
                                bookmarkletCopied
                                  ? 'bg-[#4CAF50]/20 text-[#4CAF50]'
                                  : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                              }`}
                            >
                              {bookmarkletCopied ? '✓ Copied!' : "Can't drag? Copy"}
                            </button>
                          </div>
                          <p className="text-gray-400 text-[10px] mt-1.5 italic">
                            If you copied: create a new bookmark, paste as the URL
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#4CAF50]/70 text-white text-[10px] flex items-center justify-center font-bold mt-0.5">2</div>
                        <div className="flex-1">
                          <a
                            href="https://read.amazon.com/notebook"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={openKindleNotebook}
                            className="inline-flex items-center gap-2 text-[#FF9900] hover:text-[#ffad33] text-xs font-medium"
                          >
                            Open Kindle Notebook
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                            </svg>
                          </a>
                          <p className="text-gray-600 text-[11px] mt-0.5">Sign in if needed</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#4CAF50]/50 text-white text-[10px] flex items-center justify-center font-bold mt-0.5">3</div>
                        <div className="flex-1">
                          <p className="text-gray-900 text-xs">
                            Click the bookmark - it auto-scrapes all books & copies to clipboard
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#4CAF50]/30 text-white text-[10px] flex items-center justify-center font-bold mt-0.5">4</div>
                        <div className="flex-1">
                          <p className="text-gray-900 text-xs">
                            Come back here and paste below
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-gray-400 text-[10px] uppercase tracking-wider">or import one book</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Option 2: Manual per-book copy-paste */}
                  <details className="group mb-4">
                    <summary className="text-gray-600 text-xs cursor-pointer hover:text-gray-900 transition flex items-center gap-2">
                      <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Copy-paste from one book at a time
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-600 text-[11px] mb-2">
                        1. Open a book in Kindle Notebook<br/>
                        2. Select all (<kbd className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">Cmd+A</kbd>), copy (<kbd className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">Cmd+C</kbd>)<br/>
                        3. Paste below - repeat for each book
                      </p>
                    </div>
                  </details>

                  {/* Paste area */}
                  <div className="mb-4">
                    <textarea
                      value={cloudContent}
                      onChange={(e) => setCloudContent(e.target.value)}
                      placeholder='Paste your highlights here (Cmd/Ctrl+V)...'
                      className="w-full h-28 p-3 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300
                                 focus:border-[#4CAF50] focus:outline-none resize-none
                                 text-sm text-gray-900 placeholder-gray-400"
                    />
                    <button
                      onClick={handleCloudSubmit}
                      disabled={!cloudContent.trim()}
                      className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#4CAF50] to-[#8BC34A]
                                 hover:from-[#43a047] hover:to-[#7cb342]
                                 disabled:opacity-40 disabled:cursor-not-allowed disabled:from-[#333] disabled:to-[#333]
                                 transition text-white font-semibold"
                    >
                      {cloudContent.trim() ? 'Import Highlights' : 'Paste highlights above'}
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCloudModal(false)}
                      className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition text-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}

              <p className="text-gray-600 text-xs text-center mt-4">
                100% private - runs in your browser, no data sent anywhere
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Journal paste modal */}
      <AnimatePresence>
        {showJournalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80"
            onClick={() => setShowJournalModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-2xl p-6 border border-gray-200"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Import Journal</h2>

              <input
                type="text"
                value={journalName}
                onChange={(e) => setJournalName(e.target.value)}
                placeholder="Journal name (optional)"
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200
                           focus:border-[#2d3748] focus:outline-none mb-3 text-gray-900"
              />

              <textarea
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                placeholder="Paste your journal entries here, separated by blank lines..."
                className="w-full h-48 p-4 rounded-xl bg-gray-50 border border-gray-200
                           focus:border-[#2d3748] focus:outline-none resize-none text-gray-900"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowJournalModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJournalSubmit}
                  disabled={!journalContent.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#2d3748] hover:bg-[#1a202c]
                             disabled:opacity-50 disabled:cursor-not-allowed transition text-white font-medium"
                >
                  Import
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thought capture modal */}
      <AnimatePresence>
        {showThoughtModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80"
            onClick={() => setShowThoughtModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-2xl p-6 border border-gray-200"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Capture a Thought</h2>

              <p className="text-gray-600 text-sm mb-4">
                What's on your mind? This will appear later as you swipe through your highlights.
              </p>

              <textarea
                value={thoughtContent}
                onChange={(e) => setThoughtContent(e.target.value)}
                placeholder="Write your thought..."
                className="w-full h-36 p-4 rounded-xl bg-gray-50 border border-gray-200
                           focus:border-[#2d3748] focus:outline-none resize-none text-gray-900"
                autoFocus
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowThoughtModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleThoughtSubmit}
                  disabled={!thoughtContent.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#2d3748] hover:bg-[#1a202c]
                             disabled:opacity-50 disabled:cursor-not-allowed transition text-white font-medium"
                >
                  Save Thought
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tweets import modal */}
      <AnimatePresence>
        {showTweetsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80"
            onClick={() => setShowTweetsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-2xl p-6 border border-gray-200"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Import Tweets</h2>

              <p className="text-gray-600 text-sm mb-4">
                Paste your bookmarked tweets. Format each as:<br/>
                <code className="text-[#2d3748]">@username: tweet text</code><br/>
                Or paste a JSON export from X.
              </p>

              <textarea
                value={tweetsContent}
                onChange={(e) => setTweetsContent(e.target.value)}
                placeholder="@naval: The goal of meditation is not to control your thoughts, it's to stop letting them control you."
                className="w-full h-48 p-4 rounded-xl bg-gray-50 border border-gray-200
                           focus:border-[#2d3748] focus:outline-none resize-none text-gray-900 font-mono text-sm"
                autoFocus
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowTweetsModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTweetsSubmit}
                  disabled={!tweetsContent.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#2d3748] hover:bg-[#1a202c]
                             disabled:opacity-50 disabled:cursor-not-allowed transition text-white font-medium"
                >
                  Import Tweets
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
