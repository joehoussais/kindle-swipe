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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white border-l border-[#e1e8ed] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#e1e8ed] sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition text-[#657786]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-bold text-[#14171a]">Reading History</h2>
                <p className="text-[#657786] text-sm">
                  {userBooks.length} source{userBooks.length !== 1 ? 's' : ''} imported
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 bg-[#f7f9fa] border-b border-[#e1e8ed]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#2d3748] flex items-center justify-center text-white font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-[#14171a] font-bold">{user?.name}</p>
                <p className="text-[#657786] text-sm">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to sign out?')) {
                  await logout();
                  onClose();
                }
              }}
              className="px-4 py-2 rounded-full bg-white hover:bg-[#f7f9fa] border border-[#e1e8ed] text-[#14171a] text-sm font-medium transition flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-[#657786]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#2d3748]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-[#14171a] font-semibold">No sources imported yet</p>
              <p className="text-[#657786] text-sm mt-1">
                Import your Kindle highlights to get started
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#e1e8ed]">
              {userBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-[#f7f9fa] transition group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[#14171a] font-semibold truncate">{book.bookTitle}</h3>
                      {book.author && (
                        <p className="text-[#657786] text-sm truncate">{book.author}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-[#657786]">
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
                      className="p-2 rounded-full hover:bg-[#ffeef1] text-[#657786] hover:text-[#e0245e] transition opacity-0 group-hover:opacity-100"
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
