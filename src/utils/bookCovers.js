/**
 * Fetch book covers from Open Library API
 * https://openlibrary.org/dev/docs/api/covers
 */

// In-memory cache for cover URLs
const coverCache = new Map();

// Fallback color palettes - dark, monumental, cinematic
// Each palette is [darkest, mid, accent] - we'll build gradients from these
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
 * Get a cover URL for a book
 * Returns { type: 'image' | 'gradient', value: string }
 */
export async function getBookCover(title, author) {
  const cacheKey = `${title}|${author}`;

  // Check cache first
  if (coverCache.has(cacheKey)) {
    return coverCache.get(cacheKey);
  }

  // Try to fetch from Open Library
  try {
    const searchQuery = encodeURIComponent(`${title} ${author}`.trim());
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${searchQuery}&limit=1&fields=key,cover_i`
    );

    if (!response.ok) throw new Error('Search failed');

    const data = await response.json();

    if (data.docs?.[0]?.cover_i) {
      const coverId = data.docs[0].cover_i;
      // Use large cover size
      const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;

      const result = { type: 'image', value: coverUrl };
      coverCache.set(cacheKey, result);
      return result;
    }
  } catch (e) {
    console.warn('Failed to fetch cover for:', title, e);
  }

  // Fallback to color palette based on title hash
  const result = { type: 'color', value: getColorForTitle(title) };
  coverCache.set(cacheKey, result);
  return result;
}

/**
 * Get a deterministic color palette based on title
 * Returns { r, g, b } that can be used to build dynamic gradients
 */
function getColorForTitle(title) {
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
  const batchSize = 5;

  for (let i = 0; i < bookList.length; i += batchSize) {
    const batch = bookList.slice(i, i + batchSize);
    await Promise.all(
      batch.map(book => getBookCover(book.title, book.author))
    );
  }
}

/**
 * Get cached cover synchronously (returns color fallback if not cached)
 */
export function getCachedCover(title, author) {
  const cacheKey = `${title}|${author}`;
  return coverCache.get(cacheKey) || { type: 'color', value: getColorForTitle(title) };
}
