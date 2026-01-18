/**
 * Kindle Highlights Scraper Bookmarklet - TURBO VERSION
 *
 * SPEED OPTIMIZATIONS:
 * - Faster polling (50ms instead of 150ms)
 * - Reduced delays between books (100ms instead of 200ms)
 * - Shorter render wait (150ms instead of 300ms)
 * - Parallel content detection
 * - Smart timeouts (shorter for books with few highlights)
 *
 * HOW IT WORKS:
 * 1. User goes to read.amazon.com/notebook and logs in
 * 2. User clicks the bookmarklet
 * 3. Script TURBO-scrapes all books' highlights
 * 4. Auto-copies to clipboard + tries postMessage
 */

// The app URL for postMessage targeting
export const APP_ORIGIN = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://kindle-swipe.netlify.app';

// Human-readable version of the bookmarklet code
export const bookmarkletSource = `
(function() {
  // Target app origin - will be replaced when generating bookmarklet
  const APP_ORIGIN = '__APP_ORIGIN__';

  // TURBO SETTINGS - optimized for speed
  const POLL_INTERVAL = 50;       // How often to check for content (ms)
  const RENDER_WAIT = 150;        // Wait for highlights to render (ms)
  const BOOK_DELAY = 100;         // Delay between books (ms)
  const TIMEOUT_PER_BOOK = 8000;  // Max wait per book (ms) - reduced from 15s

  // Scrape the currently displayed book's highlights
  function scrapeCurrentBook() {
    const highlights = [];

    // Get book metadata from the header area
    const titleEl = document.querySelector('h3.kp-notebook-metadata');
    const title = titleEl?.innerText?.trim() || '';

    // Author is in a paragraph near the title
    const authorEl = document.querySelector('.kp-notebook-metadata + p, .kp-notebook-rowitem p.a-spacing-none');
    const author = authorEl?.innerText?.replace(/^By:\\s*/i, '')?.trim() || '';

    const asin = document.querySelector('#kp-notebook-annotations-asin')?.value || '';

    // Find all annotation rows in the main content area
    document.querySelectorAll('#kp-notebook-annotations > div').forEach(row => {
      // The highlight text is in a span with id="highlight"
      const highlightSpan = row.querySelector('#highlight');
      const text = highlightSpan?.innerText?.trim() || '';

      if (!text || text.length === 0) return;

      // Location is in the annotation bar label (e.g., "Yellow highlight | Location: 60")
      const locationLabel = row.querySelector('.a-size-small, .a-color-secondary')?.innerText || '';
      const locIdx = locationLabel.indexOf('Location:');
      const location = locIdx >= 0 ? parseInt(locationLabel.slice(locIdx + 9).trim().replace(/,/g, ''), 10) : null;

      // Notes have id="note"
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

      // Accept any ASIN-like ID (starts with B and is alphanumeric)
      if (asin && asin.match(/^B[A-Z0-9]+$/i)) {
        books.push({ asin, element: book, title });
      }
    });

    return books;
  }

  // Show progress overlay - TURBO style
  function showProgress(done, total, message, stats) {
    let overlay = document.getElementById('kindle-scraper-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'kindle-scraper-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:white;font-family:system-ui,-apple-system,sans-serif;';
      document.body.appendChild(overlay);
    }
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const statsLine = stats ? '<div style="margin-top:12px;font-size:13px;color:#4CAF50;">' + stats.highlights + ' highlights found</div>' : '';

    overlay.innerHTML =
      '<div style="text-align:center;max-width:420px;padding:20px;">' +
        '<div style="font-size:14px;text-transform:uppercase;letter-spacing:2px;opacity:0.5;margin-bottom:8px;">TURBO MODE</div>' +
        '<div style="font-size:28px;margin-bottom:20px;font-weight:600;">Importing Highlights</div>' +
        '<div style="width:320px;height:6px;background:#222;border-radius:3px;overflow:hidden;margin:0 auto;">' +
          '<div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#4CAF50,#8BC34A);transition:width 0.15s;"></div>' +
        '</div>' +
        '<div style="margin-top:16px;font-size:24px;font-weight:500;">' + done + ' / ' + total + '</div>' +
        statsLine +
        '<div style="margin-top:8px;font-size:13px;opacity:0.6;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (message || '') + '</div>' +
        '<button id="kindle-scraper-cancel" style="margin-top:20px;background:transparent;color:#999;border:1px solid #444;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:12px;">Cancel</button>' +
      '</div>';

    document.getElementById('kindle-scraper-cancel').onclick = function() {
      window._kindleScraperCancelled = true;
      overlay.remove();
    };
  }

  // Wait for page content to load after clicking a book - TURBO version
  function waitForContent(expectedAsin, timeout) {
    return new Promise(function(resolve) {
      const start = Date.now();
      function check() {
        const currentAsin = document.querySelector('#kp-notebook-annotations-asin')?.value;
        const highlightCount = document.querySelectorAll('#kp-notebook-annotations #highlight').length;

        if (currentAsin === expectedAsin && highlightCount > 0) {
          // Quick render wait
          setTimeout(function() { resolve(true); }, RENDER_WAIT);
        } else if (currentAsin === expectedAsin && Date.now() - start > 1500) {
          // ASIN matches but no highlights after 1.5s - book probably has none
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

  // Try to copy to clipboard - ALWAYS do this first as safety net
  async function copyToClipboard(jsonStr) {
    try {
      await navigator.clipboard.writeText(jsonStr);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = jsonStr;
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

  // Try to send data to the Highlight app (best effort, don't rely on it)
  function sendToApp(exportData) {
    // Try localStorage as a bridge - this is more reliable than postMessage
    try {
      localStorage.setItem('kindle-highlights-pending', JSON.stringify(exportData));
    } catch (e) {
      console.log('Could not save to localStorage:', e);
    }

    // Try to find the opener window (if opened from app)
    if (window.opener) {
      try {
        window.opener.postMessage({
          type: 'kindle-highlights-import',
          data: exportData
        }, APP_ORIGIN);
      } catch (e) {
        console.log('Could not send to opener:', e);
      }
    }
  }

  // Show completion screen - NEVER auto-close, ALWAYS show copy button
  async function showComplete(exportData, duration) {
    const overlay = document.getElementById('kindle-scraper-overlay');
    if (!overlay) return;

    const jsonStr = JSON.stringify(exportData, null, 2);
    const speed = duration ? ' in ' + (duration / 1000).toFixed(1) + 's' : '';

    // Try to auto-copy to clipboard FIRST
    const copied = await copyToClipboard(jsonStr);
    const copyStatus = copied
      ? '<div style="font-size:14px;color:#4CAF50;margin-bottom:16px;">✓ Copied to clipboard!</div>'
      : '<div style="font-size:14px;color:#ff9800;margin-bottom:8px;">⚠ Auto-copy failed - click button below</div>';

    // ALWAYS show the copy button as a safety net - NEVER auto-close
    overlay.innerHTML =
      '<div style="text-align:center;max-width:500px;padding:20px;">' +
        '<div style="font-size:64px;margin-bottom:16px;">⚡</div>' +
        '<div style="font-size:28px;margin-bottom:8px;font-weight:600;color:#4CAF50;">Done' + speed + '!</div>' +
        '<div style="font-size:18px;margin-bottom:16px;opacity:0.9;">' +
          exportData.totalHighlights + ' highlights from ' + exportData.bookCount + ' books' +
        '</div>' +
        copyStatus +
        '<button id="kindle-scraper-copy" style="background:#4CAF50;color:white;border:none;padding:14px 36px;font-size:16px;border-radius:8px;cursor:pointer;margin-bottom:12px;">' +
          (copied ? '✓ Copied! (click to copy again)' : 'Copy to Clipboard') +
        '</button>' +
        '<div style="font-size:13px;opacity:0.6;margin-bottom:16px;">' +
          'Paste into the Highlight app to import' +
        '</div>' +
        '<button id="kindle-scraper-close" style="background:transparent;color:#999;border:1px solid #444;padding:8px 24px;font-size:13px;border-radius:6px;cursor:pointer;">Close</button>' +
      '</div>';

    document.getElementById('kindle-scraper-copy').onclick = async function() {
      const success = await copyToClipboard(jsonStr);
      if (success) {
        this.innerText = '✓ Copied!';
        this.style.background = '#2E7D32';
      } else {
        this.innerText = 'Copy failed - try Cmd+A, Cmd+C in console';
        this.style.background = '#f44336';
      }
    };

    document.getElementById('kindle-scraper-close').onclick = function() {
      overlay.remove();
    };

    // Store in window for emergency recovery
    window._kindleExportData = exportData;
    window._kindleExportJSON = jsonStr;
    console.log('=== BACKUP: Data stored in window._kindleExportJSON ===');
    console.log('If clipboard failed, run: copy(window._kindleExportJSON)');
  }

  // Main TURBO scraper function
  async function scrapeAll() {
    const startTime = Date.now();
    window._kindleScraperCancelled = false;

    const allBooks = getAllBooks();
    const total = allBooks.length;

    if (total === 0) {
      alert('No books found! Make sure you are on read.amazon.com/notebook and signed in.');
      return;
    }

    const scrapedBooks = [];
    let totalHighlights = 0;
    let errorCount = 0;

    for (let i = 0; i < allBooks.length; i++) {
      if (window._kindleScraperCancelled) {
        console.log('Scraping cancelled by user');
        return;
      }

      const book = allBooks[i];
      showProgress(i, total, book.title.slice(0, 45), { highlights: totalHighlights });

      try {
        // Click on the book to load its highlights
        book.element.click();

        // Wait for content to load (TURBO timeout)
        const loaded = await waitForContent(book.asin, TIMEOUT_PER_BOOK);

        if (!loaded) {
          console.log('Timeout:', book.title);
          errorCount++;
          continue;
        }

        // Scrape the highlights
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

      // TURBO delay between books
      await new Promise(r => setTimeout(r, BOOK_DELAY));
    }

    const duration = Date.now() - startTime;

    // Create export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      source: 'kindle-notebook-scraper',
      bookCount: scrapedBooks.length,
      totalHighlights: totalHighlights,
      books: scrapedBooks
    };

    showProgress(total, total, 'Copying to clipboard...', { highlights: totalHighlights });

    // Try to send to the app (localStorage + postMessage) - best effort
    sendToApp(exportData);

    // Show completion screen with copy button - ALWAYS
    setTimeout(function() {
      showComplete(exportData, duration);
    }, 300);

    console.log('TURBO complete!', exportData.bookCount, 'books,', totalHighlights, 'highlights in', (duration/1000).toFixed(1) + 's');
    if (errorCount > 0) {
      console.log('Errors:', errorCount);
    }
  }

  // Start TURBO scraping
  scrapeAll().catch(function(err) {
    console.error('Scraper error:', err);
    alert('Error: ' + err.message);
    const overlay = document.getElementById('kindle-scraper-overlay');
    if (overlay) overlay.remove();
  });
})();
`;

