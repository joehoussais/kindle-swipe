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

  // HYPERSPEED SETTINGS - 2026 AGI mode
  const POLL_INTERVAL = 30;       // How often to check for content (ms) - FASTER
  const RENDER_WAIT = 100;        // Wait for highlights to render (ms) - FASTER
  const BOOK_DELAY = 50;          // Delay between books (ms) - FASTER
  const TIMEOUT_PER_BOOK = 6000;  // Max wait per book (ms) - FASTER

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
  // KEY FIX: Must wait for ASIN to CHANGE from previous, not just match expected
  function waitForContent(expectedAsin, previousAsin, timeout) {
    return new Promise(function(resolve) {
      const start = Date.now();
      function check() {
        const currentAsin = document.querySelector('#kp-notebook-annotations-asin')?.value;
        const highlightCount = document.querySelectorAll('#kp-notebook-annotations #highlight').length;

        // Must match expected AND be different from previous (means page actually changed)
        if (currentAsin === expectedAsin && currentAsin !== previousAsin && highlightCount > 0) {
          // Quick render wait
          setTimeout(function() { resolve(true); }, RENDER_WAIT);
        } else if (currentAsin === expectedAsin && currentAsin !== previousAsin && Date.now() - start > 1500) {
          // ASIN matches and changed but no highlights after 1.5s - book probably has none
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

  // Show completion screen - BULLETPROOF with visible data
  async function showComplete(exportData, duration) {
    const overlay = document.getElementById('kindle-scraper-overlay');
    if (!overlay) return;

    const jsonStr = JSON.stringify(exportData, null, 2);
    const speed = duration ? (duration / 1000).toFixed(1) + 's' : '';

    // Try to auto-copy to clipboard FIRST
    const copied = await copyToClipboard(jsonStr);

    // Store in window immediately for recovery
    window._kindleExportData = exportData;
    window._kindleExportJSON = jsonStr;

    // BULLETPROOF UI - data is ALWAYS visible and copyable
    overlay.innerHTML =
      '<div style="text-align:center;width:100%;max-width:600px;padding:20px;max-height:90vh;overflow-y:auto;">' +
        '<div style="font-size:48px;margin-bottom:12px;">⚡</div>' +
        '<div style="font-size:32px;margin-bottom:4px;font-weight:700;color:#4CAF50;">Done!</div>' +
        '<div style="font-size:14px;opacity:0.6;margin-bottom:16px;">' + speed + '</div>' +
        '<div style="font-size:20px;margin-bottom:20px;font-weight:500;">' +
          exportData.totalHighlights + ' highlights from ' + exportData.bookCount + ' books' +
        '</div>' +
        (copied
          ? '<div style="background:#4CAF50;color:white;padding:12px 24px;border-radius:8px;font-size:16px;font-weight:600;margin-bottom:16px;display:inline-block;">✓ COPIED TO CLIPBOARD</div>'
          : '<div style="background:#ff9800;color:white;padding:12px 24px;border-radius:8px;font-size:16px;font-weight:600;margin-bottom:16px;display:inline-block;">⚠ Auto-copy failed - copy manually below</div>'
        ) +
        '<div style="margin-bottom:8px;">' +
          '<button id="kindle-scraper-copy" style="background:#2196F3;color:white;border:none;padding:14px 40px;font-size:16px;border-radius:8px;cursor:pointer;font-weight:600;">' +
            (copied ? 'Copy Again' : 'Copy to Clipboard') +
          '</button>' +
        '</div>' +
        '<div style="font-size:12px;opacity:0.5;margin-bottom:20px;">Paste into Highlight app → Magic Import → Paste area</div>' +
        '<div style="text-align:left;margin-bottom:16px;">' +
          '<div style="font-size:11px;opacity:0.5;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Your data (select all + copy if needed):</div>' +
          '<textarea id="kindle-scraper-data" readonly style="width:100%;height:150px;background:#111;border:1px solid #333;border-radius:8px;padding:12px;font-family:monospace;font-size:11px;color:#8f8;resize:vertical;"></textarea>' +
        '</div>' +
        '<button id="kindle-scraper-close" style="background:#333;color:white;border:none;padding:12px 32px;font-size:14px;border-radius:8px;cursor:pointer;">Close</button>' +
      '</div>';

    // Set textarea value (can't use innerHTML for textarea content)
    document.getElementById('kindle-scraper-data').value = jsonStr;

    document.getElementById('kindle-scraper-copy').onclick = async function() {
      const success = await copyToClipboard(jsonStr);
      if (success) {
        this.innerText = '✓ Copied!';
        this.style.background = '#2E7D32';
        setTimeout(() => {
          this.innerText = 'Copy Again';
          this.style.background = '#2196F3';
        }, 2000);
      } else {
        this.innerText = 'Failed - select textarea above and Cmd+C';
        this.style.background = '#f44336';
      }
    };

    // Select all in textarea on click
    document.getElementById('kindle-scraper-data').onclick = function() {
      this.select();
    };

    document.getElementById('kindle-scraper-close').onclick = function() {
      overlay.remove();
    };

    console.log('=== EXPORT COMPLETE ===');
    console.log('Highlights:', exportData.totalHighlights, 'from', exportData.bookCount, 'books');
    console.log('Backup: copy(window._kindleExportJSON)');
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
    let previousAsin = ''; // Track previous ASIN to detect actual page changes

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

        // Wait for content to load (TURBO timeout) - pass previousAsin to detect actual change
        const loaded = await waitForContent(book.asin, previousAsin, TIMEOUT_PER_BOOK);

        if (!loaded) {
          console.log('Timeout:', book.title);
          errorCount++;
          continue;
        }

        // Update previousAsin after successful load
        previousAsin = book.asin;

        // Scrape the highlights
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
 * Generate HYPERSPEED bookmarklet code
 * BULLETPROOF: Shows data in textarea, auto-copies, never closes, impossible to lose data
 */
export function generateBookmarkletCode(appOrigin) {
  const origin = appOrigin || (typeof window !== 'undefined' ? window.location.origin : 'https://kindle-swipe.netlify.app');

  // HYPERSPEED + BULLETPROOF minified version
  // KEY FIX: Wait for ASIN to CHANGE before checking, not just match
  return `javascript:(function(){const APP="${origin}",POLL=30,WAIT=100,DELAY=50,TIMEOUT=6e3;async function cp(s){try{await navigator.clipboard.writeText(s);return!0}catch(e){try{const t=document.createElement("textarea");t.value=s;t.style.cssText="position:fixed;top:0;left:0;opacity:0;";document.body.appendChild(t);t.focus();t.select();const r=document.execCommand("copy");document.body.removeChild(t);return r}catch(e2){return!1}}}function scrape(){const h=[],ti=document.querySelector("h3.kp-notebook-metadata")?.innerText?.trim()||"",au=document.querySelector(".kp-notebook-metadata + p, .kp-notebook-rowitem p.a-spacing-none")?.innerText?.replace(/^By:\\s*/i,"")?.trim()||"",asin=document.querySelector("#kp-notebook-annotations-asin")?.value||"";document.querySelectorAll("#kp-notebook-annotations > div").forEach(r=>{const tx=r.querySelector("#highlight")?.innerText?.trim()||"";if(!tx)return;const lb=r.querySelector(".a-size-small, .a-color-secondary")?.innerText||"",li=lb.indexOf("Location:");const loc=li>=0?parseInt(lb.slice(li+9).trim().replace(/,/g,""),10):null;let nt=r.querySelector("#note")?.innerText?.trim()||"";"Note:"===nt&&(nt="");h.push({text:tx,location:loc,note:nt||null})});return{asin,title:ti,author:au,highlights:h}}function getBooks(){const b=[];document.querySelectorAll("#kp-notebook-library .kp-notebook-library-each-book").forEach(el=>{const id=el.id,ti=el.querySelector("h2, h3")?.innerText?.trim()||"";id&&id.match(/^B[A-Z0-9]+$/i)&&b.push({asin:id,element:el,title:ti})});return b}function prog(done,total,msg,cnt){let ov=document.getElementById("ks-ov");ov||(ov=document.createElement("div"),ov.id="ks-ov",ov.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;color:white;font-family:system-ui,-apple-system,sans-serif;",document.body.appendChild(ov));const pct=total>0?Math.round(done/total*100):0;ov.innerHTML='<div style="text-align:center;padding:20px;"><div style="font-size:11px;letter-spacing:2px;opacity:0.5;margin-bottom:8px;">HYPERSPEED</div><div style="font-size:28px;margin-bottom:20px;font-weight:600;">Importing</div><div style="width:320px;height:6px;background:#222;border-radius:3px;overflow:hidden;margin:0 auto;"><div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,#4CAF50,#8BC34A);transition:width 0.1s;"></div></div><div style="margin-top:16px;font-size:24px;">'+done+"/"+total+'</div>'+(cnt?'<div style="margin-top:8px;color:#4CAF50;">'+cnt+' highlights</div>':'')+'<div style="margin-top:8px;font-size:12px;opacity:0.5;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+(msg||'')+'</div><button id="ks-cancel" style="margin-top:16px;background:transparent;color:#666;border:1px solid #444;padding:6px 16px;border-radius:4px;cursor:pointer;font-size:11px;">Cancel</button></div>';document.getElementById("ks-cancel").onclick=()=>{window._ksCancelled=!0;ov.remove()}}function wait(asin,prevAsin,timeout){return new Promise(res=>{const st=Date.now();(function chk(){const cur=document.querySelector("#kp-notebook-annotations-asin")?.value,cnt=document.querySelectorAll("#kp-notebook-annotations #highlight").length;if(cur===asin&&cur!==prevAsin&&cnt>0){setTimeout(()=>res(!0),WAIT)}else if(cur===asin&&cur!==prevAsin&&Date.now()-st>1200){res(!0)}else if(Date.now()-st>timeout){res(!1)}else{setTimeout(chk,POLL)}})()})}function send(d){try{localStorage.setItem("kindle-highlights-pending",JSON.stringify(d))}catch(e){}if(window.opener)try{window.opener.postMessage({type:"kindle-highlights-import",data:d},APP)}catch(e){}}async function done(d,dur){const ov=document.getElementById("ks-ov");if(!ov)return;const j=JSON.stringify(d,null,2);window._kindleExportData=d;window._kindleExportJSON=j;const copied=await cp(j);const spd=dur?(dur/1e3).toFixed(1)+"s":"";ov.innerHTML='<div style="text-align:center;width:100%;max-width:580px;padding:20px;max-height:90vh;overflow-y:auto;"><div style="font-size:48px;margin-bottom:8px;">⚡</div><div style="font-size:32px;font-weight:700;color:#4CAF50;">Done!</div><div style="font-size:13px;opacity:0.5;margin-bottom:12px;">'+spd+'</div><div style="font-size:20px;margin-bottom:16px;">'+d.totalHighlights+' highlights from '+d.bookCount+' books</div>'+(copied?'<div style="background:#4CAF50;color:white;padding:10px 20px;border-radius:8px;font-weight:600;margin-bottom:12px;display:inline-block;">✓ COPIED TO CLIPBOARD</div>':'<div style="background:#ff9800;color:white;padding:10px 20px;border-radius:8px;font-weight:600;margin-bottom:12px;display:inline-block;">⚠ Copy manually below</div>')+'<div style="margin-bottom:6px;"><button id="ks-copy" style="background:#2196F3;color:white;border:none;padding:12px 32px;font-size:15px;border-radius:8px;cursor:pointer;font-weight:600;">'+(copied?"Copy Again":"Copy")+'</button></div><div style="font-size:11px;opacity:0.4;margin-bottom:16px;">Paste in Highlight app → Magic Import</div><div style="text-align:left;"><div style="font-size:10px;opacity:0.4;margin-bottom:4px;text-transform:uppercase;">Your data:</div><textarea id="ks-data" readonly style="width:100%;height:120px;background:#111;border:1px solid #333;border-radius:6px;padding:10px;font-family:monospace;font-size:10px;color:#8f8;resize:vertical;"></textarea></div><button id="ks-close" style="margin-top:12px;background:#333;color:white;border:none;padding:10px 24px;font-size:13px;border-radius:6px;cursor:pointer;">Close</button></div>';document.getElementById("ks-data").value=j;document.getElementById("ks-copy").onclick=async function(){if(await cp(j)){this.innerText="✓ Copied!";this.style.background="#2E7D32";setTimeout(()=>{this.innerText="Copy Again";this.style.background="#2196F3"},1500)}else{this.innerText="Select textarea + Cmd+C";this.style.background="#f44336"}};document.getElementById("ks-data").onclick=function(){this.select()};document.getElementById("ks-close").onclick=()=>ov.remove();console.log("=== DONE:",d.totalHighlights,"highlights from",d.bookCount,"books ===")}!async function(){const st=Date.now();window._ksCancelled=!1;const books=getBooks(),total=books.length;if(!total)return alert("No books found! Make sure you're on read.amazon.com/notebook and signed in.");const scraped=[];let cnt=0,prevAsin="";for(let i=0;i<books.length;i++){if(window._ksCancelled)return;const b=books[i];prog(i,total,b.title.slice(0,40),cnt);try{b.element.click();if(!await wait(b.asin,prevAsin,TIMEOUT)){console.log("timeout:",b.title);continue}prevAsin=b.asin;const d=scrape();if(d.highlights.length>0){scraped.push(d);cnt+=d.highlights.length;console.log("✓",d.title,"-",d.highlights.length)}else{console.log("○",d.title,"- no highlights")}}catch(e){console.error(e)}await new Promise(r=>setTimeout(r,DELAY))}const dur=Date.now()-st;const out={exportedAt:new Date().toISOString(),source:"kindle-notebook-scraper",bookCount:scraped.length,totalHighlights:cnt,books:scraped};prog(total,total,"Finishing...",cnt);send(out);setTimeout(()=>done(out,dur),200);console.log("HYPERSPEED!",out.bookCount,"books,",cnt,"highlights in",(dur/1e3).toFixed(1)+"s")}().catch(e=>{console.error(e);alert("Error: "+e.message);document.getElementById("ks-ov")?.remove()})})();`;
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
