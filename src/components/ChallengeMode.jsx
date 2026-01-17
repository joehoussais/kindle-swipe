import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBackgroundForHighlight } from '../utils/backgrounds';
import { IntegrationBar } from './IntegrationBar';

// Result types from LLM judging
const RESULT_TYPES = {
  SUCCESS: 'success',
  PARTIAL: 'partial',
  MISS: 'miss'
};

// Copy for different result types
const RESULT_COPY = {
  [RESULT_TYPES.SUCCESS]: {
    title: "You've got it.",
    subtitle: "Neural patterns reinforced."
  },
  [RESULT_TYPES.PARTIAL]: {
    title: "Close.",
    subtitle: "Here's what you missed."
  },
  [RESULT_TYPES.MISS]: {
    title: "Not quite.",
    subtitle: "Let's strengthen this one."
  }
};

export function ChallengeMode({ highlight, onComplete, onCancel }) {
  const [phase, setPhase] = useState('recall'); // 'recall' | 'result'
  const [userResponse, setUserResponse] = useState('');
  const [isJudging, setIsJudging] = useState(false);
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState('');

  const background = getBackgroundForHighlight(highlight.id);

  // Judge the user's recall attempt
  // For now, use a simple heuristic. Later, integrate LLM.
  const judgeRecall = async (response) => {
    setIsJudging(true);

    // Simple heuristic scoring (to be replaced with LLM)
    const highlightWords = highlight.text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const responseWords = response.toLowerCase().split(/\s+/);

    // Count how many key words from the highlight appear in the response
    const matchedWords = highlightWords.filter(hw =>
      responseWords.some(rw => rw.includes(hw) || hw.includes(rw))
    );

    const matchRatio = matchedWords.length / Math.min(highlightWords.length, 10);

    let resultType;
    let explanation;

    if (matchRatio >= 0.5 || response.length >= highlight.text.length * 0.3) {
      resultType = RESULT_TYPES.SUCCESS;
      explanation = "Your response captures the essence of this highlight.";
    } else if (matchRatio >= 0.2 || response.length >= 50) {
      resultType = RESULT_TYPES.PARTIAL;
      explanation = "You remembered some key elements, but missed others.";
    } else {
      resultType = RESULT_TYPES.MISS;
      explanation = "This highlight might need more reinforcement.";
    }

    // Simulate a brief delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    setResult(resultType);
    setExplanation(explanation);
    setPhase('result');
    setIsJudging(false);
  };

  const handleSubmit = () => {
    if (userResponse.trim()) {
      judgeRecall(userResponse.trim());
    }
  };

  const handleComplete = () => {
    const wasSuccessful = result === RESULT_TYPES.SUCCESS;
    onComplete(wasSuccessful);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50"
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${background.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-white/10 transition"
          >
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-[#2383e2] text-sm font-medium">
            Challenge Mode
          </div>

          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <AnimatePresence mode="wait">
            {phase === 'recall' && (
              <motion.div
                key="recall"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-lg"
              >
                {/* Source hint */}
                <div className="text-center mb-8">
                  <p className="text-[#9b9a97] text-sm mb-2">From</p>
                  <h3
                    className="text-white text-xl font-semibold mb-1"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {highlight.title}
                  </h3>
                  <p className="text-[#9b9a97] text-sm">{highlight.author}</p>
                </div>

                {/* Prompt */}
                <div className="text-center mb-6">
                  <p
                    className="text-[#ffffffeb] text-lg"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Don't peek — try to recall.
                  </p>
                </div>

                {/* Input */}
                <div className="bg-[#191919]/80 backdrop-blur-xl rounded-2xl p-6 border border-[#ffffff14]">
                  <textarea
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value)}
                    placeholder="What was this about? One sentence, your words."
                    className="w-full h-32 bg-transparent text-[#ffffffeb] placeholder-[#787774] resize-none focus:outline-none text-lg"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    autoFocus
                  />

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#ffffff14]">
                    <p className="text-[#787774] text-xs">
                      {userResponse.length} characters
                    </p>
                    <button
                      onClick={handleSubmit}
                      disabled={!userResponse.trim() || isJudging}
                      className="px-6 py-2 rounded-lg bg-[#2383e2] hover:bg-[#d4b892] disabled:opacity-50 disabled:cursor-not-allowed transition text-[#191919] font-medium"
                    >
                      {isJudging ? 'Checking...' : 'Check Recall'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {phase === 'result' && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-lg"
              >
                {/* Result header */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                      result === RESULT_TYPES.SUCCESS
                        ? 'bg-green-500/20'
                        : result === RESULT_TYPES.PARTIAL
                        ? 'bg-yellow-500/20'
                        : 'bg-red-500/20'
                    }`}
                  >
                    {result === RESULT_TYPES.SUCCESS && (
                      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {result === RESULT_TYPES.PARTIAL && (
                      <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    {result === RESULT_TYPES.MISS && (
                      <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </motion.div>

                  <h2
                    className="text-white text-2xl font-semibold mb-1"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {RESULT_COPY[result].title}
                  </h2>
                  <p className="text-[#2383e2]">{RESULT_COPY[result].subtitle}</p>
                </div>

                {/* Explanation */}
                <div className="text-center mb-6">
                  <p className="text-[#9b9a97] text-sm">{explanation}</p>
                </div>

                {/* Your response */}
                <div className="bg-[#191919]/80 backdrop-blur-xl rounded-2xl p-5 border border-[#ffffff14] mb-4">
                  <p className="text-[#787774] text-xs uppercase tracking-wider mb-2">Your recall</p>
                  <p className="text-[#ffffffeb] text-sm">{userResponse}</p>
                </div>

                {/* Original highlight */}
                <div className="bg-white/95 rounded-2xl p-6 mb-6">
                  <p className="text-[#787774] text-xs uppercase tracking-wider mb-2">Original</p>
                  <blockquote
                    className="text-[#1a1a1a] text-base"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.6 }}
                  >
                    "{highlight.text}"
                  </blockquote>
                  <p className="text-[#9b9a97] text-sm mt-3">— {highlight.author}</p>
                </div>

                {/* Integration bar */}
                <div className="mb-6">
                  <IntegrationBar highlight={highlight} />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleComplete}
                    className="flex-1 py-3 rounded-lg bg-[#2383e2] hover:bg-[#d4b892] transition text-[#191919] font-medium"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
