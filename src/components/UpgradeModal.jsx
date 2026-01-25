import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const featureMessages = {
  export: "You've used all 3 free exports this month.",
  sync: 'Cloud sync keeps your highlights safe across all devices.',
  extension: 'Unlimited imports from the Chrome extension.',
  notion: 'Export all your highlights to Notion.',
  general: 'Unlock all features with Highlight Pro.'
};

const features = [
  { icon: '☁️', label: 'Cloud sync across devices' },
  { icon: '🖼️', label: 'Unlimited image exports' },
  { icon: '🔄', label: 'Unlimited imports' },
  { icon: '📝', label: 'Notion export' },
];

export function UpgradeModal({ onClose, onUpgrade, isLoading, feature = 'general' }) {
  const [upgradeError, setUpgradeError] = useState(null);

  const handleUpgrade = async () => {
    try {
      setUpgradeError(null);
      await onUpgrade();
    } catch (err) {
      setUpgradeError(err.message || 'Failed to start checkout. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm bg-[#151515] rounded-3xl border border-[#2a2a2a] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 text-center">
          {/* Decorative gradient */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.3) 0%, transparent 60%)'
            }}
          />

          <div className="relative">
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h2>
            <p className="text-[#888] text-sm leading-relaxed">
              {featureMessages[feature]}
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="px-6 pb-4">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16162a] rounded-2xl p-5 border border-[#2a2a4a]">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <span className="text-white font-bold text-2xl">€2</span>
                <span className="text-[#888] text-sm">/month</span>
              </div>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full">
                Cancel anytime
              </span>
            </div>

            <div className="space-y-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg">{f.icon}</span>
                  <span className="text-[#ccc] text-sm">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {upgradeError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 pb-2"
            >
              <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2 px-3">
                {upgradeError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="p-6 pt-2 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] transition text-white font-medium"
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </>
            ) : (
              'Upgrade'
            )}
          </button>
        </div>

        {/* Footer note */}
        <div className="px-6 pb-6 text-center">
          <p className="text-[#555] text-xs">
            Secure payment via Stripe. Cancel anytime from settings.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
