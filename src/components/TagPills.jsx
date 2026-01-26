import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateAutoTags } from '../hooks/useHighlights';

/**
 * Format tag for display
 */
function formatTag(tag) {
  if (tag.startsWith('author:')) {
    const name = tag.slice(7);
    // Capitalize each word
    return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  if (tag.startsWith('book:')) {
    const title = tag.slice(5);
    // Capitalize first letter, truncate if long
    const formatted = title.charAt(0).toUpperCase() + title.slice(1);
    return formatted.length > 25 ? formatted.slice(0, 22) + '...' : formatted;
  }
  // Source type tags
  const sourceLabels = {
    kindle: 'Kindle',
    journal: 'Journal',
    voice: 'Voice',
    thought: 'Thought',
    quote: 'Quote',
    tweet: 'Tweet'
  };
  return sourceLabels[tag] || tag;
}

/**
 * Get tag color based on type
 */
function getTagColor(tag) {
  if (tag.startsWith('author:')) {
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  }
  if (tag.startsWith('book:')) {
    return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  }
  // Source types
  return 'bg-[#2d3748]/20 text-[#2d3748] border-[#2d3748]/30';
}

export function TagPills({ highlight, onAddTag, onRemoveTag, compact = false }) {
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Combine user tags with auto-generated tags
  const userTags = highlight.tags || [];
  const autoTags = generateAutoTags(highlight);

  // Deduplicate
  const allTags = [...new Set([...userTags, ...autoTags])];

  // In compact mode, show fewer tags
  const displayTags = compact ? allTags.slice(0, 3) : allTags;
  const hasMore = compact && allTags.length > 3;

  const handleAddTag = () => {
    if (newTag.trim() && onAddTag) {
      onAddTag(highlight.id, newTag.trim().toLowerCase());
      setNewTag('');
      setShowAddTag(false);
    }
  };

  if (allTags.length === 0 && !onAddTag) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {displayTags.map((tag, i) => {
        const isUserTag = userTags.includes(tag) && !autoTags.includes(tag);

        return (
          <motion.span
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getTagColor(tag)}`}
          >
            {formatTag(tag)}
            {isUserTag && onRemoveTag && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTag(highlight.id, tag);
                }}
                className="hover:text-white transition ml-0.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </motion.span>
        );
      })}

      {hasMore && (
        <span className="text-[#6b5c4c] text-xs">+{allTags.length - 3}</span>
      )}

      {/* Add tag button */}
      {onAddTag && !showAddTag && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowAddTag(true);
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-dashed border-[#3d3a36] text-[#6b5c4c] hover:border-[#2d3748] hover:text-[#2d3748] transition"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tag
        </button>
      )}

      {/* Add tag input */}
      <AnimatePresence>
        {showAddTag && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-1"
          >
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') handleAddTag();
                if (e.key === 'Escape') {
                  setShowAddTag(false);
                  setNewTag('');
                }
              }}
              placeholder="new tag"
              className="w-20 px-2 py-0.5 rounded text-xs bg-[#2d2a26] border border-[#3d3a36] text-[#ebe6dc] placeholder-[#6b5c4c] focus:outline-none focus:border-[#2d3748]"
              autoFocus
            />
            <button
              onClick={handleAddTag}
              className="p-0.5 rounded hover:bg-[#2d3748]/20 text-[#2d3748] transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={() => {
                setShowAddTag(false);
                setNewTag('');
              }}
              className="p-0.5 rounded hover:bg-red-500/20 text-[#6b5c4c] transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
