/**
 * Parse Kindle's My Clippings.txt file
 *
 * Format:
 * Book Title (Author Name)
 * - Your Highlight on page X | Location Y-Z | Added on Day, Month DD, YYYY HH:MM:SS AM/PM
 *
 * The actual highlight text here
 * ==========
 */

export function parseClippings(text) {
  const highlights = [];
  const entries = text.split('==========').filter(entry => entry.trim());

  for (const entry of entries) {
    const lines = entry.trim().split('\n').filter(line => line.trim());

    if (lines.length < 2) continue;

    // First line: "Book Title (Author)"
    const titleLine = lines[0].trim();
    const authorMatch = titleLine.match(/\(([^)]+)\)\s*$/);

    let title = titleLine;
    let author = 'Unknown Author';

    if (authorMatch) {
      author = authorMatch[1].trim();
      title = titleLine.slice(0, titleLine.lastIndexOf('(')).trim();
    }

    // Second line: metadata (page, location, date)
    const metaLine = lines[1].trim();

    // Skip bookmarks and notes headers (we want highlights)
    if (metaLine.includes('Your Bookmark') || metaLine.includes('Your Note')) {
      continue;
    }

    // Extract location
    const locationMatch = metaLine.match(/Location\s+(\d+(?:-\d+)?)/i);
    const location = locationMatch ? locationMatch[1] : null;

    // Extract page
    const pageMatch = metaLine.match(/page\s+(\d+)/i);
    const page = pageMatch ? pageMatch[1] : null;

    // Extract date
    const dateMatch = metaLine.match(/Added on\s+(.+)$/i);
    const dateStr = dateMatch ? dateMatch[1] : null;

    // The rest is the highlight text
    const highlightText = lines.slice(2).join('\n').trim();

    if (!highlightText) continue;

    highlights.push({
      id: generateId(title, highlightText),
      title: cleanTitle(title),
      author: cleanAuthor(author),
      text: highlightText,
      location,
      page,
      date: dateStr,
      source: 'clippings'
    });
  }

  return highlights;
}

function cleanTitle(title) {
  // Remove file extensions and clean up
  return title
    .replace(/\.mobi$/i, '')
    .replace(/\.epub$/i, '')
    .replace(/\.azw3?$/i, '')
    .replace(/\.pdf$/i, '')
    .trim();
}

function cleanAuthor(author) {
  // Handle "Last, First" format
  if (author.includes(',') && !author.includes(' and ')) {
    const parts = author.split(',').map(p => p.trim());
    if (parts.length === 2 && !parts[1].includes(' ')) {
      return `${parts[1]} ${parts[0]}`;
    }
  }
  return author;
}

function generateId(title, text) {
  // Create a simple hash for deduplication
  const str = `${title}:${text}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `clip_${Math.abs(hash).toString(36)}`;
}
