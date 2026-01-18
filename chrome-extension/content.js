/**
 * Highlight - Kindle Sync Extension (TURBO VERSION)
 * Content script that runs on read.amazon.com/notebook
 *
 * FEATURES:
 * - One-click sync of ALL books
 * - TURBO speed optimizations
 * - Auto-opens Highlight app with data
 * - Real-time progress with highlight counter
 */

// App URL - production
const APP_URL = 'https://kindle-swipe.netlify.app';

// TURBO SETTINGS
const POLL_INTERVAL = 50;
const RENDER_WAIT = 150;
const BOOK_DELAY = 100;
const TIMEOUT_PER_BOOK = 8000;

// Check if we're on the notebook page
if (window.location.pathname.includes('/notebook')) {
  initializeExtension();
}

function initializeExtension() {
  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addSyncButton);
  } else {
    // Small delay to ensure Amazon's content loads
    setTimeout(addSyncButton, 500);
  }
}

function addSyncButton() {
  // Don't add if already exists
  if (document.getElementById('highlight-sync-btn')) return;

  // Create floating button
  const btn = document.createElement('button');
  btn.id = 'highlight-sync-btn';
  btn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
    <span>Sync to Highlight</span>
  `;
  btn.onclick = startSync;
  document.body.appendChild(btn);

  // Check how many books are available
  const bookCount = document.querySelectorAll('#kp-notebook-library .kp-notebook-library-each-book').length;
  if (bookCount > 0) {
    showToast(`Found ${bookCount} books - click to sync all highlights!`, 'info');
  }
}

// Scrape the currently displayed book's highlights
function scrapeCurrentBook() {
  const highlights = [];

  const titleEl = document.querySelector('h3.kp-notebook-metadata');
  const title = titleEl?.innerText?.trim() || '';

  const authorEl = document.querySelector('.kp-notebook-metadata + p, .kp-notebook-rowitem p.a-spacing-none');
  const author = authorEl?.innerText?.replace(/^By:\s*/i, '')?.trim() || '';

  const asin = document.querySelector('#kp-notebook-annotations-asin')?.value || '';

  document.querySelectorAll('#kp-notebook-annotations > div').forEach(row => {
    const highlightSpan = row.querySelector('#highlight');
    const text = highlightSpan?.innerText?.trim() || '';

    if (!text || text.length === 0) return;

    const locationLabel = row.querySelector('.a-size-small, .a-color-secondary')?.innerText || '';
    const locIdx = locationLabel.indexOf('Location:');
    const location = locIdx >= 0 ? parseInt(locationLabel.slice(locIdx + 9).trim().replace(/,/g, ''), 10) : null;

    const noteSpan = row.querySelector('#note');
    let note = noteSpan?.innerText?.trim() || '';
    if (note === 'Note:') note = '';

    highlights.push({
      text,
      location,
      note: note || null
    });
  });

  return { asin, title, author, highlights };
}

// Get all book elements from the sidebar
function getAllBooks() {
  const books = [];
  const bookElements = document.querySelectorAll('#kp-notebook-library .kp-notebook-library-each-book');

  bookElements.forEach(book => {
    const asin = book.id;
    const titleEl = book.querySelector('h2, h3');
    const title = titleEl?.innerText?.trim() || '';

    if (asin && asin.match(/^B[A-Z0-9]+$/i)) {
      books.push({ asin, element: book, title });
    }
  });

  return books;
}

// Wait for page content to load after clicking a book - TURBO version
function waitForContent(expectedAsin, timeout) {
  return new Promise(resolve => {
    const start = Date.now();
    function check() {
      const currentAsin = document.querySelector('#kp-notebook-annotations-asin')?.value;
      const highlightCount = document.querySelectorAll('#kp-notebook-annotations #highlight').length;

      if (currentAsin === expectedAsin && highlightCount > 0) {
        setTimeout(() => resolve(true), RENDER_WAIT);
      } else if (currentAsin === expectedAsin && Date.now() - start > 1500) {
        // Book probably has no highlights
        resolve(true);
      } else if (Date.now() - start > timeout) {
        resolve(false);
      } else {
        setTimeout(check, POLL_INTERVAL);
      }
    }
    check();
  });
}

// Show/update progress overlay - TURBO style
function showProgress(done, total, message, highlightCount = 0) {
  let overlay = document.getElementById('highlight-progress-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'highlight-progress-overlay';
    document.body.appendChild(overlay);
  }

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const statsLine = highlightCount > 0 ? `<p class="highlight-stats">${highlightCount} highlights found</p>` : '';

  overlay.innerHTML = `
    <div class="highlight-progress-content">
      <div class="highlight-turbo-badge">TURBO MODE</div>
      <div class="highlight-progress-logo">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      </div>
      <h2>Syncing Highlights</h2>
      <div class="highlight-progress-bar">
        <div class="highlight-progress-fill" style="width: ${pct}%"></div>
      </div>
      <p class="highlight-progress-count">${done} / ${total}</p>
      ${statsLine}
      <p class="highlight-progress-message">${message || ''}</p>
      <button id="highlight-cancel-btn" class="highlight-cancel-btn">Cancel</button>
    </div>
  `;

  document.getElementById('highlight-cancel-btn').onclick = () => {
    window._highlightSyncCancelled = true;
    overlay.remove();
  };
}

// Show completion screen
function showComplete(exportData, duration) {
  const overlay = document.getElementById('highlight-progress-overlay');
  if (!overlay) return;

  const speed = duration ? ` in ${(duration / 1000).toFixed(1)}s` : '';

  overlay.innerHTML = `
    <div class="highlight-progress-content">
      <div class="highlight-success-icon">⚡</div>
      <h2>Done${speed}!</h2>
      <p class="highlight-success-stats">
        ${exportData.totalHighlights} highlights from ${exportData.bookCount} books
      </p>
      <p class="highlight-success-message">
        Opening Highlight app...
      </p>
      <button id="highlight-done-btn" class="highlight-done-btn">Close</button>
    </div>
  `;

  document.getElementById('highlight-done-btn').onclick = () => {
    overlay.remove();
  };

  // Auto-close after 4 seconds
  setTimeout(() => {
    overlay?.remove();
  }, 4000);
}

// Show toast notification
function showToast(message, type = 'info') {
  const existing = document.getElementById('highlight-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'highlight-toast';
  toast.className = `highlight-toast highlight-toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
}

