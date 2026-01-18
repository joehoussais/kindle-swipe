/**
 * Highlight - Kindle Sync Extension v2
 * Content script that runs on read.amazon.com/notebook
 *
 * COMPLETE REWRITE - More robust book switching
 */

// App URL - production
const APP_URL = 'https://kindle-swipe.netlify.app';

// Settings - conservative for reliability
const CLICK_WAIT = 300;      // Wait after clicking before checking
const POLL_INTERVAL = 100;   // How often to check for content
const RENDER_WAIT = 200;     // Wait for highlights to render
const BOOK_DELAY = 200;      // Delay between books
const TIMEOUT_PER_BOOK = 15000; // 15 seconds per book (increased for reliability)

// Debug mode - set to false for production
const DEBUG = false;
function debug(...args) {
  if (DEBUG) console.log('[Highlight]', ...args);
}

// Check if we're on the notebook page
if (window.location.pathname.includes('/notebook')) {
  initializeExtension();
}

function initializeExtension() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(addSyncButton, 1000));
  } else {
    setTimeout(addSyncButton, 1000);
  }
}

function addSyncButton() {
  if (document.getElementById('highlight-sync-btn')) return;

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

  const bookCount = document.querySelectorAll('#kp-notebook-library .kp-notebook-library-each-book').length;
  if (bookCount > 0) {
    showToast(`Found ${bookCount} books ready to sync!`, 'info');
  }
}

// Get current book's ASIN from the page
function getCurrentAsin() {
  return document.querySelector('#kp-notebook-annotations-asin')?.value || '';
}

// Scrape the currently displayed book's highlights
function scrapeCurrentBook() {
  const highlights = [];
  const titleEl = document.querySelector('h3.kp-notebook-metadata');
  const title = titleEl?.innerText?.trim() || '';
  const authorEl = document.querySelector('.kp-notebook-metadata + p, .kp-notebook-rowitem p.a-spacing-none');
  const author = authorEl?.innerText?.replace(/^By:\s*/i, '')?.trim() || '';
  const asin = getCurrentAsin();

  document.querySelectorAll('#kp-notebook-annotations > div').forEach(row => {
    const highlightSpan = row.querySelector('#highlight');
    const text = highlightSpan?.innerText?.trim() || '';
    if (!text) return;

    const locationLabel = row.querySelector('.a-size-small, .a-color-secondary')?.innerText || '';
    const locIdx = locationLabel.indexOf('Location:');
    const location = locIdx >= 0 ? parseInt(locationLabel.slice(locIdx + 9).trim().replace(/,/g, ''), 10) : null;

    const noteSpan = row.querySelector('#note');
    let note = noteSpan?.innerText?.trim() || '';
    if (note === 'Note:') note = '';

    highlights.push({ text, location, note: note || null });
  });

  return { asin, title, author, highlights };
}

// Get all book elements from the sidebar
function getAllBooks() {
  const books = [];
  document.querySelectorAll('#kp-notebook-library .kp-notebook-library-each-book').forEach(book => {
    const asin = book.id;
    const titleEl = book.querySelector('h2, h3');
    const title = titleEl?.innerText?.trim() || '';
    if (asin && asin.match(/^B[A-Z0-9]+$/i)) {
      books.push({ asin, element: book, title });
    }
  });
  return books;
}

