import { useState, useEffect, useCallback } from 'react';
import { parseClippings } from '../utils/parseClippings';
import { parseAmazonNotebook } from '../utils/parseAmazonNotebook';
import { preloadCovers } from '../utils/bookCovers';
import { generateStarterHighlights } from '../utils/starterPack';
import { saveHighlightsToDb, loadHighlightsFromDb, updateHighlightInDb, clearAllHighlightsFromDb } from '../utils/supabase';

const STORAGE_KEY = 'highlight-app-data';
const INDEX_KEY = 'highlight-app-index';

/**
 * Source types for highlights/moments:
 * - 'kindle': Imported from Kindle clippings or Amazon notebook
 * - 'journal': Manual journal entry or imported from journal app
 * - 'voice': Voice memo transcription (future)
 * - 'thought': Quick thought/note capture
 * - 'quote': Manual quote entry
 * - 'tweet': Bookmarked tweets from X/Twitter
 */
export const SOURCE_TYPES = {
  KINDLE: 'kindle',
  JOURNAL: 'journal',
  VOICE: 'voice',
  THOUGHT: 'thought',
  QUOTE: 'quote',
  TWEET: 'tweet'
};

// Score increments for different actions
const SCORE_INCREMENTS = {
  VIEW: 1,
  COMMENT: 3,
  RECALL_ATTEMPT: 5,
  RECALL_SUCCESS: 10
};

// Decay rate: points lost per day of inactivity
const DECAY_RATE_PER_DAY = 0.7; // ~5 points per week

// Thresholds for review status
const FADING_THRESHOLD = 30; // Below this, highlight is "fading"
const FOCUS_REVIEW_THRESHOLD = 40; // Focus review mode shows highlights below this

/**
 * Calculate the decayed integration score based on time since last view
 */
export function calculateDecayedScore(highlight) {
  if (!highlight.lastViewedAt) {
    return highlight.integrationScore || 0;
  }

  const now = new Date();
  const lastViewed = new Date(highlight.lastViewedAt);
  const daysSinceView = (now - lastViewed) / (1000 * 60 * 60 * 24);

  const baseScore = highlight.integrationScore || 0;
  const decay = daysSinceView * DECAY_RATE_PER_DAY;

  return Math.max(0, baseScore - decay);
}

/**
 * Get time since last viewed as human-readable string
 */
