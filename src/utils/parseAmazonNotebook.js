/**
 * Parse highlights from Amazon Kindle Notebook
 *
 * Supports multiple formats:
 * 1. Bookcision JSON export
 * 2. Raw HTML copy-paste from read.amazon.com/notebook
 * 3. Plain text copy-paste from Amazon notebook (e.g., "Your Kindle Notes For:")
 * 4. Any messy paste - we'll do our best!
 */

export function parseAmazonNotebook(input) {
  const trimmed = input.trim();

  // Try to detect format
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return parseBookcisionJson(trimmed);
  }

  // Check for Amazon notebook plain text format
  // "Your Kindle Notes For:" or similar patterns
  if (trimmed.includes('Your Kindle Notes For:') ||
      trimmed.includes('Kindle Notes For:') ||
      /\d+\s*Highlight\(s\)/.test(trimmed) ||
      /Yellow highlight|Pink highlight|Blue highlight|Orange highlight/i.test(trimmed)) {
    return parseAmazonPlainText(trimmed);
  }

  // Check if it looks like HTML
  if (trimmed.includes('<') && trimmed.includes('>')) {
    return parseNotebookHtml(trimmed);
  }

  // Fallback: try plain text patterns
  return parseAmazonPlainText(trimmed);
}

/**
 * Parse Bookcision JSON export or Kindle Scraper bookmarklet export
 * Bookcision format: { title, authors, highlights: [{ text, location, ... }] }
 * Bookmarklet format: { books: [{ asin, title, author, highlights: [{ text, location, note }] }] }
 * Or array of books
 */
function parseBookcisionJson(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    const highlights = [];

    // Handle bookmarklet export format: { books: [...], exportedAt, bookCount, totalHighlights }
    if (data.books && Array.isArray(data.books)) {
      for (const book of data.books) {
        const title = book.title || 'Unknown Title';
        const author = book.author || 'Unknown Author';

        if (book.highlights && Array.isArray(book.highlights)) {
          for (const h of book.highlights) {
            if (!h.text?.trim()) continue;

            highlights.push({
              id: generateId(title, h.text),
              title,
              author,
              text: h.text.trim(),
              location: h.location?.toString() || null,
              page: null,
              note: h.note || null,
              color: h.color || 'yellow',
              source: 'kindle'
            });
          }
        }
      }
      return highlights;
    }

    // Handle single book or array of books (Bookcision format)
    const books = Array.isArray(data) ? data : [data];

    for (const book of books) {
      const title = book.title || 'Unknown Title';
      const author = book.authors || book.author || 'Unknown Author';

      if (book.highlights && Array.isArray(book.highlights)) {
        for (const h of book.highlights) {
          if (!h.text?.trim()) continue;

          highlights.push({
            id: generateId(title, h.text),
            title,
            author,
            text: h.text.trim(),
            location: h.location?.value?.toString() || h.location || null,
            page: h.page || null,
            note: h.note || null,
            color: h.color || null,
            source: 'kindle'
          });
        }
      }
    }

    return highlights;
  } catch (e) {
    console.error('Failed to parse Bookcision JSON:', e);
    return [];
  }
}

/**
 * Parse HTML from read.amazon.com/notebook
 * This is more fragile as Amazon's HTML structure may change
 */
function parseNotebookHtml(html) {
  const highlights = [];

  // Create a temporary DOM to parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Try different selectors based on known Amazon notebook structures
  // The notebook groups highlights by book

  // Try to find book containers
  const bookContainers = doc.querySelectorAll('[id^="kp-notebook-annotations"]') ||
                          doc.querySelectorAll('.kp-notebook-row-separator') ||
                          doc.querySelectorAll('[class*="annotation"]');

  if (bookContainers.length === 0) {
    // Fallback: try to parse any highlighted text patterns
    return parseHighlightPatterns(html);
  }

  // Parse structured HTML
  let currentTitle = 'Unknown Title';
  let currentAuthor = 'Unknown Author';

  const allElements = doc.body.querySelectorAll('*');

  for (const el of allElements) {
    // Look for book title
    if (el.classList?.contains('kp-notebook-metadata') ||
        el.classList?.contains('book-title') ||
        el.tagName === 'H1') {
      const titleEl = el.querySelector('h1, .kp-notebook-cover-title');
      if (titleEl) currentTitle = titleEl.textContent.trim();

      const authorEl = el.querySelector('.kp-notebook-cover-author, .author');
      if (authorEl) currentAuthor = authorEl.textContent.replace(/^by\s+/i, '').trim();
    }

    // Look for highlight text
    if (el.id?.startsWith('highlight-') ||
        el.classList?.contains('kp-notebook-highlight') ||
        el.classList?.contains('highlight')) {
      const text = el.textContent.trim();
      if (text && text.length > 5) {
        highlights.push({
          id: generateId(currentTitle, text),
          title: currentTitle,
          author: currentAuthor,
          text,
          location: null,
          page: null,
          source: 'kindle'
        });
      }
    }
  }

  return highlights;
}

