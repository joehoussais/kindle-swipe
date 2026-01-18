/**
 * Kindle Highlights Scraper Bookmarklet - AUTO-TRANSFER VERSION
 *
 * This runs entirely in the browser - NO AI, NO server, NO cost per use.
 * Just pure JavaScript reading the DOM.
 *
 * HOW IT WORKS:
 * 1. User goes to read.amazon.com/notebook and logs in
 * 2. User clicks the bookmarklet
 * 3. Script scrapes all books' highlights one by one
 * 4. AUTO-SENDS to Highlight app via postMessage (no copy-paste!)
 * 5. Falls back to clipboard if app window not found
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

  // Show progress overlay
  function showProgress(done, total, message) {
    let overlay = document.getElementById('kindle-scraper-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'kindle-scraper-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:white;font-family:system-ui,-apple-system,sans-serif;';
      document.body.appendChild(overlay);
    }
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    overlay.innerHTML =
      '<div style="text-align:center;max-width:400px;padding:20px;">' +
        '<div style="font-size:28px;margin-bottom:24px;font-weight:600;">Importing Kindle Highlights</div>' +
        '<div style="width:300px;height:8px;background:#333;border-radius:4px;overflow:hidden;margin:0 auto;">' +
          '<div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#4CAF50,#8BC34A);transition:width 0.3s;"></div>' +
        '</div>' +
        '<div style="margin-top:16px;font-size:20px;">' + done + ' / ' + total + ' books</div>' +
        '<div style="margin-top:8px;font-size:14px;opacity:0.7;">' + (message || 'Processing...') + '</div>' +
        '<button id="kindle-scraper-cancel" style="margin-top:20px;background:#666;color:white;border:none;padding:8px 20px;border-radius:4px;cursor:pointer;">Cancel</button>' +
      '</div>';

    document.getElementById('kindle-scraper-cancel').onclick = function() {
      window._kindleScraperCancelled = true;
      overlay.remove();
    };
  }

  // Wait for page content to load after clicking a book
  function waitForContent(expectedAsin, timeout) {
    return new Promise(function(resolve) {
      const start = Date.now();
      function check() {
        const currentAsin = document.querySelector('#kp-notebook-annotations-asin')?.value;
        const hasHighlights = document.querySelectorAll('#kp-notebook-annotations #highlight').length > 0;

        if (currentAsin === expectedAsin && hasHighlights) {
          // Wait a bit more for all highlights to render
          setTimeout(function() { resolve(true); }, 300);
        } else if (currentAsin === expectedAsin) {
          // ASIN changed but no highlights yet, wait more
          setTimeout(check, 100);
        } else if (Date.now() - start > timeout) {
          resolve(false);
        } else {
          setTimeout(check, 150);
        }
      }
      check();
    });
  }

  // Try to send data to the Highlight app
  function sendToApp(exportData) {
    // Try to find the opener window (if opened from app)
    if (window.opener) {
      try {
        window.opener.postMessage({
          type: 'kindle-highlights-import',
          data: exportData
        }, APP_ORIGIN);
        return true;
      } catch (e) {
        console.log('Could not send to opener:', e);
      }
    }

    // Try localStorage as a bridge
    try {
      localStorage.setItem('kindle-highlights-pending', JSON.stringify(exportData));
    } catch (e) {
      console.log('Could not save to localStorage:', e);
    }

    return false;
  }

  // Show completion screen
  function showComplete(exportData, sentToApp) {
    const overlay = document.getElementById('kindle-scraper-overlay');
    if (!overlay) return;

    const jsonStr = JSON.stringify(exportData, null, 2);

    if (sentToApp) {
      // Auto-sent to app - show success and close
      overlay.innerHTML =
        '<div style="text-align:center;max-width:500px;padding:20px;">' +
          '<div style="font-size:64px;margin-bottom:16px;">✓</div>' +
          '<div style="font-size:28px;margin-bottom:16px;font-weight:600;color:#4CAF50;">Sent to Highlight!</div>' +
          '<div style="font-size:18px;margin-bottom:24px;opacity:0.9;">' +
            exportData.totalHighlights + ' highlights from ' + exportData.bookCount + ' books' +
          '</div>' +
          '<div style="font-size:14px;opacity:0.7;margin-bottom:16px;">' +
            'You can close this tab and return to the app.' +
          '</div>' +
          '<button id="kindle-scraper-close" style="background:#4CAF50;color:white;border:none;padding:12px 32px;font-size:16px;border-radius:8px;cursor:pointer;">Close This Tab</button>' +
        '</div>';

      document.getElementById('kindle-scraper-close').onclick = function() {
        window.close();
      };

      // Auto-close after 3 seconds
      setTimeout(function() {
        window.close();
      }, 3000);
    } else {
      // Fallback: show copy button
      overlay.innerHTML =
        '<div style="text-align:center;max-width:500px;padding:20px;">' +
          '<div style="font-size:48px;margin-bottom:16px;">✓</div>' +
          '<div style="font-size:28px;margin-bottom:16px;font-weight:600;">Done!</div>' +
          '<div style="font-size:18px;margin-bottom:24px;opacity:0.9;">' +
            exportData.totalHighlights + ' highlights from ' + exportData.bookCount + ' books' +
          '</div>' +
          '<button id="kindle-scraper-copy" style="background:#4CAF50;color:white;border:none;padding:12px 32px;font-size:16px;border-radius:8px;cursor:pointer;margin-bottom:12px;">Copy to Clipboard</button>' +
          '<div style="font-size:14px;opacity:0.7;margin-bottom:16px;">' +
            'Then paste into the Highlight app' +
          '</div>' +
          '<button id="kindle-scraper-close" style="background:#333;color:white;border:none;padding:8px 24px;font-size:14px;border-radius:6px;cursor:pointer;">Close</button>' +
        '</div>';

      document.getElementById('kindle-scraper-copy').onclick = async function() {
        try {
          await navigator.clipboard.writeText(jsonStr);
          this.innerText = 'Copied!';
          this.style.background = '#2E7D32';
        } catch (e) {
          const ta = document.createElement('textarea');
          ta.value = jsonStr;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          this.innerText = 'Copied!';
          this.style.background = '#2E7D32';
        }
      };

      document.getElementById('kindle-scraper-close').onclick = function() {
        overlay.remove();
      };
    }
  }

  // Main async scraper function
  async function scrapeAll() {
    window._kindleScraperCancelled = false;

    const allBooks = getAllBooks();
    const total = allBooks.length;

    if (total === 0) {
      alert('No books found! Make sure you are on read.amazon.com/notebook and signed in.');
      return;
    }

    const scrapedBooks = [];
    let errorCount = 0;

    for (let i = 0; i < allBooks.length; i++) {
      if (window._kindleScraperCancelled) {
        console.log('Scraping cancelled by user');
        return;
      }

      const book = allBooks[i];
      showProgress(i, total, 'Loading: ' + book.title.slice(0, 40) + '...');

      try {
        // Click on the book to load its highlights
        book.element.click();

        // Wait for content to load (timeout after 15 seconds)
        const loaded = await waitForContent(book.asin, 15000);

        if (!loaded) {
          console.log('Timeout loading book:', book.asin, book.title);
          errorCount++;
          continue;
        }

        // Scrape the highlights
        const data = scrapeCurrentBook();

        if (data.highlights.length > 0) {
          scrapedBooks.push(data);
          console.log('Scraped:', data.title, '-', data.highlights.length, 'highlights');
        }
      } catch (err) {
        console.error('Error scraping book:', book.asin, err);
        errorCount++;
      }

      // Small delay between books to avoid overwhelming the page
      await new Promise(r => setTimeout(r, 200));
    }

    // Create export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      source: 'kindle-notebook-scraper',
      bookCount: scrapedBooks.length,
      totalHighlights: scrapedBooks.reduce(function(sum, b) { return sum + b.highlights.length; }, 0),
      books: scrapedBooks
    };

    showProgress(total, total, 'Sending to app...');

    // Try to auto-send to the app
    const sentToApp = sendToApp(exportData);

    // Show completion screen
    setTimeout(function() {
      showComplete(exportData, sentToApp);
    }, 500);

    console.log('Scraping complete!', exportData.bookCount, 'books,', exportData.totalHighlights, 'highlights');
    if (errorCount > 0) {
      console.log('Errors:', errorCount, 'books failed to load');
    }
  }

  // Start scraping
  scrapeAll().catch(function(err) {
    console.error('Scraper error:', err);
    alert('Error: ' + err.message);
    const overlay = document.getElementById('kindle-scraper-overlay');
    if (overlay) overlay.remove();
  });
})();
`;

/**
 * Generate bookmarklet code with the correct app origin
 * This ensures postMessage targets the right domain
 */
