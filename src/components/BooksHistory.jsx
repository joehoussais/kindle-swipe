import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export function BooksHistory({ onClose }) {
  const { userBooks, removeBook, user, logout } = useAuth();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#191919] border-l border-[#252525] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#252525]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-light text-[#ffffffeb]">Your Library</h2>
              <p className="text-[#787774] text-sm mt-1">
                {userBooks.length} source{userBooks.length !== 1 ? 's' : ''} imported
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#252525] transition text-[#9b9a97]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 bg-[#252525]/30 border-b border-[#252525]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#252525] border border-[#4d4a46] flex items-center justify-center text-[#2383e2] font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-[#ffffffeb] font-medium">{user?.name}</p>
                <p className="text-[#787774] text-sm">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to sign out?')) {
                  await logout();
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-[#252525]/50 hover:bg-[#252525] border border-[#ffffff14] text-[#9b9a97] text-sm transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Books List */}
        <div className="overflow-y-auto h-[calc(100%-180px)]">
          {userBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-full bg-[#252525]/50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#4d4a46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-[#9b9a97]">No sources imported yet</p>
              <p className="text-[#787774] text-sm mt-1 italic">
                Import your Kindle highlights to get started
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {userBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#252525]/30 rounded-lg p-4 hover:bg-[#252525]/50 transition group border border-[#ffffff14]/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[#ffffffeb] truncate">{book.bookTitle}</h3>
                      {book.author && (
                        <p className="text-[#9b9a97] text-sm truncate">{book.author}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#787774]">
                        <span>{book.highlightCount} passage{book.highlightCount !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>Added {formatDate(book.firstImportedAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${book.bookTitle}" from your history?`)) {
                          removeBook(book.bookTitle);
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-[#252525] text-[#4d4a46] hover:text-[#2383e2] transition opacity-0 group-hover:opacity-100"
                      title="Remove from history"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
