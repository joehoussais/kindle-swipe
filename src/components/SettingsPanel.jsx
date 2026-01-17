import { motion } from 'framer-motion';

export function SettingsPanel({ onClose, onClear, onImportMore, onOpenLibrary, onOpenBooksHistory, onShare, onLogout, stats, recallStats, user }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[#191919] border-r border-[#252525]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header with user info */}
          <div className="p-4 border-b border-[#252525]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#ffffffeb]">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition text-[#9b9a97]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* User card */}
            {user && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#252525]/50 border border-[#ffffff14]">
                <div className="w-10 h-10 rounded-full bg-[#ffffff14] flex items-center justify-center text-[#2383e2] font-medium border border-[#37352f]">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#ffffffeb] font-medium truncate">{user.name}</p>
                  <p className="text-[#787774] text-sm truncate">{user.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="p-4 border-b border-[#252525]">
            <h3 className="text-xs font-medium text-[#787774] uppercase tracking-wider mb-3">Your Collection</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#252525]/50 rounded-lg p-4 border border-[#ffffff14]">
                <div className="text-2xl font-light text-[#2383e2]">
                  {stats.totalHighlights}
                </div>
                <div className="text-xs text-[#787774] mt-1">Passages</div>
              </div>
              <div className="bg-[#252525]/50 rounded-lg p-4 border border-[#ffffff14]">
                <div className="text-2xl font-light text-[#2383e2]">
                  {stats.totalBooks}
                </div>
                <div className="text-xs text-[#787774] mt-1">Sources</div>
              </div>
            </div>
          </div>

          {/* Recall Stats */}
          {recallStats && (
            <div className="p-4 border-b border-[#252525]">
              <h3 className="text-xs font-medium text-[#787774] uppercase tracking-wider mb-3">Memory Integration</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#252525]/50 rounded-lg p-3 border border-[#ffffff14] text-center">
                  <div className="text-xl font-light text-green-400">
                    {recallStats.highIntegration}
                  </div>
                  <div className="text-xs text-[#787774] mt-1">Strong</div>
                </div>
                <div className="bg-[#252525]/50 rounded-lg p-3 border border-[#ffffff14] text-center">
                  <div className="text-xl font-light text-yellow-400">
                    {recallStats.mediumIntegration}
                  </div>
                  <div className="text-xs text-[#787774] mt-1">Building</div>
                </div>
                <div className="bg-[#252525]/50 rounded-lg p-3 border border-[#ffffff14] text-center">
                  <div className="text-xl font-light text-red-400">
                    {recallStats.lowIntegration}
                  </div>
                  <div className="text-xs text-[#787774] mt-1">Fading</div>
                </div>
              </div>
              {recallStats.totalChallenges > 0 && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-[#787774]">Challenges completed</span>
                  <span className="text-[#ffffffeb]">
                    {recallStats.successfulChallenges}/{recallStats.totalChallenges}
                    <span className="text-[#787774] ml-1">
                      ({Math.round(recallStats.successfulChallenges / recallStats.totalChallenges * 100)}%)
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Top sources */}
          {stats.bookCounts.length > 0 && (
            <div className="p-4 border-b border-[#252525] flex-1 overflow-y-auto">
              <h3 className="text-xs font-medium text-[#787774] uppercase tracking-wider mb-3">Most Read</h3>
              <div className="space-y-1">
                {stats.bookCounts.slice(0, 10).map((book, i) => (
                  <div
                    key={book.title}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#252525]/30 transition"
                  >
                    <span className="text-[#37352f] text-xs w-4 font-light">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#ffffffeb] truncate">{book.title}</div>
                      <div className="text-xs text-[#787774]">{book.count} passages</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-4 space-y-2 mt-auto">
            <button
              onClick={onOpenLibrary}
              className="w-full py-3 px-4 rounded-lg bg-[#252525]/50 hover:bg-[#252525]
                         border border-[#ffffff14] transition text-[#ffffffeb] text-sm
                         flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-[#9b9a97]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Browse Library
            </button>

            <button
              onClick={onOpenBooksHistory}
              className="w-full py-3 px-4 rounded-lg bg-[#252525]/50 hover:bg-[#252525]
                         border border-[#ffffff14] transition text-[#ffffffeb] text-sm
                         flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-[#9b9a97]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Reading History
            </button>

            <button
              onClick={() => {
                onShare();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[#2383e2] to-[#2383e2]
                         hover:from-[#b08c6a] hover:to-[#d4b892] transition text-[#191919] text-sm font-medium
                         flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share My Top 5
            </button>

            <button
              onClick={onImportMore}
              className="w-full py-3 px-4 rounded-lg bg-[#252525]/50 hover:bg-[#252525]
                         border border-[#ffffff14] transition text-[#ffffffeb] text-sm
                         flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-[#9b9a97]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              Add More Content
            </button>

            <div className="pt-2 border-t border-[#252525] mt-3">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                    onClear();
                  }
                }}
                className="w-full py-2.5 px-4 rounded-lg hover:bg-[#252525]/50
                           text-[#787774] hover:text-[#2383e2] transition text-sm"
              >
                Clear All Data
              </button>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to sign out?')) {
                    onLogout();
                  }
                }}
                className="w-full py-2.5 px-4 rounded-lg hover:bg-[#252525]/50
                           text-[#787774] hover:text-[#ffffffeb] transition text-sm
                           flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 text-center text-xs text-[#37352f] italic">
            Highlight · MMXXV
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