/**
 * Parse plain text copy-paste from Amazon Kindle Notebook
 *
 * Format example:
 * Your Kindle Notes For:
 *
 * Book Title
 * Author Name
 *
 * Last accessed on...
 * 4Highlight(s)|0Note(s)
 * Yellow highlight | Location: 26Options
 * "Quote text here"
 * Yellow highlight | Location: 31Options
 * "Another quote"
 */
function parseAmazonPlainText(text) {
  const highlights = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let title = 'Unknown Title';
  let author = 'Unknown Author';
  let currentLocation = null;
  let collectingQuote = false;
  let currentQuote = [];

  // First pass: find title and author
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for "Your Kindle Notes For:" pattern
    if (line.includes('Kindle Notes For:')) {
      // Next non-empty line should be title
      for (let j = i + 1; j < lines.length && j < i + 5; j++) {
        const nextLine = lines[j];
        if (nextLine &&
            !nextLine.includes('Last accessed') &&
            !nextLine.match(/\d+\s*Highlight/)) {
          // This is likely the title
          if (!title || title === 'Unknown Title') {
            title = nextLine;
          } else if (!author || author === 'Unknown Author') {
            // Next one might be author
            author = nextLine;
            break;
          }
        }
      }
      break;
    }
  }

  // Second pass: extract highlights
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect highlight marker line: "Yellow highlight | Location: 26Options"
    const highlightMatch = line.match(/(Yellow|Pink|Blue|Orange)\s+highlight\s*\|\s*(?:Location|Page|Loc)[:\s]*(\d+)/i);

    if (highlightMatch) {
      // Save previous quote if we were collecting one
      if (currentQuote.length > 0) {
        const quoteText = cleanQuoteText(currentQuote.join(' '));
        if (quoteText.length > 5) {
          highlights.push({
            id: generateId(title, quoteText),
            title,
            author,
            text: quoteText,
            location: currentLocation,
            page: null,
            color: highlightMatch[1].toLowerCase(),
            source: 'kindle'
          });
        }
      }

      // Start new quote
      currentLocation = highlightMatch[2];
      currentQuote = [];
      collectingQuote = true;
      continue;
    }

    // Skip metadata lines
    if (line.includes('Last accessed') ||
        line.match(/^\d+\s*Highlight\(s\)/) ||
        line.includes('Kindle Notes For:') ||
        line === title ||
        line === author ||
        line.match(/^Options$/)) {
      continue;
    }

    // If we're collecting a quote, add this line
    if (collectingQuote) {
      currentQuote.push(line);
    }
  }

  // Don't forget the last quote
  if (currentQuote.length > 0) {
    const quoteText = cleanQuoteText(currentQuote.join(' '));
    if (quoteText.length > 5) {
      highlights.push({
        id: generateId(title, quoteText),
        title,
        author,
        text: quoteText,
        location: currentLocation,
        page: null,
        source: 'kindle'
      });
    }
  }

  return highlights;
}

/**
 * Clean up quote text - remove surrounding quotes, extra whitespace
 */
function cleanQuoteText(text) {
  return text
    .replace(/^[""\u201C\u201D]+|[""\u201C\u201D]+$/g, '') // Remove surrounding quotes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/Options$/i, '') // Remove trailing "Options" from Amazon UI
    .trim();
}

/**
 * Last resort: parse common highlight patterns from raw text/HTML
 */
function parseHighlightPatterns(text) {
  const highlights = [];

  // Strip HTML tags for pattern matching
  const plainText = text.replace(/<[^>]+>/g, '\n');

  // Look for "Highlight" followed by content
  const highlightPattern = /(?:Highlight|Note)(?:\s*\(.*?\))?\s*[:|-]?\s*(.+?)(?=(?:Highlight|Note|$))/gi;

  let match;
  while ((match = highlightPattern.exec(plainText)) !== null) {
    const highlightText = match[1].trim();
    if (highlightText && highlightText.length > 10) {
      highlights.push({
        id: generateId('Imported', highlightText),
        title: 'Imported Highlights',
        author: 'Unknown',
        text: highlightText,
        location: null,
        page: null,
        source: 'kindle'
      });
    }
  }

  return highlights;
}

function generateId(title, text) {
  const str = `${title}:${text}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `amz_${Math.abs(hash).toString(36)}`;
}