// Click a book and wait for its content to load
function clickBookAndWait(book, previousAsin, bookIndex, totalBooks) {
  return new Promise(async (resolve) => {
    const startTime = Date.now();
    const targetAsin = book.asin;

    debug(`[${bookIndex + 1}/${totalBooks}] Clicking: "${book.title.slice(0, 40)}"`);
    debug(`  Target ASIN: ${targetAsin}, Previous ASIN: ${previousAsin || '(none)'}`);

    // IMPORTANT: Scroll the book element into view before clicking
    // This ensures the element is visible and clickable
    book.element.scrollIntoView({ behavior: 'instant', block: 'center' });
    await new Promise(r => setTimeout(r, 100)); // Wait for scroll to complete

    debug(`  Scrolled into view, attempting click...`);

    // Try clicking on the book element itself
    book.element.click();

    // Also try clicking on the title element inside (more reliable on some layouts)
    const titleEl = book.element.querySelector('h2, h3, .kp-notebook-library-each-book-title');
    if (titleEl) {
      debug(`  Also clicking title element: "${titleEl.innerText?.slice(0, 30)}"`);
      titleEl.click();
    }

    // Also try dispatching a mouse event for extra reliability
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    book.element.dispatchEvent(clickEvent);

    // Wait a bit before starting to poll
    setTimeout(() => {
      let pollCount = 0;
      const checkInterval = setInterval(() => {
        const currentAsin = getCurrentAsin();
        const elapsed = Date.now() - startTime;
        pollCount++;

        // Log every 10th poll to avoid spam
        if (pollCount % 10 === 0) {
          debug(`  Polling... current ASIN: ${currentAsin}, target: ${targetAsin}, elapsed: ${elapsed}ms`);
        }

        // Success: ASIN changed to what we expected
        if (currentAsin === targetAsin && currentAsin !== previousAsin) {
          clearInterval(checkInterval);
          debug(`  ✓ SUCCESS: Loaded in ${elapsed}ms (ASIN changed from ${previousAsin} to ${currentAsin})`);
          setTimeout(() => resolve({ success: true, asin: currentAsin }), RENDER_WAIT);
          return;
        }

        // Success: ASIN is the target (even if same as previous - first book case)
        if (currentAsin === targetAsin && previousAsin === '') {
          clearInterval(checkInterval);
          debug(`  ✓ SUCCESS: Already on this book (first book)`);
          setTimeout(() => resolve({ success: true, asin: currentAsin }), RENDER_WAIT);
          return;
        }

        // Timeout
        if (elapsed > TIMEOUT_PER_BOOK) {
          clearInterval(checkInterval);
          debug(`  ✗ TIMEOUT after ${elapsed}ms`);
          debug(`    Current ASIN: ${currentAsin}`);
          debug(`    Target ASIN: ${targetAsin}`);
          debug(`    Previous ASIN: ${previousAsin}`);
          debug(`    ASIN input exists: ${!!document.querySelector('#kp-notebook-annotations-asin')}`);

          // Log DOM state for debugging
          const asinInput = document.querySelector('#kp-notebook-annotations-asin');
          if (asinInput) {
            debug(`    ASIN input value: "${asinInput.value}"`);
          }

          resolve({ success: false, asin: currentAsin });
          return;
        }
      }, POLL_INTERVAL);
    }, CLICK_WAIT);
  });
}

// Show progress overlay
function showProgress(done, total, message, highlightCount = 0) {
  let overlay = document.getElementById('highlight-progress-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'highlight-progress-overlay';
    document.body.appendChild(overlay);
  }

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  overlay.innerHTML = `
    <div class="highlight-progress-content">
      <div class="highlight-turbo-badge">SYNCING</div>
      <div class="highlight-progress-logo">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      </div>
      <h2>Importing Highlights</h2>
      <div class="highlight-progress-bar">
        <div class="highlight-progress-fill" style="width: ${pct}%"></div>
      </div>
      <p class="highlight-progress-count">${done} / ${total}</p>
      ${highlightCount > 0 ? `<p class="highlight-stats">${highlightCount} highlights found</p>` : ''}
      <p class="highlight-progress-message">${message || ''}</p>
      <button id="highlight-cancel-btn" class="highlight-cancel-btn">Cancel</button>
    </div>
  `;

  document.getElementById('highlight-cancel-btn').onclick = () => {
    window._highlightSyncCancelled = true;
    overlay.remove();
  };
}

// Copy to clipboard
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
      return false;
    }
  }
}

