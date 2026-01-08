import { useState, useEffect, useCallback } from 'react';
import { parseClippings } from '../utils/parseClippings';
import { parseAmazonNotebook } from '../utils/parseAmazonNotebook';
import { preloadCovers } from '../utils/bookCovers';

const STORAGE_KEY = 'kindle-swipe-highlights';
const INDEX_KEY = 'kindle-swipe-index';

export function useHighlights() {
  const [highlights, setHighlights] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [coversLoaded, setCoversLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedIndex = localStorage.getItem(INDEX_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);
        setHighlights(parsed);
        if (storedIndex) {
          const idx = parseInt(storedIndex, 10);
          setCurrentIndex(Math.min(idx, parsed.length - 1));
        }
      }
    } catch (e) {
      console.error('Failed to load highlights from storage:', e);
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage when highlights change
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
    const newHighlights = parseClippings(fileContent);
    mergeHighlights(newHighlights);
    return newHighlights.length;
  }, []);

  // Import from Amazon Notebook (Bookcision JSON or HTML)
  const importAmazonNotebook = useCallback((content) => {
    const newHighlights = parseAmazonNotebook(content);
    mergeHighlights(newHighlights);
    return newHighlights.length;
  }, []);

  // Merge new highlights with existing, deduplicating
  const mergeHighlights = useCallback((newHighlights) => {
    setHighlights(prev => {
      const existing = new Set(prev.map(h => h.id));
      const unique = newHighlights.filter(h => !existing.has(h.id));
      const merged = [...prev, ...unique];

      // Shuffle for variety
      return shuffleArray(merged);
    });
    setCoversLoaded(false); // Trigger cover preload
  }, []);

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
  const clearAll = useCallback(() => {
    setHighlights([]);
    setCurrentIndex(0);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(INDEX_KEY);
    setCoversLoaded(false);
  }, []);

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

  // Get statistics
  const getStats = useCallback(() => {
    const books = new Map();
    for (const h of highlights) {
      const key = h.title;
      books.set(key, (books.get(key) || 0) + 1);
    }
    return {
      totalHighlights: highlights.length,
      totalBooks: books.size,
      bookCounts: Array.from(books.entries())
        .map(([title, count]) => ({ title, count }))
        .sort((a, b) => b.count - a.count)
    };
  }, [highlights]);

  return {
    highlights,
    currentIndex,
    currentHighlight: highlights[currentIndex] || null,
    isLoading,
    coversLoaded,
    hasHighlights: highlights.length > 0,
    isFirst: currentIndex === 0,
    isLast: currentIndex === highlights.length - 1,
    importClippings,
    importAmazonNotebook,
    goNext,
    goPrev,
    goTo,
    shuffle,
    clearAll,
    deleteHighlight,
    editHighlight,
    getStats
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
