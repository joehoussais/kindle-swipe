import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BACKGROUNDS } from '../utils/backgrounds';
import { bookmarkletCode } from '../utils/kindleBookmarklet';

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
  const [bgLoaded, setBgLoaded] = useState(false);
  const [userPath, setUserPath] = useState(null); // null = choosing, 'kindle' = has kindle, 'explore' = no kindle
  const [activeTab, setActiveTab] = useState('kindle'); // 'kindle', 'journal', 'tweets', 'thought'

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

  // Listen for postMessage from Kindle bookmarklet
  useEffect(() => {
    const handleMessage = (event) => {
      // Only accept messages from Amazon's Kindle Notebook
      if (!event.origin.includes('amazon.com')) return;

      if (event.data?.type === 'kindle-highlights-import' && event.data?.data) {
        const exportData = event.data.data;
        if (exportData.source === 'kindle-notebook-scraper' && exportData.books) {
          // Convert to JSON string and import
          const jsonStr = JSON.stringify(exportData);
          const count = onImportAmazon(jsonStr);
          setImportResult({ type: 'cloud', count });
          setTimeout(() => setImportResult(null), 3000);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onImportAmazon]);

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

  // Determine text colors based on background theme
  const isDark = background.theme === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-white/60' : 'text-gray-600';
  const textMuted = isDark ? 'text-white/40' : 'text-gray-500';
  const borderColor = isDark ? 'border-white/20' : 'border-gray-400/50';
  const bgCard = isDark ? 'bg-black/40' : 'bg-white/60';

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
            Highlight
          </h1>
          <p
            className={`text-lg ${textSecondary}`}
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              textShadow: isDark ? '0 1px 10px rgba(0,0,0,0.5)' : 'none'
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
              className={`w-full p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 text-left
                         ${borderColor} ${bgCard} hover:ring-2 hover:ring-[#2383e2]/60`}
              style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">◈</span>
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
              className={`w-full p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 text-left
                         ${borderColor} ${bgCard} hover:ring-2 hover:ring-[#2383e2]/60`}
              style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl text-[#2383e2]">&#10022;</span>
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
                      <span key={tag} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'} ${textSecondary}`}>
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
                           ? `${borderColor} ${bgCard} ring-2 ring-[#2383e2]/60`
                           : `${borderColor} ${bgCard} opacity-60 hover:opacity-100`
                         }`}
            >
              <span className={`text-lg mr-1 ${activeTab === tab.id ? 'text-[#2383e2]' : ''}`}>{tab.icon}</span>
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
                  ? `border-[#2383e2] ${isDark ? 'bg-[#2383e2]/20' : 'bg-[#2383e2]/30'}`
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
                <div className="text-4xl mb-4 text-[#2383e2]">◈</div>
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
                             ${borderColor} ${bgCard} hover:bg-opacity-80`}
                  style={{
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl text-[#4CAF50]">☁</span>
                    <div>
                      <h3
                        className={`font-semibold text-sm ${textPrimary}`}
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      >
                        Kindle Cloud
                      </h3>
                      <p className={`text-xs ${textSecondary}`}>
                        Auto-sync all books
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
                    <span className="text-xl text-[#2383e2]">⟡</span>
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
                  <span className="text-xl text-[#2383e2]">❖</span>
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
              <div className="text-4xl mb-4 text-[#2383e2]">𝕏</div>
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
              <div className="text-4xl mb-4 text-[#2383e2]">▣</div>
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
              <div className="text-4xl mb-4 text-[#2383e2]">◇</div>
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
              <li>Find <code className={`${isDark ? 'bg-black/30' : 'bg-black/10'} px-1 rounded`}>documents/My Clippings.txt</code></li>
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
                       bg-[#2383e2]/20 border border-[#2383e2]/50 text-[#2383e2] backdrop-blur-sm"
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
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80"
            onClick={() => setShowPasteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-[#191919] rounded-2xl p-6 border border-[#252525]"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4 text-[#ffffffeb]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Import from Amazon</h2>

              <p className="text-[#9b9a97] text-sm mb-4">
                Go to{' '}
                <a
                  href="https://read.amazon.com/notebook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2383e2] hover:underline"
                >
                  read.amazon.com/notebook
                </a>
                {' '}and copy-paste your highlights:
              </p>

              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Paste your highlights here..."
                className="w-full h-48 p-4 rounded-xl bg-[#0a0a0a] border border-[#ffffff14]
                           focus:border-[#2383e2] focus:outline-none resize-none
                           font-mono text-sm text-[#ffffffeb]"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowPasteModal(false)}
                  className="flex-1 py-3 rounded-xl bg-[#252525] hover:bg-[#ffffff14] transition text-[#ffffffeb]"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pasteContent.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#2383e2] hover:bg-[#b08c6a]
                             disabled:opacity-50 disabled:cursor-not-allowed transition text-[#191919] font-medium"
                >
                  Import
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kindle Cloud modal with bookmarklet */}
      <AnimatePresence>
        {showCloudModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80"
            onClick={() => setShowCloudModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-[#191919] rounded-2xl p-6 border border-[#252525] max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4 text-[#ffffffeb]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Import from Kindle Cloud
              </h2>

              <div className="space-y-4 mb-6">
                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4CAF50] text-white text-sm flex items-center justify-center font-medium">1</div>
                  <div>
                    <p className="text-[#ffffffeb] text-sm font-medium">Save this bookmarklet</p>
                    <p className="text-[#9b9a97] text-xs mt-1">Drag this button to your bookmarks bar:</p>
                    <a
                      href={bookmarkletCode}
                      className="inline-block mt-2 px-4 py-2 bg-[#4CAF50] text-white rounded-lg text-sm font-medium
                                 hover:bg-[#43a047] transition cursor-grab active:cursor-grabbing"
                      onClick={(e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(bookmarkletCode);
                        alert('Bookmarklet code copied! Create a new bookmark and paste this as the URL.');
                      }}
                    >
                      Get Kindle Highlights
                    </a>
                    <p className="text-[#9b9a97] text-xs mt-1 italic">
                      Can't drag? Click to copy, then create a bookmark and paste as URL.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4CAF50]/60 text-white text-sm flex items-center justify-center font-medium">2</div>
                  <div>
                    <p className="text-[#ffffffeb] text-sm font-medium">Go to Kindle Notebook</p>
                    <p className="text-[#9b9a97] text-xs mt-1">
                      Open{' '}
                      <a
                        href="https://read.amazon.com/notebook"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2383e2] hover:underline"
                      >
                        read.amazon.com/notebook
                      </a>
                      {' '}and sign in.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4CAF50]/40 text-white text-sm flex items-center justify-center font-medium">3</div>
                  <div>
                    <p className="text-[#ffffffeb] text-sm font-medium">Run the bookmarklet</p>
                    <p className="text-[#9b9a97] text-xs mt-1">
                      Click the bookmarklet. It will automatically cycle through all your books and copy the highlights.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4CAF50]/20 text-white text-sm flex items-center justify-center font-medium">4</div>
                  <div>
                    <p className="text-[#ffffffeb] text-sm font-medium">Paste your highlights below</p>
                  </div>
                </div>
              </div>

              <textarea
                value={cloudContent}
                onChange={(e) => setCloudContent(e.target.value)}
                placeholder='Paste the JSON from the bookmarklet here (Cmd/Ctrl+V)...'
                className="w-full h-32 p-4 rounded-xl bg-[#0a0a0a] border border-[#ffffff14]
                           focus:border-[#4CAF50] focus:outline-none resize-none
                           font-mono text-xs text-[#ffffffeb]"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowCloudModal(false)}
                  className="flex-1 py-3 rounded-xl bg-[#252525] hover:bg-[#ffffff14] transition text-[#ffffffeb]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloudSubmit}
                  disabled={!cloudContent.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#4CAF50] hover:bg-[#43a047]
                             disabled:opacity-50 disabled:cursor-not-allowed transition text-white font-medium"
                >
                  Import Highlights
                </button>
              </div>

              <p className="text-[#9b9a97] text-xs text-center mt-4">
                This runs entirely in your browser - no data sent to any server.
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
              className="w-full max-w-lg bg-[#191919] rounded-2xl p-6 border border-[#252525]"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4 text-[#ffffffeb]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Import Journal</h2>

              <input
                type="text"
                value={journalName}
                onChange={(e) => setJournalName(e.target.value)}
                placeholder="Journal name (optional)"
                className="w-full p-3 rounded-xl bg-[#0a0a0a] border border-[#ffffff14]
                           focus:border-[#2383e2] focus:outline-none mb-3 text-[#ffffffeb]"
              />

              <textarea
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                placeholder="Paste your journal entries here, separated by blank lines..."
                className="w-full h-48 p-4 rounded-xl bg-[#0a0a0a] border border-[#ffffff14]
                           focus:border-[#2383e2] focus:outline-none resize-none text-[#ffffffeb]"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowJournalModal(false)}
                  className="flex-1 py-3 rounded-xl bg-[#252525] hover:bg-[#ffffff14] transition text-[#ffffffeb]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJournalSubmit}
                  disabled={!journalContent.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#2383e2] hover:bg-[#b08c6a]
                             disabled:opacity-50 disabled:cursor-not-allowed transition text-[#191919] font-medium"
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
              className="w-full max-w-lg bg-[#191919] rounded-2xl p-6 border border-[#252525]"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4 text-[#ffffffeb]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Capture a Thought</h2>

              <p className="text-[#9b9a97] text-sm mb-4">
                What's on your mind? This will appear later as you swipe through your highlights.
              </p>

              <textarea
                value={thoughtContent}
                onChange={(e) => setThoughtContent(e.target.value)}
                placeholder="Write your thought..."
                className="w-full h-36 p-4 rounded-xl bg-[#0a0a0a] border border-[#ffffff14]
                           focus:border-[#2383e2] focus:outline-none resize-none text-[#ffffffeb]"
                autoFocus
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowThoughtModal(false)}
                  className="flex-1 py-3 rounded-xl bg-[#252525] hover:bg-[#ffffff14] transition text-[#ffffffeb]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleThoughtSubmit}
                  disabled={!thoughtContent.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#2383e2] hover:bg-[#b08c6a]
                             disabled:opacity-50 disabled:cursor-not-allowed transition text-[#191919] font-medium"
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
              className="w-full max-w-lg bg-[#191919] rounded-2xl p-6 border border-[#252525]"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4 text-[#ffffffeb]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Import Tweets</h2>

              <p className="text-[#9b9a97] text-sm mb-4">
                Paste your bookmarked tweets. Format each as:<br/>
                <code className="text-[#2383e2]">@username: tweet text</code><br/>
                Or paste a JSON export from X.
              </p>

              <textarea
                value={tweetsContent}
                onChange={(e) => setTweetsContent(e.target.value)}
                placeholder="@naval: The goal of meditation is not to control your thoughts, it's to stop letting them control you."
                className="w-full h-48 p-4 rounded-xl bg-[#0a0a0a] border border-[#ffffff14]
                           focus:border-[#2383e2] focus:outline-none resize-none text-[#ffffffeb] font-mono text-sm"
                autoFocus
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowTweetsModal(false)}
                  className="flex-1 py-3 rounded-xl bg-[#252525] hover:bg-[#ffffff14] transition text-[#ffffffeb]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTweetsSubmit}
                  disabled={!tweetsContent.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#2383e2] hover:bg-[#b08c6a]
                             disabled:opacity-50 disabled:cursor-not-allowed transition text-[#191919] font-medium"
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
