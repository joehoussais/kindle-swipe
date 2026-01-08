/**
 * Fetch author photos from Wikipedia/Wikimedia
 */

const authorCache = new Map();

/**
 * Get author photo URL from Wikipedia
 */
export async function getAuthorPhoto(authorName) {
  if (!authorName || authorName === 'Unknown Author') {
    return null;
  }

  const cacheKey = authorName.toLowerCase();
  if (authorCache.has(cacheKey)) {
    return authorCache.get(cacheKey);
  }

  try {
    // Search Wikipedia for the author
    const searchQuery = encodeURIComponent(authorName);
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchQuery}&format=json&origin=*`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.query?.search?.length) {
      authorCache.set(cacheKey, null);
      return null;
    }

    // Get the first result's page
    const pageTitle = searchData.query.search[0].title;
    const encodedTitle = encodeURIComponent(pageTitle);

    // Get page images
    const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodedTitle}&prop=pageimages&pithumbsize=200&format=json&origin=*`;

    const imageRes = await fetch(imageUrl);
    const imageData = await imageRes.json();

    const pages = imageData.query?.pages;
    if (!pages) {
      authorCache.set(cacheKey, null);
      return null;
    }

    const page = Object.values(pages)[0];
    const thumbnail = page?.thumbnail?.source || null;

    authorCache.set(cacheKey, thumbnail);
    return thumbnail;
  } catch (e) {
    console.warn('Failed to fetch author photo for:', authorName, e);
    authorCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Generate Goodreads search URL for a book
 */
export function getGoodreadsUrl(title, author) {
  const query = encodeURIComponent(`${title} ${author}`.trim());
  return `https://www.goodreads.com/search?q=${query}`;
}

/**
 * Generate Open Library URL for a book
 */
export function getOpenLibraryUrl(title, author) {
  const query = encodeURIComponent(`${title} ${author}`.trim());
  return `https://openlibrary.org/search?q=${query}`;
}
