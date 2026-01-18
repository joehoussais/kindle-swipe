/**
 * Clean up messy book titles from various sources (pirated PDFs, downloads, etc.)
 */
export function cleanTitle(title) {
  if (!title) return 'Unknown Title';

  let cleaned = title
    // Remove file extensions
    .replace(/\.(mobi|epub|azw3?|pdf|txt)$/i, '')
    // Remove common piracy/download site prefixes
    .replace(/^_?(OceanofPDF\.com|Z-Library|LibGen|PDFDrive|epubBooks|ManyBooks)[_\s.-]*/i, '')
    // Remove duplicate download suffixes like (1), (2), etc.
    .replace(/\s*\(\d+\)\s*$/, '')
    // Handle "_-_" separator (often Title_-_Author format in filenames)
    .replace(/_-_/g, ' - ')
    // Replace underscores with spaces
    .replace(/_/g, ' ')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();

  // If still has issues, return cleaned version
  return cleaned || 'Unknown Title';
}

/**
 * Clean up author name formatting
 */
export function cleanAuthor(author) {
  if (!author) return 'Unknown Author';

  let cleaned = author
    // Remove underscores
    .replace(/_/g, ' ')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();

  // Handle "Last, First" format -> "First Last"
  if (cleaned.includes(',') && !cleaned.includes(' and ')) {
    const parts = cleaned.split(',').map(p => p.trim());
    if (parts.length === 2 && !parts[1].includes(' ')) {
      return `${parts[1]} ${parts[0]}`;
    }
  }

  return cleaned || 'Unknown Author';
}

/**
 * Check if a title looks like it needs cleaning
 */
export function needsCleaning(title) {
  if (!title) return false;
  return (
    title.includes('_') ||
    title.includes('OceanofPDF') ||
    title.includes('Z-Library') ||
    title.includes('LibGen') ||
    /\(\d+\)$/.test(title) ||
    /\.(mobi|epub|azw3?|pdf)$/i.test(title)
  );
}

/**
 * Clean a single highlight's metadata
 */
export function cleanHighlight(highlight) {
  if (!highlight) return highlight;

  return {
    ...highlight,
    title: cleanTitle(highlight.title),
    author: cleanAuthor(highlight.author)
  };
}

/**
 * Clean an array of highlights
 */
export function cleanHighlights(highlights) {
  if (!Array.isArray(highlights)) return highlights;
  return highlights.map(cleanHighlight);
}
