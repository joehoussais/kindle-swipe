/**
 * Highlight - Kindle Sync Extension (HYPERSPEED VERSION)
 * Content script that runs on read.amazon.com/notebook
 *
 * FEATURES:
 * - One-click sync of ALL books
 * - HYPERSPEED optimizations
 * - Bulletproof completion with copy button
 * - Real-time progress with highlight counter
 * - Tracks ASIN changes to ensure proper book switching
 */

// App URL - production
const APP_URL = 'https://kindle-swipe.netlify.app';

// HYPERSPEED SETTINGS
const POLL_INTERVAL = 30;
const RENDER_WAIT = 100;
const BOOK_DELAY = 50;
const TIMEOUT_PER_BOOK = 6000;

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

// Wait for page content to load after clicking a book
// KEY FIX: Must wait for ASIN to CHANGE from previous, not just match expected
function waitForContent(expectedAsin, previousAsin, timeout) {
  return new Promise(resolve => {
    const start = Date.now();
    function check() {
      const currentAsin = document.querySelector('#kp-notebook-annotations-asin')?.value;
      const highlightCount = document.querySelectorAll('#kp-notebook-annotations #highlight').length;

      // Must match expected AND be different from previous (means page actually changed)
      if (currentAsin === expectedAsin && currentAsin !== previousAsin && highlightCount > 0) {
        setTimeout(() => resolve(true), RENDER_WAIT);
      } else if (currentAsin === expectedAsin && currentAsin !== previousAsin && Date.now() - start > 1200) {
        // ASIN matches and changed but no highlights after 1.2s - book probably has none
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

// Show/update progress overlay - HYPERSPEED style
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
      <div class="highlight-turbo-badge">HYPERSPEED MODE</div>
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

// Copy to clipboard with fallback
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const success = document.execCommand('copy');
      document.body.removeChild(ta);
      return success;
    } catch (e2) {
      console.error('Clipboard copy failed:', e2);
      return false;
    }
  }
}

// Show BULLETPROOF completion screen with copy button and visible data
async function showComplete(exportData, duration) {
  const overlay = document.getElementById('highlight-progress-overlay');
  if (!overlay) return;

  const jsonStr = JSON.stringify(exportData, null, 2);
  const speed = duration ? `${(duration / 1000).toFixed(1)}s` : '';

  // Store for recovery
  window._kindleExportData = exportData;
  window._kindleExportJSON = jsonStr;

  // Try to auto-copy
  const copied = await copyToClipboard(jsonStr);

  overlay.innerHTML = `
    <div class="highlight-progress-content" style="max-width: 500px;">
      <div class="highlight-success-icon">⚡</div>
      <h2>Done! ${speed}</h2>
      <p class="highlight-success-stats">
        ${exportData.totalHighlights} highlights from ${exportData.bookCount} books
      </p>

      ${copied
        ? '<div style="background:#4CAF50;color:white;padding:10px 20px;border-radius:8px;font-weight:600;margin:12px 0;display:inline-block;">✓ COPIED TO CLIPBOARD</div>'
        : '<div style="background:#ff9800;color:white;padding:10px 20px;border-radius:8px;font-weight:600;margin:12px 0;display:inline-block;">⚠ Auto-copy failed - copy manually below</div>'
      }

      <div style="margin: 16px 0;">
        <button id="highlight-copy-btn" class="highlight-done-btn" style="background:#2196F3;margin-right:8px;">
          ${copied ? 'Copy Again' : 'Copy to Clipboard'}
        </button>
        <button id="highlight-open-app-btn" class="highlight-done-btn">
          Open Highlight App
        </button>
      </div>

      <p style="font-size:12px;opacity:0.6;margin-bottom:8px;">Paste in Highlight app → Magic Import</p>

      <div style="text-align:left;margin-top:12px;">
        <p style="font-size:10px;opacity:0.4;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Your data (click to select all):</p>
        <textarea id="highlight-data-textarea" readonly style="width:100%;height:100px;background:#111;border:1px solid #333;border-radius:6px;padding:10px;font-family:monospace;font-size:10px;color:#8f8;resize:vertical;"></textarea>
      </div>

      <button id="highlight-close-btn" style="margin-top:16px;background:#333;color:white;border:none;padding:10px 24px;font-size:13px;border-radius:6px;cursor:pointer;">Close</button>
    </div>
  `;

  // Set textarea value
  document.getElementById('highlight-data-textarea').value = jsonStr;

  // Copy button
  document.getElementById('highlight-copy-btn').onclick = async () => {
    const btn = document.getElementById('highlight-copy-btn');
    if (await copyToClipboard(jsonStr)) {
      btn.innerText = '✓ Copied!';
      btn.style.background = '#2E7D32';
      setTimeout(() => {
        btn.innerText = 'Copy Again';
        btn.style.background = '#2196F3';
      }, 1500);
    } else {
      btn.innerText = 'Failed - select textarea + Cmd+C';
      btn.style.background = '#f44336';
    }
  };

  // Open app button
  document.getElementById('highlight-open-app-btn').onclick = () => {
    window.open(APP_URL, '_blank');
  };

  // Select all in textarea
  document.getElementById('highlight-data-textarea').onclick = function() {
    this.select();
  };

  // Close button
  document.getElementById('highlight-close-btn').onclick = () => {
    overlay.remove();
  };

  console.log('=== EXPORT COMPLETE ===');
  console.log('Highlights:', exportData.totalHighlights, 'from', exportData.bookCount, 'books');
  console.log('Backup: copy(window._kindleExportJSON)');
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

// Main HYPERSPEED sync function
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
  let previousAsin = ''; // Track previous ASIN to detect actual page changes

  for (let i = 0; i < allBooks.length; i++) {
    if (window._highlightSyncCancelled) {
      console.log('Sync cancelled by user');
      return;
    }

    const book = allBooks[i];
    showProgress(i, total, book.title.slice(0, 45), totalHighlights);

    try {
      book.element.click();

      // Pass previousAsin to detect actual page change
      const loaded = await waitForContent(book.asin, previousAsin, TIMEOUT_PER_BOOK);

      if (!loaded) {
        console.log('Timeout:', book.title);
        errorCount++;
        continue;
      }

      // Update previousAsin after successful load
      previousAsin = book.asin;

      const data = scrapeCurrentBook();

      if (data.highlights.length > 0) {
        scrapedBooks.push(data);
        totalHighlights += data.highlights.length;
        console.log('✓', data.title, '-', data.highlights.length);
      } else {
        console.log('○', data.title, '- no highlights');
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

  // Store in localStorage for the app to pick up
  try {
    localStorage.setItem('kindle-highlights-pending', JSON.stringify(exportData));
  } catch (e) {
    console.error('Could not save to localStorage:', e);
  }

  // Show bulletproof completion screen
  await showComplete(exportData, duration);

  console.log('HYPERSPEED sync complete!', exportData.bookCount, 'books,', totalHighlights, 'highlights in', (duration/1000).toFixed(1) + 's');
  if (errorCount > 0) {
    console.log('Timeouts/errors:', errorCount);
  }
}