// Show completion screen
async function showComplete(exportData, duration) {
  const overlay = document.getElementById('highlight-progress-overlay');
  if (!overlay) return;

  const jsonStr = JSON.stringify(exportData, null, 2);
  const speed = duration ? `${(duration / 1000).toFixed(1)}s` : '';

  window._kindleExportData = exportData;
  window._kindleExportJSON = jsonStr;

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
        : '<div style="background:#ff9800;color:white;padding:10px 20px;border-radius:8px;font-weight:600;margin:12px 0;display:inline-block;">⚠ Copy manually below</div>'
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

  document.getElementById('highlight-data-textarea').value = jsonStr;

  document.getElementById('highlight-copy-btn').onclick = async () => {
    const btn = document.getElementById('highlight-copy-btn');
    if (await copyToClipboard(jsonStr)) {
      btn.innerText = '✓ Copied!';
      btn.style.background = '#2E7D32';
      setTimeout(() => {
        btn.innerText = 'Copy Again';
        btn.style.background = '#2196F3';
      }, 1500);
    }
  };

  document.getElementById('highlight-open-app-btn').onclick = () => {
    window.open(APP_URL, '_blank');
  };

  document.getElementById('highlight-data-textarea').onclick = function() {
    this.select();
  };

  document.getElementById('highlight-close-btn').onclick = () => {
    overlay.remove();
  };
}

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

// Main sync function
async function startSync() {
  const startTime = Date.now();
  window._highlightSyncCancelled = false;

  debug('='.repeat(50));
  debug('STARTING SYNC');
  debug('='.repeat(50));

  const allBooks = getAllBooks();
  const total = allBooks.length;

  if (total === 0) {
    debug('ERROR: No books found!');
    debug('Checking DOM state...');
    debug(`  Library element exists: ${!!document.querySelector('#kp-notebook-library')}`);
    debug(`  Book elements found: ${document.querySelectorAll('.kp-notebook-library-each-book').length}`);
    showToast('No books found! Make sure you are signed in.', 'error');
    return;
  }

  debug(`Found ${total} books to sync:`);
  allBooks.forEach((b, i) => debug(`  ${i + 1}. ${b.title.slice(0, 50)} (${b.asin})`));

  const scrapedBooks = [];
  let totalHighlights = 0;
  let successCount = 0;
  let failCount = 0;
  let previousAsin = '';  // Start empty - first book click will work

  for (let i = 0; i < allBooks.length; i++) {
    if (window._highlightSyncCancelled) {
      debug('Cancelled by user');
      return;
    }

    const book = allBooks[i];
    showProgress(i, total, book.title.slice(0, 45), totalHighlights);

    // Click and wait for the book to load (pass index for logging)
    const result = await clickBookAndWait(book, previousAsin, i, total);

    if (result.success) {
      successCount++;
      // Update previousAsin for next iteration
      previousAsin = result.asin;

      // Scrape the highlights
      const data = scrapeCurrentBook();

      if (data.highlights.length > 0) {
        scrapedBooks.push(data);
        totalHighlights += data.highlights.length;
        debug(`  Scraped ${data.highlights.length} highlights from "${data.title.slice(0, 40)}"`);
      } else {
        debug(`  No highlights in this book`);
      }
    } else {
      failCount++;
      debug(`  FAILED - continuing to next book...`);
    }

    // Wait between books
    await new Promise(r => setTimeout(r, BOOK_DELAY));
  }

  debug('='.repeat(50));
  debug(`SYNC COMPLETE: ${successCount} succeeded, ${failCount} failed`);
  debug(`Total: ${totalHighlights} highlights from ${scrapedBooks.length} books`);
  debug('='.repeat(50));

  const duration = Date.now() - startTime;

  const exportData = {
    exportedAt: new Date().toISOString(),
    source: 'kindle-notebook-scraper',
    bookCount: scrapedBooks.length,
    totalHighlights: totalHighlights,
    books: scrapedBooks
  };

  // Save to localStorage
  try {
    localStorage.setItem('kindle-highlights-pending', JSON.stringify(exportData));
  } catch (e) {
    console.error('localStorage save failed:', e);
  }

  // Show results
  await showComplete(exportData, duration);

  console.log(`Sync complete: ${scrapedBooks.length} books, ${totalHighlights} highlights in ${(duration/1000).toFixed(1)}s`);
}
