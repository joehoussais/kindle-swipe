# Claude Code Prompt: Fix & Improve Quote Sharing

Copy and paste this into Claude Code:

---

## Context

There's an existing `QuoteExport.jsx` component for sharing individual highlights as images. It has issues:
- Sizing/scaling problems (images come out wrong)
- Templates exist (Parchment, Marble, Ink) but need polish
- Need to add Midjourney background option
- Book cover should be included

Read these files first:
- `CLAUDE.md` and `ROADMAP.md` for project context
- `src/components/QuoteExport.jsx` - the existing component to fix
- `src/components/ShareModal.jsx` - reference for patterns used elsewhere

## What's Broken

1. **Sizing issues** - The exported image doesn't match the preview, or comes out too small/large
2. **html2canvas scaling** - The `scale: 2` and preview scaling math might be off

## What to Fix & Improve

### 1. Fix the Export Sizing
- Make sure the exported PNG is exactly 1080x1920 (story), 1080x1080 (square), or 1920x1080 (landscape)
- The preview should be a scaled-down version that matches exactly what gets exported
- Test the actual download to confirm dimensions are correct

### 2. Add Midjourney Backgrounds Option
- There are beautiful Midjourney images in the project root (the .png files like `joeyseph1219_*.png`)
- Add these as background options in addition to the solid color templates
- User should be able to pick from:
  - Parchment (existing)
  - Marble (existing)
  - Ink (existing)
  - **NEW: Image backgrounds** - use the Midjourney images with a dark overlay so text is readable

### 3. Always Show Book Cover + Author
- Book cover should be displayed (you have `getBookCover` utility)
- Show: Quote text, Book title, Author name, Book cover thumbnail
- Make the cover toggle ON by default

### 4. Typography Options
- Keep it simple: just 2-3 font style options
- Current uses Playfair Display / Cormorant Garamond - these are good
- Maybe add one sans-serif option for modern look

### 5. Make the Share Flow Smooth
- Instagram Stories format (9:16) should be default
- "Share" button should use Web Share API on mobile
- "Copy" should work reliably
- "Download" should work reliably

## Layout for Image Backgrounds

When using a Midjourney image as background:

```
┌─────────────────────────────────┐
│                                 │
│   [Midjourney image fills bg]   │
│   [Dark gradient overlay]       │
│                                 │
│   ┌─────┐                       │
│   │cover│  "The quote text      │
│   │ img │   goes here nicely    │
│   └─────┘   formatted"          │
│                                 │
│            — Book Title         │
│              Author Name        │
│                                 │
│                    ⚡ Highlight  │
└─────────────────────────────────┘
```

## Files to Modify

1. `src/components/QuoteExport.jsx` - Main fixes here
2. Maybe create `src/utils/backgrounds.js` if it doesn't exist, to list available background images

## Technical Notes

- The Midjourney images are in the project root, not in src
- They have names like `joeyseph1219_Colosseum_in_rain_night_*.png`
- For html2canvas to work with background images, you may need to inline them or handle CORS
- Test on both desktop and mobile

## Acceptance Criteria

- [ ] Exported images are correct dimensions (1080x1920 for story)
- [ ] Preview matches what gets exported
- [ ] Can select Midjourney image as background
- [ ] Book cover displays correctly
- [ ] Author name displays correctly
- [ ] Share/Copy/Download all work
- [ ] Looks beautiful and professional

---

Start by reading the existing code, identify what's causing the sizing issues, then fix and enhance.
