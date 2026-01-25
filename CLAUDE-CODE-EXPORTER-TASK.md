# Task: Make QuoteExport Gorgeous

## Context
You're working on **Highlight** — a Tinder-style app for reading highlights. The killer feature should be exporting beautiful, shareable images of quotes to Instagram/Twitter.

The current `QuoteExport.jsx` component works but isn't gorgeous. It needs to be **so beautiful that people want to share it**.

## Current State
- Location: `src/components/QuoteExport.jsx`
- Uses `html2canvas` to render a React component to PNG
- Has one template style ("KindleTemplate") with white card on Midjourney background
- Supports 3 formats: Story (9:16), Square (1:1), Landscape (16:9)
- 28 Midjourney backgrounds available in `/public/backgrounds/`
- Book covers fetched from Open Library API

## Known Issues
1. **Sizing feels cramped** — The preview is small, text can feel squished on long quotes
2. **Only one template style** — No variety, everyone's exports look the same
3. **Typography is basic** — System fonts, no visual hierarchy beyond first-sentence underline
4. **The white card aesthetic is safe but not stunning** — Compare to Readwise's share images or high-end design studios

## The Goal
Make exports so gorgeous that:
- Joseph (the founder) actually wants to post his own highlights on Instagram
- The aesthetic becomes a signature — people recognize "that's a Highlight quote"
- It works for both short punchy quotes AND long dense passages

## Design Direction

### Template Styles to Build
Create **3-4 distinct templates** the user can choose from:

1. **Minimal** — No card. Quote floats directly on the background with elegant text shadow. Book info small at bottom. Think: cinematic movie poster quote.

2. **Card** (current, refined) — White/cream semi-transparent card. But make it more elegant: better padding ratios, subtle border-radius, maybe a thin border or shadow that feels premium.

3. **Dark Glass** — Frosted dark glass card (backdrop-blur aesthetic). White text. Feels modern/premium. Good for dark moody backgrounds.

4. **Editorial** — Large serif quote, author attribution styled like a magazine. Minimal background usage — let typography be the hero.

### Typography Upgrades
- Use Google Fonts: Consider `Playfair Display` for serif, `Inter` or `DM Sans` for sans-serif
- Load fonts via `@import` or `<link>` in the component (html2canvas should handle this)
- Quote text should have proper typographic hierarchy:
  - Opening quotation mark can be large/decorative
  - Author/book info should be clearly secondary
- Line height and letter spacing matter — don't just use defaults

### Technical Requirements
- **Export at full resolution** — The `html2canvas` call should output crisp 1080x1920 (Story), 1080x1080 (Square), 1920x1080 (Landscape)
- **Fonts must render in export** — Test that Google Fonts actually appear in the PNG (html2canvas can be finicky)
- **Keep the template selector simple** — Don't overwhelm the UI. Horizontal pills or small thumbnails.
- **Background selector already works** — Don't break it

### UX Polish
- The modal shouldn't feel cramped — give the preview room to breathe
- Loading state should feel smooth (maybe skeleton or fade)
- Success state should feel satisfying (subtle animation, checkmark)

## Files to Modify
- `src/components/QuoteExport.jsx` — Main component
- You may need to add font imports to `index.html` or create a CSS file

## Files to Reference (don't modify)
- `src/utils/backgrounds.js` — Background image list with theme/mood metadata
- `src/utils/bookCovers.js` — Cover fetching logic

## How to Test
1. Run `npm run dev` in the kindle-swipe folder
2. You need some highlights loaded — there should be sample data or you can add mock data
3. Click the share/export button on any highlight card
4. The QuoteExport modal should open
5. Test all formats, all templates, multiple background choices
6. Download/copy and verify the image looks correct at full resolution

## Success Criteria
- [ ] 3-4 template styles that look genuinely different
- [ ] Typography that makes you go "damn, that looks good"
- [ ] Exports render at correct resolution with fonts intact
- [ ] The UI for selecting templates is clean and intuitive
- [ ] Works well with both short quotes (1 sentence) and long quotes (3+ paragraphs)
- [ ] The "Highlight" watermark is subtle but present

## Inspiration
- Readwise share images
- Book quote accounts on Instagram (@bookquotesclub, @literaryquotes)
- High-end editorial design (Kinfolk magazine, Monocle)
- Apple's marketing typography

## Notes
- The backgrounds are Midjourney-generated and are a signature of the app — use them well
- The founder has high taste and will notice if something feels "off"
- This is the viral loop — if exports are gorgeous, people share them, others discover Highlight
- Don't over-engineer. Ship something beautiful, iterate later.

---

**Start by reading the current QuoteExport.jsx, then propose your template designs before implementing.**
