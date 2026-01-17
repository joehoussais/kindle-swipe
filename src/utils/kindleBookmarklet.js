/**
 * Kindle Highlights Scraper Bookmarklet
 *
 * This runs entirely in the browser - NO AI, NO server, NO cost per use.
 * Just pure JavaScript reading the DOM.
 *
 * HOW IT WORKS:
 * 1. User goes to read.amazon.com/notebook and logs in
 * 2. User clicks the bookmarklet
 * 3. Script scrapes current book's highlights, saves to localStorage
 * 4. Script navigates to next book automatically
 * 5. Repeat until all books are done
 * 6. Exports all highlights to clipboard (JSON format)
 * 7. User pastes into the app's import
 *
 * SETUP:
 * 1. Create a new bookmark in your browser
 * 2. Name it "Get Kindle Highlights"
 * 3. Paste the minified code below as the URL
 * 4. Save the bookmark
 */

// Human-readable version of the bookmarklet code
export const bookmarkletSource = `
(function() {
  const STORAGE_KEY = 'kindleHighlightsScraper';

  // Scrape the currently displayed book's highlights
  function scrapeCurrentBook() {
    const highlights = [];
    const title = document.querySelector('h3.kp-notebook-metadata')?.innerText?.trim() || '';
    const authorEl = document.querySelector('h3.kp-notebook-metadata')?.parentElement?.querySelector('p.a-spacing-none');
    const author = authorEl?.innerText?.trim() || '';
    const asin = document.querySelector('#kp-notebook-annotations-asin')?.value || '';

    document.querySelectorAll('#kp-notebook-annotations .a-row.a-spacing-base').forEach(div => {
      const locationInput = div.querySelector('input[type="hidden"]');
      const location = locationInput?.value || null;
      const highlightSpan = div.querySelector('span[id*="highlight"]');
      const text = highlightSpan?.innerText?.trim() || '';
      const noteSpan = div.querySelector('span[id*="note"]');
      let note = noteSpan?.innerText?.trim() || '';
      if (note === 'Note:') note = '';

      if (text) {
        highlights.push({
          text,
          location: location ? parseInt(location) : null,
          note: note || null
        });
      }
    });

    return { asin, title, author, highlights };
  }

  // Get all book elements from the sidebar
  function getAllBooks() {
    const books = [];
    document.querySelectorAll('#kp-notebook-library .kp-notebook-library-each-book').forEach(book => {
      const asin = book.id;
      if (asin && asin.match(/^B[A-Z0-9]+$/)) {
        books.push({ asin, element: book });
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
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:white;font-family:system-ui,-apple-system,sans-serif;pointer-events:none;';
      document.body.appendChild(overlay);
    }
    const pct = Math.round((done / total) * 100);
    overlay.innerHTML =
      '<div style="text-align:center;max-width:400px;padding:20px;">' +
        '<div style="font-size:28px;margin-bottom:24px;font-weight:600;">Scraping Kindle Highlights</div>' +
        '<div style="width:300px;height:8px;background:#333;border-radius:4px;overflow:hidden;margin:0 auto;">' +
          '<div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#4CAF50,#8BC34A);transition:width 0.3s;"></div>' +
        '</div>' +
        '<div style="margin-top:16px;font-size:20px;">' + done + ' / ' + total + ' books</div>' +
        '<div style="margin-top:8px;font-size:14px;opacity:0.7;">' + (message || 'Processing...') + '</div>' +
      '</div>';
  }

  // Wait for ASIN to change (content loaded)
  function waitForAsin(expectedAsin, timeout) {
    return new Promise(function(resolve) {
      const start = Date.now();
      function check() {
        const currentAsin = document.querySelector('#kp-notebook-annotations-asin')?.value;
        if (currentAsin === expectedAsin) {
          resolve(true);
        } else if (Date.now() - start > timeout) {
          resolve(false);
        } else {
          setTimeout(check, 200);
        }
      }
      check();
    });
  }

  // Show completion
  function showComplete(exportData) {
    const overlay = document.getElementById('kindle-scraper-overlay');
    if (overlay) {
      overlay.style.pointerEvents = 'auto';
      overlay.innerHTML =
        '<div style="text-align:center;max-width:500px;padding:20px;">' +
          '<div style="font-size:48px;margin-bottom:16px;">✓</div>' +
          '<div style="font-size:28px;margin-bottom:16px;font-weight:600;">Done!</div>' +
          '<div style="font-size:18px;margin-bottom:24px;opacity:0.9;">' +
            exportData.totalHighlights + ' highlights from ' + exportData.bookCount + ' books' +
          '</div>' +
          '<div style="font-size:14px;opacity:0.7;margin-bottom:24px;">' +
            'Copied to clipboard! Now paste into the app import.' +
          '</div>' +
          '<button id="kindle-scraper-close" style="background:#4CAF50;color:white;border:none;padding:12px 32px;font-size:16px;border-radius:8px;cursor:pointer;">Close</button>' +
        '</div>';
      document.getElementById('kindle-scraper-close').onclick = function() {
        overlay.remove();
      };
    }
  }

  // Main async scraper
  async function scrapeAll() {
    const allBooks = getAllBooks();
    const total = allBooks.length;
    const scrapedBooks = [];

    for (let i = 0; i < allBooks.length; i++) {
      const book = allBooks[i];
      showProgress(i, total, 'Loading ' + (i + 1) + ' of ' + total + '...');

      // Click on the book to load it
      book.element.click();

      // Wait for content to load
      const loaded = await waitForAsin(book.asin, 10000);
      if (!loaded) {
        console.log('Timeout waiting for book:', book.asin);
        continue;
      }

      // Small delay to ensure highlights are rendered
      await new Promise(r => setTimeout(r, 500));

      // Scrape the book
      const data = scrapeCurrentBook();
      if (data.highlights.length > 0) {
        scrapedBooks.push(data);
      }
    }

    // Create export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      source: 'kindle-notebook-scraper',
      bookCount: scrapedBooks.length,
      totalHighlights: scrapedBooks.reduce(function(sum, b) { return sum + b.highlights.length; }, 0),
      books: scrapedBooks
    };

    showProgress(total, total, 'Finishing up...');

    // Open the app and send data via postMessage
    const appUrl = 'https://high-light.netlify.app/?import=kindle';
    const appWindow = window.open(appUrl, '_blank');

    // Wait for app to load and send data
    const sendData = () => {
      if (appWindow && !appWindow.closed) {
        appWindow.postMessage({
          type: 'kindle-highlights-import',
          data: exportData
        }, 'https://high-light.netlify.app');
      }
    };

    // Send multiple times to ensure delivery
    setTimeout(sendData, 1500);
    setTimeout(sendData, 3000);
    setTimeout(sendData, 5000);

    // Update overlay
    const overlay = document.getElementById('kindle-scraper-overlay');
    if (overlay) {
      overlay.style.pointerEvents = 'auto';
      overlay.innerHTML =
        '<div style="text-align:center;max-width:500px;padding:20px;">' +
          '<div style="font-size:48px;margin-bottom:16px;">✓</div>' +
          '<div style="font-size:28px;margin-bottom:16px;font-weight:600;">Done!</div>' +
          '<div style="font-size:18px;margin-bottom:24px;opacity:0.9;">' +
            exportData.totalHighlights + ' highlights from ' + exportData.bookCount + ' books' +
          '</div>' +
          '<div style="font-size:14px;opacity:0.7;margin-bottom:24px;">' +
            'Sending to Highlight app...' +
          '</div>' +
          '<button id="kindle-scraper-close" style="background:#4CAF50;color:white;border:none;padding:12px 32px;font-size:16px;border-radius:8px;cursor:pointer;">Close</button>' +
        '</div>';
      document.getElementById('kindle-scraper-close').onclick = function() {
        overlay.remove();
      };
    }

    // Also copy to clipboard as backup
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    } catch (err) {}
  }

  scrapeAll();
})();
`;

