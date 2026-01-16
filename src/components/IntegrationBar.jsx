import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDecayedScore, getTimeSinceViewed } from '../hooks/useHighlights';

/**
 * Get color based on integration score
 * Red (0-30) → Yellow (31-60) → Green (61-100)
 */
function getScoreColor(score) {
  if (score <= 30) {
    // Red to orange
    const t = score / 30;
    return `rgb(${220}, ${Math.round(80 + t * 100)}, ${Math.round(60 + t * 20)})`;
  } else if (score <= 60) {
    // Orange to yellow
    const t = (score - 30) / 30;
    return `rgb(${Math.round(220 - t * 30)}, ${Math.round(180 + t * 40)}, ${Math.round(80 - t * 20)})`;
  } else {
    // Yellow to green
    const t = (score - 60) / 40;
    return `rgb(${Math.round(190 - t * 100)}, ${Math.round(220 - t * 30)}, ${Math.round(60 + t * 80)})`;
  }
}

/**
 * Get message based on score level
 */
function getScoreMessage(score) {
  if (score === 0) return "New — not yet reviewed";
  if (score < 20) return "This one's fading. Worth a challenge?";
  if (score < 40) return "Weakening — review soon";
  if (score < 60) return "Building — keep going";
  if (score < 80) return "Strong — well integrated";
  return "Solid — deeply embedded";
}

export function IntegrationBar({ highlight, compact = false }) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!highlight) return null;

  const decayedScore = Math.round(calculateDecayedScore(highlight));
  const color = getScoreColor(decayedScore);
  const timeSince = getTimeSinceViewed(highlight.lastViewedAt);
  const message = getScoreMessage(decayedScore);

  if (compact) {
    // Compact version: just the bar
    return (
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${decayedScore}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      {/* Bar container */}
      <div className="flex items-center gap-3">
        {/* Score number */}
        <span
          className="text-xs font-medium w-8 text-right"
          style={{ color }}
        >
          {decayedScore}%
        </span>

        {/* Progress bar */}
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${decayedScore}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>

        {/* Brain icon */}
        <svg
          className="w-4 h-4 opacity-60"
          style={{ color }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-[#1a1916]/95 backdrop-blur-xl rounded-lg border border-[#3d3a36] z-50"
          >
            <div className="text-[#ebe6dc] text-sm font-medium mb-1">
              Integration Score — {decayedScore}%
            </div>
            <div className="text-[#c4a882] text-xs italic mb-2">
              How available this is in memory
            </div>
            <div className="text-[#8a8578] text-xs mb-2">
              {message}
            </div>
            <div className="text-[#6b5c4c] text-xs">
              {timeSince}
              {highlight.viewCount > 0 && ` · Viewed ${highlight.viewCount} times`}
              {highlight.recallAttempts > 0 && ` · ${highlight.recallSuccesses || 0}/${highlight.recallAttempts} recalls`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