// Main TURBO sync function
async function startSync() {
  const startTime = Date.now();
  window._highlightSyncCancelled = false;

  const allBooks = getAllBooks();
  const total = allBooks.length;

  if (total === 0) {
    showToast('No books found! Make sure you are signed in and have highlights.', 'error');
    return;
  }

  const scrapedBooks = [];
  let totalHighlights = 0;
  let errorCount = 0;

  for (let i = 0; i < allBooks.length; i++) {
    if (window._highlightSyncCancelled) {
      console.log('Sync cancelled by user');
      return;
    }

    const book = allBooks[i];
    showProgress(i, total, book.title.slice(0, 45), totalHighlights);

    try {
      book.element.click();
      const loaded = await waitForContent(book.asin, TIMEOUT_PER_BOOK);

      if (!loaded) {
        console.log('Timeout:', book.title);
        errorCount++;
        continue;
      }

      const data = scrapeCurrentBook();

      if (data.highlights.length > 0) {
        scrapedBooks.push(data);
        totalHighlights += data.highlights.length;
        console.log('✓', data.title, '-', data.highlights.length);
      }
    } catch (err) {
      console.error('Error:', book.asin, err);
      errorCount++;
    }

    await new Promise(r => setTimeout(r, BOOK_DELAY));
  }

  const duration = Date.now() - startTime;

  const exportData = {
    exportedAt: new Date().toISOString(),
    source: 'kindle-notebook-scraper',
    bookCount: scrapedBooks.length,
    totalHighlights: totalHighlights,
    books: scrapedBooks
  };

  showProgress(total, total, 'Opening Highlight app...', totalHighlights);

  // Store in localStorage for the app to pick up
  try {
    localStorage.setItem('kindle-highlights-pending', JSON.stringify(exportData));
  } catch (e) {
    console.error('Could not save to localStorage:', e);
  }

  // Open the app with the data
  const appWindow = window.open(APP_URL, '_blank');

  // Try to send via postMessage after a delay
  setTimeout(() => {
    try {
      appWindow?.postMessage({
        type: 'kindle-highlights-import',
        data: exportData
      }, APP_URL);
    } catch (e) {
      console.log('Could not send postMessage:', e);
    }
  }, 1500);

  // Show completion
  setTimeout(() => {
    showComplete(exportData, duration);
  }, 400);

  console.log('TURBO sync complete!', exportData.bookCount, 'books,', totalHighlights, 'highlights in', (duration/1000).toFixed(1) + 's');
}
