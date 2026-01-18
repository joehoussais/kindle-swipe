import { motion } from 'framer-motion';
import { CoinAvatar } from './CoinAvatar';

export function SettingsPanel({ onClose, onClear, onImportMore, onOpenLibrary, onOpenBooksHistory, onShare, onLogout, stats, recallStats, user }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white border-r border-[#e1e8ed]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header with user info */}
          <div className="p-4 border-b border-[#e1e8ed]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#14171a]">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[#e8f4fd] transition text-[#657786]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* User card */}
            {user && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f7f9fa] border border-[#e1e8ed]">
                <CoinAvatar type={user.avatar || 'augustus'} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-[#14171a] font-semibold truncate">{user.name}</p>
                  <p className="text-[#657786] text-sm truncate">{user.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="p-4 border-b border-[#e1e8ed]">
            <h3 className="text-xs font-semibold text-[#657786] uppercase tracking-wider mb-3">Your Collection</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f7f9fa] rounded-xl p-4 border border-[#e1e8ed]">
                <div className="text-2xl font-bold text-[#1da1f2]">
                  {stats.totalHighlights}
                </div>
                <div className="text-xs text-[#657786] mt-1">Passages</div>
              </div>
              <div className="bg-[#f7f9fa] rounded-xl p-4 border border-[#e1e8ed]">
                <div className="text-2xl font-bold text-[#1da1f2]">
                  {stats.totalBooks}
                </div>
                <div className="text-xs text-[#657786] mt-1">Sources</div>
              </div>
            </div>
          </div>

          {/* Recall Stats */}
          {recallStats && (
            <div className="p-4 border-b border-[#e1e8ed]">
              <h3 className="text-xs font-semibold text-[#657786] uppercase tracking-wider mb-3">Memory Integration</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#f7f9fa] rounded-xl p-3 border border-[#e1e8ed] text-center">
                  <div className="text-xl font-bold text-[#17bf63]">
                    {recallStats.highIntegration}
                  </div>
                  <div className="text-xs text-[#657786] mt-1">Strong</div>
                </div>
                <div className="bg-[#f7f9fa] rounded-xl p-3 border border-[#e1e8ed] text-center">
                  <div className="text-xl font-bold text-[#ffad1f]">
                    {recallStats.mediumIntegration}
                  </div>
                  <div className="text-xs text-[#657786] mt-1">Building</div>
                </div>
                <div className="bg-[#f7f9fa] rounded-xl p-3 border border-[#e1e8ed] text-center">
                  <div className="text-xl font-bold text-[#e0245e]">
                    {recallStats.lowIntegration}
                  </div>
                  <div className="text-xs text-[#657786] mt-1">Fading</div>
                </div>
              </div>
              {recallStats.totalChallenges > 0 && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-[#657786]">Challenges completed</span>
                  <span className="text-[#14171a] font-medium">
                    {recallStats.successfulChallenges}/{recallStats.totalChallenges}
                    <span className="text-[#657786] ml-1">
                      ({Math.round(recallStats.successfulChallenges / recallStats.totalChallenges * 100)}%)
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Top sources */}
          {stats.bookCounts.length > 0 && (
            <div className="p-4 border-b border-[#e1e8ed] flex-1 overflow-y-auto">
              <h3 className="text-xs font-semibold text-[#657786] uppercase tracking-wider mb-3">Most Read</h3>
              <div className="space-y-1">
                {stats.bookCounts.slice(0, 10).map((book, i) => (
                  <div
                    key={book.title}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f7f9fa] transition"
                  >
                    <span className="text-[#657786] text-xs w-4 font-medium">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#14171a] truncate">{book.title}</div>
                      <div className="text-xs text-[#657786]">{book.count} passages</div>
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
              className="w-full py-3 px-4 rounded-full bg-[#f7f9fa] hover:bg-[#e8f4fd]
                         border border-[#e1e8ed] transition text-[#14171a] text-sm font-medium
                         flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-[#657786]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Browse Library
            </button>

            <button
              onClick={onOpenBooksHistory}
              className="w-full py-3 px-4 rounded-full bg-[#f7f9fa] hover:bg-[#e8f4fd]
                         border border-[#e1e8ed] transition text-[#14171a] text-sm font-medium
                         flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-[#657786]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Reading History
            </button>

            <button
              onClick={() => {
                onShare();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-full bg-[#1da1f2] hover:bg-[#1a91da]
                         transition text-white text-sm font-bold
                         flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share My Top 5
            </button>

            <button
              onClick={onImportMore}
              className="w-full py-3 px-4 rounded-full bg-[#f7f9fa] hover:bg-[#e8f4fd]
                         border border-[#e1e8ed] transition text-[#14171a] text-sm font-medium
                         flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-[#657786]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              Add More Content
            </button>

            <div className="pt-2 border-t border-[#e1e8ed] mt-3">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                    onClear();
                  }
                }}
                className="w-full py-2.5 px-4 rounded-full hover:bg-[#ffeef1]
                           text-[#657786] hover:text-[#e0245e] transition text-sm"
              >
                Clear All Data
              </button>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to sign out?')) {
                    onLogout();
                  }
                }}
                className="w-full py-2.5 px-4 rounded-full hover:bg-[#f7f9fa]
                           text-[#657786] hover:text-[#14171a] transition text-sm
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
          <div className="p-4 text-center text-xs text-[#aab8c2] italic">
            Highlight · MMXXV
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