export function getTimeSinceViewed(lastViewedAt) {
  if (!lastViewedAt) return 'Never reviewed';

  const now = new Date();
  const lastViewed = new Date(lastViewedAt);
  const diffMs = now - lastViewed;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Reviewed today';
  if (diffDays === 1) return 'Reviewed yesterday';
  if (diffDays < 7) return `Reviewed ${diffDays} days ago`;
  if (diffDays < 30) return `Reviewed ${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `Reviewed ${Math.floor(diffDays / 30)} months ago`;
  return `Reviewed ${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Generate auto-tags from highlight metadata
 */
export function generateAutoTags(highlight) {
  const tags = [];

  // Add source type as tag
  if (highlight.source) {
    tags.push(highlight.source);
  }

  // Add author as tag (clean up)
  if (highlight.author && highlight.author !== 'You' && highlight.author !== 'Unknown') {
    const authorTag = highlight.author
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    if (authorTag.length > 1 && authorTag.length < 50) {
      tags.push(`author:${authorTag}`);
    }
  }

  // Add book/source title as tag (clean up and truncate)
  if (highlight.title && highlight.title !== 'Personal Thoughts' && highlight.title !== 'Saved Quotes') {
    const titleTag = highlight.title
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .slice(0, 50);
    if (titleTag.length > 1) {
      tags.push(`book:${titleTag}`);
    }
  }

  return tags;
}

/**
 * Extract all unique tags from highlights (for filtering UI)
 */
export function extractAllTags(highlights) {
  const tagCounts = new Map();

  for (const h of highlights) {
    const allTags = [...(h.tags || []), ...generateAutoTags(h)];
    for (const tag of allTags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Surfacing algorithm: picks the next highlight to show based on weighted criteria
 * - Due for review (40%): Low score + high time since seen
 * - New/unseen (30%): Never viewed
 * - Decay rescue (20%): Was high, now decaying
 * - Random reinforcement (10%): High-score for confidence
 */
export function selectNextHighlight(highlights, currentId = null) {
  if (highlights.length === 0) return null;
  if (highlights.length === 1) return highlights[0];

  // Filter out current highlight
  const candidates = currentId
    ? highlights.filter(h => h.id !== currentId)
    : highlights;

  if (candidates.length === 0) return highlights[0];

  // Categorize highlights
  const unseen = candidates.filter(h => !h.viewCount || h.viewCount === 0);
  const seen = candidates.filter(h => h.viewCount && h.viewCount > 0);

  // Due for review: low decayed score + seen before
  const dueForReview = seen
    .map(h => ({ ...h, decayedScore: calculateDecayedScore(h) }))
    .filter(h => h.decayedScore < 50)
    .sort((a, b) => a.decayedScore - b.decayedScore);

  // Decay rescue: was high (base score > 50), now decaying significantly
  const decayRescue = seen
    .map(h => ({
      ...h,
      decayedScore: calculateDecayedScore(h),
      decayAmount: (h.integrationScore || 0) - calculateDecayedScore(h)
    }))
    .filter(h => h.integrationScore > 50 && h.decayAmount > 10)
    .sort((a, b) => b.decayAmount - a.decayAmount);

  // High score (reinforcement): decayed score > 60
  const highScore = seen
    .map(h => ({ ...h, decayedScore: calculateDecayedScore(h) }))
    .filter(h => h.decayedScore > 60)
    .sort((a, b) => b.decayedScore - a.decayedScore);

  // Weighted random selection
  const rand = Math.random();
  let selected = null;

  if (rand < 0.40 && dueForReview.length > 0) {
    // Due for review - pick from top 3
    const pool = dueForReview.slice(0, 3);
    selected = pool[Math.floor(Math.random() * pool.length)];
  } else if (rand < 0.70 && unseen.length > 0) {
    // New/unseen - prioritize recent imports (they're at the start)
    const pool = unseen.slice(0, Math.min(5, unseen.length));
    selected = pool[Math.floor(Math.random() * pool.length)];
  } else if (rand < 0.90 && decayRescue.length > 0) {
    // Decay rescue - pick from top 3
    const pool = decayRescue.slice(0, 3);
    selected = pool[Math.floor(Math.random() * pool.length)];
  } else if (highScore.length > 0) {
    // Random reinforcement from high-score
    const pool = highScore.slice(0, 5);
    selected = pool[Math.floor(Math.random() * pool.length)];
  }

  // Fallback: random from all candidates
  if (!selected) {
    selected = candidates[Math.floor(Math.random() * candidates.length)];
  }

  return selected;
}

/**
 * Get display label for source type
 */
export function getSourceLabel(source) {
  switch (source) {
    case SOURCE_TYPES.KINDLE:
      return 'You highlighted this';
    case SOURCE_TYPES.JOURNAL:
      return 'You wrote this';
    case SOURCE_TYPES.VOICE:
      return 'You said this';
    case SOURCE_TYPES.THOUGHT:
      return 'You thought this';
    case SOURCE_TYPES.QUOTE:
      return 'You saved this';
    case SOURCE_TYPES.TWEET:
      return 'You bookmarked this';
    default:
      return 'You captured this';
  }
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Extract date from text content
 * Supports various formats:
 * - "January 15, 2024" or "Jan 15, 2024"
 * - "15 January 2024" or "15 Jan 2024"
 * - "2024-01-15" (ISO)
 * - "01/15/2024" or "1/15/2024" (US)
 * - "15/01/2024" or "15/1/2024" (EU)
 * - "January 15th, 2024" or "15th January 2024"
 */
function extractDateFromText(text) {
  if (!text) return null;

  const months = {
    january: 0, jan: 0,
    february: 1, feb: 1,
    march: 2, mar: 2,
    april: 3, apr: 3,
    may: 4,
    june: 5, jun: 5,
    july: 6, jul: 6,
    august: 7, aug: 7,
    september: 8, sep: 8, sept: 8,
    october: 9, oct: 9,
    november: 10, nov: 10,
    december: 11, dec: 11
  };

  // Pattern 1: "January 15, 2024" or "Jan 15th, 2024"
  const pattern1 = /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})\b/i;
  let match = text.match(pattern1);
  if (match) {
    const month = months[match[1].toLowerCase()];
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    if (month !== undefined && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      return new Date(year, month, day);
    }
  }

  // Pattern 2: "15 January 2024" or "15th Jan 2024"
  const pattern2 = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec),?\s*(\d{4})\b/i;
  match = text.match(pattern2);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = months[match[2].toLowerCase()];
    const year = parseInt(match[3], 10);
    if (month !== undefined && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      return new Date(year, month, day);
    }
  }

  // Pattern 3: ISO format "2024-01-15"
  const pattern3 = /\b(\d{4})-(\d{2})-(\d{2})\b/;
  match = text.match(pattern3);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    if (year >= 1900 && year <= 2100 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return new Date(year, month, day);
    }
  }

  // Pattern 4: US format "01/15/2024" or "1/15/24"
  const pattern4 = /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/;
  match = text.match(pattern4);
  if (match) {
    const first = parseInt(match[1], 10);
    const second = parseInt(match[2], 10);
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000;

    // Try US format first (MM/DD/YYYY)
    if (first >= 1 && first <= 12 && second >= 1 && second <= 31 && year >= 1900 && year <= 2100) {
      return new Date(year, first - 1, second);
    }
    // Try EU format (DD/MM/YYYY)
    if (second >= 1 && second <= 12 && first >= 1 && first <= 31 && year >= 1900 && year <= 2100) {
      return new Date(year, second - 1, first);
    }
  }

  return null;
}

export function useHighlights(onBooksImported, userId = null) {
  const [highlights, setHighlights] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [coversLoaded, setCoversLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  // Load from Supabase if logged in, otherwise localStorage
  // Always fall back to localStorage if DB is empty
  useEffect(() => {
    async function loadHighlights() {
      console.log('[useHighlights] Starting load, userId:', userId);
      setIsLoading(true);
      let loadedHighlights = [];

      try {
        // Try localStorage first (always available as backup)
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            loadedHighlights = JSON.parse(stored);
            console.log('[useHighlights] Loaded from localStorage:', loadedHighlights.length, 'highlights');
          } catch (e) {
            console.error('Failed to parse localStorage:', e);
          }
        } else {
          console.log('[useHighlights] No data in localStorage');
        }

        // If logged in, try Supabase (takes priority if it has data)
        if (userId) {
          console.log('[useHighlights] Fetching from Supabase for user:', userId);
          const { highlights: dbHighlights, error } = await loadHighlightsFromDb(userId);
          console.log('[useHighlights] Supabase result:', { count: dbHighlights?.length, error });

          if (!error && dbHighlights && dbHighlights.length > 0) {
            // DB has data, use it
            loadedHighlights = dbHighlights;
            console.log('[useHighlights] Using Supabase data');
          } else if (loadedHighlights.length > 0) {
            // DB is empty but localStorage has data - sync it up immediately
            console.log('[useHighlights] DB empty, localStorage has data - syncing to DB now');
            await saveHighlightsToDb(userId, loadedHighlights);
          }
        }

        if (loadedHighlights.length > 0) {
          console.log('[useHighlights] Setting highlights:', loadedHighlights.length);
          setHighlights(loadedHighlights);
          const storedIndex = localStorage.getItem(INDEX_KEY);
          if (storedIndex) {
            const idx = parseInt(storedIndex, 10);
            setCurrentIndex(Math.min(idx, loadedHighlights.length - 1));
          }
        } else {
          console.log('[useHighlights] No highlights to load');
        }
      } catch (e) {
        console.error('Failed to load highlights:', e);
      }
      setIsLoading(false);
      setHasLoadedInitial(true);
      console.log('[useHighlights] Load complete');
    }
    loadHighlights();
  }, [userId]);

  // Save to Supabase when highlights change (if logged in)
  // Only sync after initial load is complete to prevent race conditions
  useEffect(() => {
    console.log('[useHighlights] Sync effect triggered:', {
      highlightsCount: highlights.length,
      userId: !!userId,
      isLoading,
      hasLoadedInitial
    });

    if (highlights.length > 0 && userId && !isLoading && hasLoadedInitial) {
      console.log('[useHighlights] Syncing', highlights.length, 'highlights to Supabase');
      setIsSyncing(true);
      saveHighlightsToDb(userId, highlights)
        .then((result) => {
          console.log('[useHighlights] Sync complete:', result);
          setIsSyncing(false);
        })
        .catch(e => {
          console.error('Failed to sync highlights:', e);
          setIsSyncing(false);
        });
    }
  }, [highlights, userId, isLoading, hasLoadedInitial]);

  // Also save to localStorage as backup
  useEffect(() => {
    if (highlights.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(highlights));
    }
  }, [highlights]);

  // Save current index
  useEffect(() => {
    localStorage.setItem(INDEX_KEY, currentIndex.toString());
  }, [currentIndex]);

  // Preload covers when highlights are loaded
  useEffect(() => {
    if (highlights.length > 0 && !coversLoaded) {
      preloadCovers(highlights).then(() => setCoversLoaded(true));
    }
  }, [highlights, coversLoaded]);

  // Import from My Clippings.txt
  const importClippings = useCallback((fileContent) => {
    const parsed = parseClippings(fileContent);
    // Add source type to all imported highlights
    const newHighlights = parsed.map(h => ({
      ...h,
      source: SOURCE_TYPES.KINDLE,
      capturedAt: h.dateHighlighted || new Date().toISOString()
    }));
    mergeHighlights(newHighlights);
    return newHighlights.length;
  }, []);

  // Import from Amazon Notebook (Bookcision JSON or HTML)
  const importAmazonNotebook = useCallback((content) => {
    const parsed = parseAmazonNotebook(content);
    // Add source type to all imported highlights
    const newHighlights = parsed.map(h => ({
      ...h,
      source: SOURCE_TYPES.KINDLE,
      capturedAt: h.dateHighlighted || new Date().toISOString()
    }));
    mergeHighlights(newHighlights);
    return newHighlights.length;
  }, []);

  // Add a manual thought/note
  const addThought = useCallback((text, source = SOURCE_TYPES.THOUGHT) => {
    const thought = {
      id: `thought-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text,
      title: 'Personal Thoughts',
      author: 'You',
      source,
      capturedAt: new Date().toISOString()
    };
    setHighlights(prev => [thought, ...prev]);
    setCurrentIndex(0);
    return thought;
  }, []);

  // Add a manual quote
  const addQuote = useCallback((text, author, sourceBook = '') => {
    const quote = {
      id: `quote-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text,
      title: sourceBook || 'Saved Quotes',
      author: author || 'Unknown',
      source: SOURCE_TYPES.QUOTE,
      capturedAt: new Date().toISOString()
    };
    setHighlights(prev => [quote, ...prev]);
    setCurrentIndex(0);
    return quote;
  }, []);

  // Import journal entries (plain text, one per paragraph)
  // Extracts dates from the content when possible
  const importJournal = useCallback((content, journalName = 'Journal') => {
    const entries = content
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 20); // Filter out very short entries

    let lastFoundDate = null; // Track the last found date for entries without dates

    const newHighlights = entries.map((text, i) => {
      // Try to extract a date from this entry
      const extractedDate = extractDateFromText(text);

      if (extractedDate) {
        lastFoundDate = extractedDate;
      }

      // Use extracted date, or fall back to last found date, or current time
      const capturedAt = extractedDate
        ? extractedDate.toISOString()
        : lastFoundDate
          ? lastFoundDate.toISOString()
          : new Date().toISOString();

      return {
        id: `journal-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
        text,
        title: journalName,
        author: 'You',
        source: SOURCE_TYPES.JOURNAL,
        capturedAt
      };
    });

    mergeHighlights(newHighlights);
    return newHighlights.length;
  }, []);

  // Import bookmarked tweets (JSON export from X/Twitter or plain text)
  const importTweets = useCallback((content) => {
    let tweets = [];

    // Try parsing as JSON first (X bookmark export format)
    try {
      const parsed = JSON.parse(content);
      // Handle array of tweets or object with tweets array
      const tweetArray = Array.isArray(parsed) ? parsed : parsed.tweets || parsed.data || [];

      tweets = tweetArray.map((tweet, i) => {
        const text = tweet.full_text || tweet.text || tweet.content || '';
        const author = tweet.user?.screen_name || tweet.user?.name || tweet.author || tweet.username || 'Unknown';
        const authorName = tweet.user?.name || author;
        const createdAt = tweet.created_at ? new Date(tweet.created_at).toISOString() : new Date().toISOString();

        return {
          id: `tweet-${tweet.id || Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
          text: text.trim(),
          title: `@${author}`,
          author: authorName,
          source: SOURCE_TYPES.TWEET,
          capturedAt: createdAt,
          tweetUrl: tweet.url || (tweet.id ? `https://x.com/${author}/status/${tweet.id}` : null)
        };
      }).filter(t => t.text.length > 0);
    } catch {
      // Fall back to plain text parsing (one tweet per paragraph or line)
      const lines = content.split(/\n\n+|\n(?=@)/).map(l => l.trim()).filter(l => l.length > 10);

      tweets = lines.map((text, i) => {
        // Try to extract @username from text
        const authorMatch = text.match(/^@(\w+)/);
        const author = authorMatch ? authorMatch[1] : 'Unknown';

        return {
          id: `tweet-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
          text: text.replace(/^@\w+\s*:?\s*/, '').trim(), // Remove @username prefix if present
          title: `@${author}`,
          author: author,
          source: SOURCE_TYPES.TWEET,
          capturedAt: new Date().toISOString()
        };
      }).filter(t => t.text.length > 0);
    }

    mergeHighlights(tweets);
    return tweets.length;
  }, []);

  // Merge new highlights with existing, deduplicating
  const mergeHighlights = useCallback((newHighlights) => {
    // Track books that were imported
    if (onBooksImported && newHighlights.length > 0) {
      const bookMap = new Map();
      for (const h of newHighlights) {
        const key = h.title;
        if (!bookMap.has(key)) {
          bookMap.set(key, { title: h.title, author: h.author, count: 0 });
        }
        bookMap.get(key).count++;
      }
      // Notify about imported books
      for (const book of bookMap.values()) {
        onBooksImported(book.title, book.author, book.count);
      }
    }

    setHighlights(prev => {
      const existing = new Set(prev.map(h => h.id));
      const unique = newHighlights.filter(h => !existing.has(h.id));
      const merged = [...prev, ...unique];

      // Shuffle for variety
      return shuffleArray(merged);
    });
    setCoversLoaded(false); // Trigger cover preload
  }, [onBooksImported]);

  // Navigation
  const goNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, highlights.length - 1));
  }, [highlights.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const goTo = useCallback((index) => {
    setCurrentIndex(Math.max(0, Math.min(index, highlights.length - 1)));
  }, [highlights.length]);

  // Shuffle highlights
  const shuffle = useCallback(() => {
    setHighlights(prev => shuffleArray([...prev]));
    setCurrentIndex(0);
  }, []);

  // Clear all data
  const clearAll = useCallback(async () => {
    setHighlights([]);
    setCurrentIndex(0);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(INDEX_KEY);
    setCoversLoaded(false);

    // Also clear from Supabase if logged in (use explicit clear function)
    if (userId) {
      await clearAllHighlightsFromDb(userId);
    }
  }, [userId]);

  // Load starter pack
  const loadStarterPack = useCallback(() => {
    const starterHighlights = generateStarterHighlights().map(h => ({
      ...h,
      source: SOURCE_TYPES.KINDLE,
      capturedAt: h.dateHighlighted || new Date().toISOString()
    }));
    mergeHighlights(starterHighlights);
    return starterHighlights.length;
  }, [mergeHighlights]);

  // Delete a single highlight
  const deleteHighlight = useCallback((id) => {
    setHighlights(prev => {
      const newHighlights = prev.filter(h => h.id !== id);
      // Adjust current index if needed
      if (currentIndex >= newHighlights.length) {
        setCurrentIndex(Math.max(0, newHighlights.length - 1));
      }
      return newHighlights;
    });
  }, [currentIndex]);

  // Edit a highlight's text
  const editHighlight = useCallback((id, newText) => {
    setHighlights(prev =>
      prev.map(h => h.id === id ? { ...h, text: newText } : h)
    );
  }, []);

  // Add or update a comment on a highlight
  const addComment = useCallback((id, comment) => {
    setHighlights(prev =>
      prev.map(h => h.id === id ? { ...h, comment } : h)
    );
  }, []);

  // Get statistics
  const getStats = useCallback(() => {
    const books = new Map();
    const sources = new Map();

    for (const h of highlights) {
      // Count by title/source
      const key = h.title;
      books.set(key, (books.get(key) || 0) + 1);

      // Count by source type
      const src = h.source || SOURCE_TYPES.KINDLE;
      sources.set(src, (sources.get(src) || 0) + 1);
    }

    return {
      totalHighlights: highlights.length,
      totalBooks: books.size,
      bookCounts: Array.from(books.entries())
        .map(([title, count]) => ({ title, count }))
        .sort((a, b) => b.count - a.count),
      sourceCounts: Object.fromEntries(sources)
    };
  }, [highlights]);

  // Filter by source type
  const getBySource = useCallback((sourceType) => {
    return highlights.filter(h => h.source === sourceType);
  }, [highlights]);

  // Record a view and update integration score
  const recordView = useCallback((id) => {
    setHighlights(prev =>
      prev.map(h => {
        if (h.id !== id) return h;

        const now = new Date().toISOString();
        const newViewCount = (h.viewCount || 0) + 1;
        const currentScore = calculateDecayedScore(h);
        const newScore = Math.min(100, currentScore + SCORE_INCREMENTS.VIEW);

        const updated = {
          ...h,
          viewCount: newViewCount,
          integrationScore: newScore,
          lastViewedAt: now
        };

        // Sync to DB if logged in
        if (userId) {
          updateHighlightInDb(userId, id, {
            viewCount: newViewCount,
            integrationScore: newScore,
            lastViewedAt: now
          });
        }

        return updated;
      })
    );
  }, [userId]);

  // Record a recall attempt (success or not)
  const recordRecallAttempt = useCallback((id, wasSuccessful) => {
    setHighlights(prev =>
      prev.map(h => {
        if (h.id !== id) return h;

        const now = new Date().toISOString();
        const newAttempts = (h.recallAttempts || 0) + 1;
        const newSuccesses = wasSuccessful ? (h.recallSuccesses || 0) + 1 : (h.recallSuccesses || 0);
        const currentScore = calculateDecayedScore(h);
        const scoreIncrement = wasSuccessful
          ? SCORE_INCREMENTS.RECALL_SUCCESS
          : SCORE_INCREMENTS.RECALL_ATTEMPT;
        const newScore = Math.min(100, currentScore + scoreIncrement);

        const updated = {
          ...h,
          recallAttempts: newAttempts,
          recallSuccesses: newSuccesses,
          integrationScore: newScore,
          lastViewedAt: now
        };

        // Sync to DB if logged in
        if (userId) {
          updateHighlightInDb(userId, id, {
            recallAttempts: newAttempts,
            recallSuccesses: newSuccesses,
            integrationScore: newScore,
            lastViewedAt: now
          });
        }

        return updated;
      })
    );
  }, [userId]);

  // Update tags on a highlight
  const updateTags = useCallback((id, tags) => {
    setHighlights(prev =>
      prev.map(h => {
        if (h.id !== id) return h;

        const updated = { ...h, tags };

        // Sync to DB if logged in
        if (userId) {
          updateHighlightInDb(userId, id, { tags });
        }

        return updated;
      })
    );
  }, [userId]);

  // Get the next highlight using the surfacing algorithm
  const getNextHighlight = useCallback((currentId = null, filter = null) => {
    let pool = highlights;

    // Apply filter if provided
    if (filter) {
      pool = highlights.filter(h => {
        // Source filter
        if (filter.source && h.source !== filter.source) return false;
        // Tag filter
        if (filter.tag && (!h.tags || !h.tags.includes(filter.tag))) return false;
        return true;
      });
    }

    return selectNextHighlight(pool, currentId);
  }, [highlights]);

  // Get recall stats for a highlight
  const getRecallStats = useCallback((id) => {
    const h = highlights.find(h => h.id === id);
    if (!h) return null;

    const decayedScore = calculateDecayedScore(h);
    const successRate = h.recallAttempts > 0
      ? Math.round((h.recallSuccesses || 0) / h.recallAttempts * 100)
      : null;

    return {
      integrationScore: Math.round(decayedScore),
      viewCount: h.viewCount || 0,
      recallAttempts: h.recallAttempts || 0,
      recallSuccesses: h.recallSuccesses || 0,
      successRate,
      lastViewedAt: h.lastViewedAt,
      timeSinceViewed: getTimeSinceViewed(h.lastViewedAt)
    };
  }, [highlights]);

  return {
    highlights,
    currentIndex,
    currentHighlight: highlights[currentIndex] || null,
    isLoading,
    isSyncing,
    coversLoaded,
    hasHighlights: highlights.length > 0,
    hasCheckedDb: hasLoadedInitial,
    isFirst: currentIndex === 0,
    isLast: currentIndex === highlights.length - 1,
    // Import methods
    importClippings,
    importAmazonNotebook,
    importJournal,
    importTweets,
    loadStarterPack,
    // Create methods
    addThought,
    addQuote,
    // Navigation
    goNext,
    goPrev,
    goTo,
    shuffle,
    // Management
    clearAll,
    deleteHighlight,
    editHighlight,
    addComment,
    // Stats & filtering
    getStats,
    getBySource,
    // Recall system
    recordView,
    recordRecallAttempt,
    updateTags,
    getNextHighlight,
    getRecallStats,
    // Tags
    getAllTags: () => extractAllTags(highlights),
    // Global recall stats
    getGlobalRecallStats: () => {
      let highIntegration = 0;
      let mediumIntegration = 0;
      let lowIntegration = 0;
      let totalChallenges = 0;
      let successfulChallenges = 0;

      for (const h of highlights) {
        const score = calculateDecayedScore(h);
        if (score >= 60) highIntegration++;
        else if (score >= 30) mediumIntegration++;
        else lowIntegration++;

        totalChallenges += h.recallAttempts || 0;
        successfulChallenges += h.recallSuccesses || 0;
      }

      return {
        highIntegration,
        mediumIntegration,
        lowIntegration,
        totalChallenges,
        successfulChallenges
      };
    },
    // Review queue stats - highlights that are fading from memory
    getReviewQueueStats: () => {
      let fadingCount = 0;
      let needsAttentionCount = 0;

      for (const h of highlights) {
        const score = calculateDecayedScore(h);
        if (score < FADING_THRESHOLD && h.viewCount > 0) {
          fadingCount++;
        }
        if (score < FOCUS_REVIEW_THRESHOLD && h.viewCount > 0) {
          needsAttentionCount++;
        }
      }

      return {
        fadingCount,
        needsAttentionCount,
        totalReviewed: highlights.filter(h => h.viewCount > 0).length,
        totalUnseen: highlights.filter(h => !h.viewCount || h.viewCount === 0).length
      };
    },
    // Get highlights for focus review mode (fading highlights only)
    getFocusReviewHighlights: () => {
      return highlights
        .filter(h => {
          const score = calculateDecayedScore(h);
          return score < FOCUS_REVIEW_THRESHOLD && h.viewCount > 0;
        })
        .sort((a, b) => calculateDecayedScore(a) - calculateDecayedScore(b));
    },
    // Get "On This Day" highlights - same calendar day in previous years
    getOnThisDay: () => {
      const today = new Date();
      const todayMonth = today.getMonth();
      const todayDate = today.getDate();

      return highlights.filter(h => {
        const capturedDate = new Date(h.capturedAt || h.dateHighlighted);
        if (isNaN(capturedDate.getTime())) return false;

        // Check if same month and day, but different year
        const sameDay = capturedDate.getMonth() === todayMonth &&
                        capturedDate.getDate() === todayDate;
        const differentYear = capturedDate.getFullYear() < today.getFullYear();

        return sameDay && differentYear;
      }).map(h => ({
        ...h,
        yearsAgo: today.getFullYear() - new Date(h.capturedAt || h.dateHighlighted).getFullYear()
      }));
    }
  };
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
