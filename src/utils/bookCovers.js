/**
 * Fetch book covers from multiple sources with fallbacks
 * Priority: Google Books > Open Library > Color fallback
 */

// In-memory cache for cover URLs
const coverCache = new Map();

// Track failed lookups to avoid repeated requests
const failedLookups = new Set();

// Fallback color palettes - dark, monumental, cinematic
const COLOR_PALETTES = [
  { r: 15, g: 15, b: 25 },    // Deep void
  { r: 25, g: 18, b: 35 },    // Midnight purple
  { r: 12, g: 20, b: 28 },    // Ocean abyss
  { r: 28, g: 18, b: 18 },    // Dark crimson
  { r: 18, g: 25, b: 22 },    // Forest night
  { r: 22, g: 22, b: 30 },    // Twilight slate
  { r: 30, g: 20, b: 15 },    // Ember brown
  { r: 15, g: 22, b: 30 },    // Steel blue
  { r: 25, g: 15, b: 25 },    // Plum shadow
  { r: 20, g: 20, b: 20 },    // Pure dark
];

/**
 * Clean up title for better search results
 * Removes subtitles, edition info, etc.
 */
function cleanTitle(title) {
  if (!title) return '';
  return title
    .split(':')[0]  // Remove subtitle after colon
    .split('(')[0]  // Remove parenthetical info
    .split(' - ')[0] // Remove dash-separated info
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Try Google Books API first (best quality, most comprehensive)
 */
async function tryGoogleBooks(title, author) {
  try {
    const cleanedTitle = cleanTitle(title);
    // Search with title and author for better matching
    const query = author && author !== 'Unknown' && author !== 'You'
      ? `intitle:${cleanedTitle}+inauthor:${author}`
      : `intitle:${cleanedTitle}`;

    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=3&printType=books&langRestrict=en`
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (data.items?.length > 0) {
      // Find the best match - prefer items with imageLinks
      for (const item of data.items) {
        const imageLinks = item.volumeInfo?.imageLinks;
        if (imageLinks) {
          // Prefer larger images, upgrade HTTP to HTTPS
          const coverUrl = (
            imageLinks.extraLarge ||
            imageLinks.large ||
            imageLinks.medium ||
            imageLinks.thumbnail ||
            imageLinks.smallThumbnail
          )?.replace('http://', 'https://');

          if (coverUrl) {
            // Remove zoom parameter for higher quality
            return coverUrl.replace('&edge=curl', '').replace('zoom=1', 'zoom=2');
          }
        }
      }
    }
  } catch (e) {
    console.warn('Google Books failed for:', title, e.message);
  }
  return null;
}

/**
 * Fallback to Open Library if Google Books fails
 */
async function tryOpenLibrary(title, author) {
  try {
    const cleanedTitle = cleanTitle(title);
    const searchQuery = author && author !== 'Unknown' && author !== 'You'
      ? `${cleanedTitle} ${author}`
      : cleanedTitle;

    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=3&fields=key,cover_i,title,author_name,language`
    );

    if (!response.ok) return null;

    const data = await response.json();

    // Find the best match - prefer English editions with covers
    for (const doc of data.docs || []) {
      if (doc.cover_i) {
        // Prefer English language if available
        const hasEnglish = !doc.language || doc.language.includes('eng');
        if (hasEnglish) {
          return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
        }
      }
    }

    // If no English found, use first with cover
    const firstWithCover = data.docs?.find(d => d.cover_i);
    if (firstWithCover) {
      return `https://covers.openlibrary.org/b/id/${firstWithCover.cover_i}-L.jpg`;
    }
  } catch (e) {
    console.warn('Open Library failed for:', title, e.message);
  }
  return null;
}

/**
 * Get a cover URL for a book
 * Returns URL string or null
 */
export async function getBookCover(title, author) {
  if (!title) return null;

  const cacheKey = `${title}|${author}`;

  // Check cache first
  if (coverCache.has(cacheKey)) {
    return coverCache.get(cacheKey);
  }

  // Skip if we've already failed for this book
  if (failedLookups.has(cacheKey)) {
    return null;
  }

  // Try Google Books first (best quality)
  let coverUrl = await tryGoogleBooks(title, author);

  // Fallback to Open Library
  if (!coverUrl) {
    coverUrl = await tryOpenLibrary(title, author);
  }

  if (coverUrl) {
    coverCache.set(cacheKey, coverUrl);
    return coverUrl;
  }

  // Mark as failed to avoid repeated lookups
  failedLookups.add(cacheKey);
  return null;
}

/**
 * Get a deterministic color palette based on title
 * Returns { r, g, b } that can be used to build dynamic gradients
 */
export function getColorForTitle(title) {
  if (!title) return COLOR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index];
}

/**
 * Preload covers for a list of books
 */
export async function preloadCovers(highlights) {
  // Get unique book titles
  const books = new Map();
  for (const h of highlights) {
    const key = `${h.title}|${h.author}`;
    if (!books.has(key)) {
      books.set(key, { title: h.title, author: h.author });
    }
  }

  // Fetch covers in parallel (limit concurrency)
  const bookList = Array.from(books.values());
  const batchSize = 3; // Lower batch size to avoid rate limiting

  for (let i = 0; i < bookList.length; i += batchSize) {
    const batch = bookList.slice(i, i + batchSize);
    await Promise.all(
      batch.map(book => getBookCover(book.title, book.author))
    );
    // Small delay between batches to avoid rate limiting
    if (i + batchSize < bookList.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

/**
 * Get cached cover synchronously (returns null if not cached)
 */
export function getCachedCover(title, author) {
  const cacheKey = `${title}|${author}`;
  return coverCache.get(cacheKey) || null;
}

/**
 * Clear the cache (useful for testing or forcing refresh)
 */
export function clearCoverCache() {
  coverCache.clear();
  failedLookups.clear();
}