export function generateBookmarkletCode(appOrigin) {
  const origin = appOrigin || (typeof window !== 'undefined' ? window.location.origin : 'https://kindle-swipe.netlify.app');

  // Minified version with postMessage auto-transfer
  return `javascript:(function(){const APP_ORIGIN="${origin}";function e(){const e=[],t=document.querySelector("h3.kp-notebook-metadata")?.innerText?.trim()||"",n=document.querySelector(".kp-notebook-metadata + p, .kp-notebook-rowitem p.a-spacing-none")?.innerText?.replace(/^By:\\s*/i,"")?.trim()||"",o=document.querySelector("#kp-notebook-annotations-asin")?.value||"";return document.querySelectorAll("#kp-notebook-annotations > div").forEach(t=>{const n=t.querySelector("#highlight")?.innerText?.trim()||"";if(!n||0===n.length)return;const o=t.querySelector(".a-size-small, .a-color-secondary")?.innerText||"",s=o.indexOf("Location:");const a=s>=0?parseInt(o.slice(s+9).trim().replace(/,/g,""),10):null;let l=t.querySelector("#note")?.innerText?.trim()||"";"Note:"===l&&(l=""),e.push({text:n,location:a,note:l||null})}),{asin:o,title:t,author:n,highlights:e}}function t(){const e=[];return document.querySelectorAll("#kp-notebook-library .kp-notebook-library-each-book").forEach(t=>{const n=t.id,o=t.querySelector("h2, h3")?.innerText?.trim()||"";n&&n.match(/^B[A-Z0-9]+$/i)&&e.push({asin:n,element:t,title:o})}),e}function n(e,t,n){let o=document.getElementById("kindle-scraper-overlay");o||(o=document.createElement("div"),o.id="kindle-scraper-overlay",o.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:white;font-family:system-ui,-apple-system,sans-serif;",document.body.appendChild(o));const i=t>0?Math.round(e/t*100):0;o.innerHTML='<div style="text-align:center;max-width:400px;padding:20px;"><div style="font-size:28px;margin-bottom:24px;font-weight:600;">Importing Kindle Highlights</div><div style="width:300px;height:8px;background:#333;border-radius:4px;overflow:hidden;margin:0 auto;"><div style="width:'+i+'%;height:100%;background:linear-gradient(90deg,#4CAF50,#8BC34A);transition:width 0.3s;"></div></div><div style="margin-top:16px;font-size:20px;">'+e+" / "+t+'</div><div style="margin-top:8px;font-size:14px;opacity:0.7;">'+(n||"Processing...")+'</div><button id="kindle-scraper-cancel" style="margin-top:20px;background:#666;color:white;border:none;padding:8px 20px;border-radius:4px;cursor:pointer;">Cancel</button></div>',document.getElementById("kindle-scraper-cancel").onclick=function(){window._kindleScraperCancelled=!0,o.remove()}}function o(e,t){return new Promise(function(n){const o=Date.now();!function i(){const s=document.querySelector("#kp-notebook-annotations-asin")?.value,a=document.querySelectorAll("#kp-notebook-annotations #highlight").length>0;s===e&&a?setTimeout(function(){n(!0)},300):s===e?setTimeout(i,100):Date.now()-o>t?n(!1):setTimeout(i,150)}()})}function s(e){if(window.opener)try{return window.opener.postMessage({type:"kindle-highlights-import",data:e},APP_ORIGIN),!0}catch(e){console.log("Could not send to opener:",e)}try{localStorage.setItem("kindle-highlights-pending",JSON.stringify(e))}catch(e){}return!1}function i(e,t){const n=document.getElementById("kindle-scraper-overlay");if(!n)return;const o=JSON.stringify(e,null,2);t?(n.innerHTML='<div style="text-align:center;max-width:500px;padding:20px;"><div style="font-size:64px;margin-bottom:16px;">✓</div><div style="font-size:28px;margin-bottom:16px;font-weight:600;color:#4CAF50;">Sent to Highlight!</div><div style="font-size:18px;margin-bottom:24px;opacity:0.9;">'+e.totalHighlights+" highlights from "+e.bookCount+' books</div><div style="font-size:14px;opacity:0.7;margin-bottom:16px;">You can close this tab and return to the app.</div><button id="kindle-scraper-close" style="background:#4CAF50;color:white;border:none;padding:12px 32px;font-size:16px;border-radius:8px;cursor:pointer;">Close This Tab</button></div>',document.getElementById("kindle-scraper-close").onclick=function(){window.close()},setTimeout(function(){window.close()},3e3)):(n.innerHTML='<div style="text-align:center;max-width:500px;padding:20px;"><div style="font-size:48px;margin-bottom:16px;">✓</div><div style="font-size:28px;margin-bottom:16px;font-weight:600;">Done!</div><div style="font-size:18px;margin-bottom:24px;opacity:0.9;">'+e.totalHighlights+" highlights from "+e.bookCount+' books</div><button id="kindle-scraper-copy" style="background:#4CAF50;color:white;border:none;padding:12px 32px;font-size:16px;border-radius:8px;cursor:pointer;margin-bottom:12px;">Copy to Clipboard</button><div style="font-size:14px;opacity:0.7;margin-bottom:16px;">Then paste into the Highlight app</div><button id="kindle-scraper-close" style="background:#333;color:white;border:none;padding:8px 24px;font-size:14px;border-radius:6px;cursor:pointer;">Close</button></div>',document.getElementById("kindle-scraper-copy").onclick=async function(){try{await navigator.clipboard.writeText(o),this.innerText="Copied!",this.style.background="#2E7D32"}catch(e){const t=document.createElement("textarea");t.value=o,document.body.appendChild(t),t.select(),document.execCommand("copy"),document.body.removeChild(t),this.innerText="Copied!",this.style.background="#2E7D32"}},document.getElementById("kindle-scraper-close").onclick=function(){n.remove()})}!async function(){window._kindleScraperCancelled=!1;const a=t(),l=a.length;if(0===l)return void alert("No books found! Make sure you are on read.amazon.com/notebook and signed in.");const r=[];let c=0;for(let t=0;t<a.length;t++){if(window._kindleScraperCancelled)return void console.log("Scraping cancelled by user");const i=a[t];n(t,l,"Loading: "+i.title.slice(0,40)+"...");try{if(i.element.click(),!await o(i.asin,15e3)){console.log("Timeout loading book:",i.asin,i.title),c++;continue}const t=e();t.highlights.length>0&&(r.push(t),console.log("Scraped:",t.title,"-",t.highlights.length,"highlights"))}catch(e){console.error("Error scraping book:",i.asin,e),c++}await new Promise(e=>setTimeout(e,200))}const d={exportedAt:(new Date).toISOString(),source:"kindle-notebook-scraper",bookCount:r.length,totalHighlights:r.reduce(function(e,t){return e+t.highlights.length},0),books:r};n(l,l,"Sending to app...");const p=s(d);setTimeout(function(){i(d,p)},500),console.log("Scraping complete!",d.bookCount,"books,",d.totalHighlights,"highlights"),c>0&&console.log("Errors:",c,"books failed to load")}().catch(function(e){console.error("Scraper error:",e),alert("Error: "+e.message);const t=document.getElementById("kindle-scraper-overlay");t&&t.remove()})})();`;
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