// Minified version for the actual bookmarklet URL
// Generated by minifying the source above
export const bookmarkletCode = `javascript:(function(){function e(){const e=[],t=document.querySelector("h3.kp-notebook-metadata")?.innerText?.trim()||"",n=document.querySelector("h3.kp-notebook-metadata")?.parentElement?.querySelector("p.a-spacing-none")?.innerText?.trim()||"",o=document.querySelector("#kp-notebook-annotations-asin")?.value||"";return document.querySelectorAll("#kp-notebook-annotations .a-row.a-spacing-base").forEach(t=>{const n=t.querySelector('input[type="hidden"]')?.value||null,o=t.querySelector('span[id*="highlight"]')?.innerText?.trim()||"";let i=t.querySelector('span[id*="note"]')?.innerText?.trim()||"";"Note:"===i&&(i=""),o&&e.push({text:o,location:n?parseInt(n):null,note:i||null})}),{asin:o,title:t,author:n,highlights:e}}function t(){const e=[];return document.querySelectorAll("#kp-notebook-library .kp-notebook-library-each-book").forEach(t=>{const n=t.id;n&&n.match(/^B[A-Z0-9]+$/)&&e.push({asin:n,element:t})}),e}function n(e,t,n){let o=document.getElementById("kindle-scraper-overlay");o||(o=document.createElement("div"),o.id="kindle-scraper-overlay",o.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:white;font-family:system-ui,-apple-system,sans-serif;pointer-events:none;",document.body.appendChild(o));const i=Math.round(e/t*100);o.innerHTML='<div style="text-align:center;max-width:400px;padding:20px;"><div style="font-size:28px;margin-bottom:24px;font-weight:600;">Scraping Kindle Highlights</div><div style="width:300px;height:8px;background:#333;border-radius:4px;overflow:hidden;margin:0 auto;"><div style="width:'+i+'%;height:100%;background:linear-gradient(90deg,#4CAF50,#8BC34A);transition:width 0.3s;"></div></div><div style="margin-top:16px;font-size:20px;">'+e+" / "+t+'</div><div style="margin-top:8px;font-size:14px;opacity:0.7;">'+(n||"Processing...")+"</div></div>"}function o(e,t){return new Promise(n=>{const o=Date.now();!function i(){document.querySelector("#kp-notebook-annotations-asin")?.value===e?n(!0):Date.now()-o>t?n(!1):setTimeout(i,200)}()})}!async function(){const i=t(),s=i.length,a=[];for(let t=0;t<i.length;t++){const r=i[t];n(t,s,"Loading "+(t+1)+" of "+s+"..."),r.element.click(),await o(r.asin,1e4)&&(await new Promise(e=>setTimeout(e,500)),(l=e()).highlights.length>0&&a.push(l))}var l;const r={exportedAt:(new Date).toISOString(),source:"kindle-notebook-scraper",bookCount:a.length,totalHighlights:a.reduce((e,t)=>e+t.highlights.length,0),books:a};n(s,s,"Finishing up...");const c="https://high-light.netlify.app/?import=kindle",d=window.open(c,"_blank"),p=()=>{d&&!d.closed&&d.postMessage({type:"kindle-highlights-import",data:r},"https://high-light.netlify.app")};setTimeout(p,1500),setTimeout(p,3e3),setTimeout(p,5e3);const u=document.getElementById("kindle-scraper-overlay");u&&(u.style.pointerEvents="auto",u.innerHTML='<div style="text-align:center;max-width:500px;padding:20px;"><div style="font-size:48px;margin-bottom:16px;">✓</div><div style="font-size:28px;margin-bottom:16px;font-weight:600;">Done!</div><div style="font-size:18px;margin-bottom:24px;opacity:0.9;">'+r.totalHighlights+" highlights from "+r.bookCount+' books</div><div style="font-size:14px;opacity:0.7;margin-bottom:24px;">Sending to Highlight app...</div><button id="kindle-scraper-close" style="background:#4CAF50;color:white;border:none;padding:12px 32px;font-size:16px;border-radius:8px;cursor:pointer;">Close</button></div>',document.getElementById("kindle-scraper-close").onclick=function(){u.remove()});try{await navigator.clipboard.writeText(JSON.stringify(r,null,2))}catch(e){}}()})();`;

// Export instructions for displaying in the UI
export const importInstructions = {
  title: 'Import from Kindle Cloud',
  steps: [
    {
      step: 1,
      title: 'Create the bookmarklet',
      description: 'Drag this button to your bookmarks bar:',
      hasBookmarklet: true
    },
    {
      step: 2,
      title: 'Go to Kindle Notebook',
      description: 'Open read.amazon.com/notebook in your browser and sign in to Amazon.',
      link: 'https://read.amazon.com/notebook'
    },
    {
      step: 3,
      title: 'Run the bookmarklet',
      description: 'Click the bookmarklet in your bookmarks bar. It will automatically cycle through all your books.'
    },
    {
      step: 4,
      title: 'Paste your highlights',
      description: 'When done, your highlights are copied to clipboard. Come back here and paste them!'
    }
  ],
  mobileNote: 'On mobile? Open Safari, go to read.amazon.com/notebook, then add the bookmarklet to your bookmarks manually.'
};