/**
 * Generate TURBO bookmarklet code with the correct app origin
 * BULLETPROOF VERSION: Never auto-closes, always copies to clipboard, always shows copy button
 */
export function generateBookmarkletCode(appOrigin) {
  const origin = appOrigin || (typeof window !== 'undefined' ? window.location.origin : 'https://kindle-swipe.netlify.app');

  // BULLETPROOF minified version - never auto-closes, always copies, always shows button
  return `javascript:(function(){const APP_ORIGIN="${origin}",POLL=50,WAIT=150,DELAY=100,TIMEOUT=8e3;async function cp(s){try{await navigator.clipboard.writeText(s);return!0}catch(e){try{const t=document.createElement("textarea");t.value=s;t.style.cssText="position:fixed;top:0;left:0;opacity:0;";document.body.appendChild(t);t.focus();t.select();const r=document.execCommand("copy");document.body.removeChild(t);return r}catch(e2){return!1}}}function e(){const e=[],t=document.querySelector("h3.kp-notebook-metadata")?.innerText?.trim()||"",n=document.querySelector(".kp-notebook-metadata + p, .kp-notebook-rowitem p.a-spacing-none")?.innerText?.replace(/^By:\\s*/i,"")?.trim()||"",o=document.querySelector("#kp-notebook-annotations-asin")?.value||"";return document.querySelectorAll("#kp-notebook-annotations > div").forEach(t=>{const n=t.querySelector("#highlight")?.innerText?.trim()||"";if(!n)return;const o=t.querySelector(".a-size-small, .a-color-secondary")?.innerText||"",s=o.indexOf("Location:");const a=s>=0?parseInt(o.slice(s+9).trim().replace(/,/g,""),10):null;let l=t.querySelector("#note")?.innerText?.trim()||"";"Note:"===l&&(l=""),e.push({text:n,location:a,note:l||null})}),{asin:o,title:t,author:n,highlights:e}}function t(){const e=[];return document.querySelectorAll("#kp-notebook-library .kp-notebook-library-each-book").forEach(t=>{const n=t.id,o=t.querySelector("h2, h3")?.innerText?.trim()||"";n&&n.match(/^B[A-Z0-9]+$/i)&&e.push({asin:n,element:t,title:o})}),e}function n(e,t,n,o){let s=document.getElementById("kindle-scraper-overlay");s||(s=document.createElement("div"),s.id="kindle-scraper-overlay",s.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:white;font-family:system-ui,-apple-system,sans-serif;",document.body.appendChild(s));const a=t>0?Math.round(e/t*100):0,l=o?'<div style="margin-top:12px;font-size:13px;color:#4CAF50;">'+o+" highlights</div>":"";s.innerHTML='<div style="text-align:center;max-width:420px;padding:20px;"><div style="font-size:11px;letter-spacing:2px;opacity:0.5;margin-bottom:8px;">TURBO MODE</div><div style="font-size:28px;margin-bottom:20px;font-weight:600;">Importing Highlights</div><div style="width:320px;height:6px;background:#222;border-radius:3px;overflow:hidden;margin:0 auto;"><div style="width:'+a+'%;height:100%;background:linear-gradient(90deg,#4CAF50,#8BC34A);transition:width 0.15s;"></div></div><div style="margin-top:16px;font-size:24px;font-weight:500;">'+e+" / "+t+"</div>"+l+'<div style="margin-top:8px;font-size:13px;opacity:0.6;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+(n||"")+'</div><button id="kindle-scraper-cancel" style="margin-top:20px;background:transparent;color:#999;border:1px solid #444;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:12px;">Cancel</button></div>',document.getElementById("kindle-scraper-cancel").onclick=function(){window._kindleScraperCancelled=!0,s.remove()}}function o(e,t){return new Promise(function(n){const o=Date.now();!function s(){const a=document.querySelector("#kp-notebook-annotations-asin")?.value,l=document.querySelectorAll("#kp-notebook-annotations #highlight").length;a===e&&l>0?setTimeout(function(){n(!0)},WAIT):a===e&&Date.now()-o>1500?n(!0):Date.now()-o>t?n(!1):setTimeout(s,POLL)}()})}function s(e){try{localStorage.setItem("kindle-highlights-pending",JSON.stringify(e))}catch(x){}if(window.opener)try{window.opener.postMessage({type:"kindle-highlights-import",data:e},APP_ORIGIN)}catch(x){}}async function a(e,d){const o=document.getElementById("kindle-scraper-overlay");if(!o)return;const j=JSON.stringify(e,null,2),l=d?" in "+(d/1e3).toFixed(1)+"s":"";const copied=await cp(j);const cs=copied?'<div style="font-size:14px;color:#4CAF50;margin-bottom:16px;">✓ Copied to clipboard!</div>':'<div style="font-size:14px;color:#ff9800;margin-bottom:8px;">⚠ Auto-copy failed - click button below</div>';o.innerHTML='<div style="text-align:center;max-width:500px;padding:20px;"><div style="font-size:64px;margin-bottom:16px;">⚡</div><div style="font-size:28px;margin-bottom:8px;font-weight:600;color:#4CAF50;">Done'+l+'!</div><div style="font-size:18px;margin-bottom:16px;opacity:0.9;">'+e.totalHighlights+" highlights from "+e.bookCount+" books</div>"+cs+'<button id="kindle-scraper-copy" style="background:#4CAF50;color:white;border:none;padding:14px 36px;font-size:16px;border-radius:8px;cursor:pointer;margin-bottom:12px;">'+(copied?"✓ Copied! (click to copy again)":"Copy to Clipboard")+'</button><div style="font-size:13px;opacity:0.6;margin-bottom:16px;">Paste into Highlight app to import</div><button id="kindle-scraper-close" style="background:transparent;color:#999;border:1px solid #444;padding:8px 24px;font-size:13px;border-radius:6px;cursor:pointer;">Close</button></div>';document.getElementById("kindle-scraper-copy").onclick=async function(){if(await cp(j)){this.innerText="✓ Copied!";this.style.background="#2E7D32"}else{this.innerText="Failed - see console";this.style.background="#f44336"}};document.getElementById("kindle-scraper-close").onclick=function(){o.remove()};window._kindleExportData=e;window._kindleExportJSON=j;console.log("=== BACKUP: copy(window._kindleExportJSON) ===")}!async function(){const l=Date.now();window._kindleScraperCancelled=!1;const r=t(),c=r.length;if(0===c)return void alert("No books found! Make sure you are on read.amazon.com/notebook and signed in.");const d=[];let i=0,u=0;for(let t=0;t<r.length;t++){if(window._kindleScraperCancelled)return void console.log("Cancelled");const x=r[t];n(t,c,x.title.slice(0,45),i);try{if(x.element.click(),!await o(x.asin,TIMEOUT)){u++;continue}const t=e();t.highlights.length>0&&(d.push(t),i+=t.highlights.length,console.log("✓",t.title,"-",t.highlights.length))}catch(e){u++}await new Promise(e=>setTimeout(e,DELAY))}const p=Date.now()-l,g={exportedAt:(new Date).toISOString(),source:"kindle-notebook-scraper",bookCount:d.length,totalHighlights:i,books:d};n(c,c,"Copying...",i);s(g);setTimeout(function(){a(g,p)},300);console.log("TURBO!",g.bookCount,"books,",i,"highlights in",(p/1e3).toFixed(1)+"s")}().catch(function(e){console.error(e);alert("Error: "+e.message);const t=document.getElementById("kindle-scraper-overlay");t&&t.remove()})})();`;
}

// Legacy export for backward compatibility
export const bookmarkletCode = generateBookmarkletCode();

// Export instructions for displaying in the UI
export const importInstructions = {
  title: 'Import from Kindle Cloud',
  steps: [
    {
      step: 1,
      title: 'Open Kindle Notebook',
      description: 'Click the button below to open your Kindle highlights',
      hasButton: true
    },
    {
      step: 2,
      title: 'Run the magic',
      description: 'Click the bookmarklet in your bookmarks bar. Highlights will auto-import!'
    }
  ],
  mobileNote: 'On mobile? Open Safari, go to read.amazon.com/notebook, then add the bookmarklet to your bookmarks manually.'
};
