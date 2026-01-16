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

  // Get all book ASINs from the sidebar
  function getAllBookASINs() {
    const asins = [];
    document.querySelectorAll('#kp-notebook-library .kp-notebook-library-each-book').forEach(book => {
      const asin = book.id;
      if (asin && asin.match(/^B[A-Z0-9]+$/)) {
        asins.push(asin);
      }
    });
    return asins;
  }

  // Show progress overlay
  function showProgress(done, total, message) {
    let overlay = document.getElementById('kindle-scraper-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'kindle-scraper-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:white;font-family:system-ui,-apple-system,sans-serif;';
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

  // Main logic
  let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  const allASINs = getAllBookASINs();

  // Initialize state if this is a fresh start
  if (!state || !state.pendingASINs) {
    state = { books: [], pendingASINs: allASINs, total: allASINs.length };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // Scrape current book
  const current = scrapeCurrentBook();
  if (current.asin && current.highlights.length > 0 && !state.books.find(b => b.asin === current.asin)) {
    state.books.push(current);
    state.pendingASINs = state.pendingASINs.filter(a => a !== current.asin);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // Show progress
  showProgress(state.books.length, state.total, state.pendingASINs.length > 0 ? 'Loading next book...' : 'Finishing up...');

  // Continue or finish
  if (state.pendingASINs.length > 0) {
    // Navigate to next book after short delay
    setTimeout(function() {
      window.location.href = '/notebook?asin=' + state.pendingASINs[0];
    }, 800);
  } else {
    // Done! Create export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      source: 'kindle-notebook-scraper',
      bookCount: state.books.length,
      totalHighlights: state.books.reduce(function(sum, b) { return sum + b.highlights.length; }, 0),
      books: state.books
    };

    // Clear scraper state
    localStorage.removeItem(STORAGE_KEY);

    // Update overlay with success message
    const overlay = document.getElementById('kindle-scraper-overlay');
    if (overlay) {
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

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
      .then(function() { console.log('Highlights copied to clipboard!'); })
      .catch(function(err) {
        // Fallback: show in a textarea
        const ta = document.createElement('textarea');
        ta.value = JSON.stringify(exportData, null, 2);
        ta.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:80%;height:60%;z-index:100000;font-family:monospace;font-size:12px;';
        document.body.appendChild(ta);
        ta.select();
        alert('Could not copy automatically. Please copy the text from the textarea, then paste it into the app.');
      });
  }
})();
`;

// Minified version for the actual bookmarklet URL
// Generated by minifying the source above
export const bookmarkletCode = `javascript:(function(){const e="kindleHighlightsScraper";function t(){const e=[];const t=document.querySelector("h3.kp-notebook-metadata")?.innerText?.trim()||"";const n=document.querySelector("h3.kp-notebook-metadata")?.parentElement?.querySelector("p.a-spacing-none");const o=n?.innerText?.trim()||"";const i=document.querySelector("#kp-notebook-annotations-asin")?.value||"";document.querySelectorAll("#kp-notebook-annotations .a-row.a-spacing-base").forEach(t=>{const n=t.querySelector('input[type="hidden"]');const o=n?.value||null;const i=t.querySelector('span[id*="highlight"]');const s=i?.innerText?.trim()||"";const a=t.querySelector('span[id*="note"]');let r=a?.innerText?.trim()||"";if(r==="Note:")r="";if(s){e.push({text:s,location:o?parseInt(o):null,note:r||null})}});return{asin:i,title:t,author:o,highlights:e}}function n(){const e=[];document.querySelectorAll("#kp-notebook-library .kp-notebook-library-each-book").forEach(t=>{const n=t.id;if(n&&n.match(/^B[A-Z0-9]+$/)){e.push(n)}});return e}function o(e,t,n){let o=document.getElementById("kindle-scraper-overlay");if(!o){o=document.createElement("div");o.id="kindle-scraper-overlay";o.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:white;font-family:system-ui,-apple-system,sans-serif;";document.body.appendChild(o)}const i=Math.round(e/t*100);o.innerHTML='<div style="text-align:center;max-width:400px;padding:20px;"><div style="font-size:28px;margin-bottom:24px;font-weight:600;">Scraping Kindle Highlights</div><div style="width:300px;height:8px;background:#333;border-radius:4px;overflow:hidden;margin:0 auto;"><div style="width:'+i+'%;height:100%;background:linear-gradient(90deg,#4CAF50,#8BC34A);transition:width 0.3s;"></div></div><div style="margin-top:16px;font-size:20px;">'+e+" / "+t+'</div><div style="margin-top:8px;font-size:14px;opacity:0.7;">'+(n||"Processing...")+"</div></div>"}let i=JSON.parse(localStorage.getItem(e)||"null");const s=n();if(!i||!i.pendingASINs){i={books:[],pendingASINs:s,total:s.length};localStorage.setItem(e,JSON.stringify(i))}const a=t();if(a.asin&&a.highlights.length>0&&!i.books.find(e=>e.asin===a.asin)){i.books.push(a);i.pendingASINs=i.pendingASINs.filter(e=>e!==a.asin);localStorage.setItem(e,JSON.stringify(i))}o(i.books.length,i.total,i.pendingASINs.length>0?"Loading next book...":"Finishing up...");if(i.pendingASINs.length>0){setTimeout(function(){window.location.href="/notebook?asin="+i.pendingASINs[0]},800)}else{const t={exportedAt:new Date().toISOString(),source:"kindle-notebook-scraper",bookCount:i.books.length,totalHighlights:i.books.reduce(function(e,t){return e+t.highlights.length},0),books:i.books};localStorage.removeItem(e);const n=document.getElementById("kindle-scraper-overlay");if(n){n.innerHTML='<div style="text-align:center;max-width:500px;padding:20px;"><div style="font-size:48px;margin-bottom:16px;">✓</div><div style="font-size:28px;margin-bottom:16px;font-weight:600;">Done!</div><div style="font-size:18px;margin-bottom:24px;opacity:0.9;">'+t.totalHighlights+" highlights from "+t.bookCount+' books</div><div style="font-size:14px;opacity:0.7;margin-bottom:24px;">Copied to clipboard! Now paste into the app import.</div><button id="kindle-scraper-close" style="background:#4CAF50;color:white;border:none;padding:12px 32px;font-size:16px;border-radius:8px;cursor:pointer;">Close</button></div>';document.getElementById("kindle-scraper-close").onclick=function(){n.remove()}}navigator.clipboard.writeText(JSON.stringify(t,null,2)).then(function(){console.log("Highlights copied to clipboard!")}).catch(function(e){const n=document.createElement("textarea");n.value=JSON.stringify(t,null,2);n.style.cssText="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:80%;height:60%;z-index:100000;font-family:monospace;font-size:12px;";document.body.appendChild(n);n.select();alert("Could not copy automatically. Please copy the text from the textarea, then paste it into the app.")})}})();`;

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
