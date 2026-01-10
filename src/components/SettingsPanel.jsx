import { motion } from 'framer-motion';

export function SettingsPanel({ onClose, onClear, onImportMore, onOpenLibrary, onOpenBooksHistory, onLogout, stats, user }) {
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
        className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gray-900 border-r border-gray-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header with user info */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* User card */}
            {user && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{user.name}</p>
                  <p className="text-white/50 text-sm truncate">{user.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Your Library</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-3xl font-bold text-purple-400">
                  {stats.totalHighlights}
                </div>
                <div className="text-sm text-gray-400">Highlights</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-3xl font-bold text-blue-400">
                  {stats.totalBooks}
                </div>
                <div className="text-sm text-gray-400">Books</div>
              </div>
            </div>
          </div>

          {/* Top books */}
          {stats.bookCounts.length > 0 && (
            <div className="p-4 border-b border-gray-800 flex-1 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Top Books</h3>
              <div className="space-y-2">
                {stats.bookCounts.slice(0, 10).map((book, i) => (
                  <div
                    key={book.title}
                    className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                  >
                    <span className="text-gray-500 text-sm w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{book.title}</div>
                      <div className="text-xs text-gray-500">{book.count} highlights</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-4 space-y-3 mt-auto">
            <button
              onClick={onOpenLibrary}
              className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15
                         transition font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Browse Library
            </button>

            <button
              onClick={onOpenBooksHistory}
              className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15
                         transition font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Books History
            </button>

            <button
              onClick={onImportMore}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500
                         transition font-medium"
            >
              Import More Highlights
            </button>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all highlights? This cannot be undone.')) {
                  onClear();
                }
              }}
              className="w-full py-3 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30
                         text-red-400 transition font-medium"
            >
              Clear All Data
            </button>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to sign out?')) {
                  onLogout();
                }
              }}
              className="w-full py-3 px-4 rounded-xl border border-white/20 hover:bg-white/5
                         text-white/70 transition font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 text-center text-xs text-gray-500">
            Kindle Swipe v1.0
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
