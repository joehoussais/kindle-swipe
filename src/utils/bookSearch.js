/**
 * Book search utilities using Open Library API
 * Free, no authentication required
 */

/**
 * Search for books via Open Library API
 * @param {string} query - Search query (title, author, or both)
 * @param {number} limit - Max results to return
 * @returns {Promise<Array<{id: string, title: string, author: string, coverUrl: string|null, year: number|null}>>}
 */
export async function searchBooks(query, limit = 5) {
  if (!query || query.trim().length < 2) return [];

  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query.trim())}&limit=${limit}&fields=key,title,author_name,cover_i,first_publish_year`
    );

    if (!response.ok) throw new Error('Search failed');

    const data = await response.json();

    return (data.docs || []).map(book => ({
      id: book.key,
      title: book.title,
      author: book.author_name?.[0] || 'Unknown',
      coverUrl: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : null,
      year: book.first_publish_year || null
    }));
  } catch (error) {
    console.error('Book search failed:', error);
    return [];
  }
}

/**
 * Get a larger cover image URL for a book
 * @param {number} coverId - Open Library cover ID
 * @param {string} size - 'S' (small), 'M' (medium), or 'L' (large)
 */
export function getCoverUrl(coverId, size = 'L') {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

/**
 * Debounce utility for search input
 * @param {Function} fn - Function to debounce
 * @param {number} ms - Delay in milliseconds
 */
export function debounce(fn, ms = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}
