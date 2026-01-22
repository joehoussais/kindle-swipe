# Highlight - Product Roadmap

*Last updated: January 2026*

> "A reader lives a thousand lives before he dies. The man who never reads lives only one." — George R.R. Martin

---

## Philosophy

Highlight is an **artistic project** as much as a product. It's about the love of reading and the belief that books let us live a thousand lives. The design should be **beautifully simple** — elegant, not cluttered.

---

## Current State

- **Chrome Extension** - Scrapes Kindle Notebook, copies JSON (pending Chrome Web Store approval)
- **Web App** - Tinder-style swipe interface, beautiful Midjourney backgrounds, deployed on Netlify
- **Mobile App** - React Native/Expo, paused for now

---

## Feature Roadmap

### Tier 1: Build Now (High Impact, Achievable Solo)

#### 1. Social Sharing to Instagram/Twitter
**Priority: HIGHEST — Start here**
- Generate beautiful shareable images from any highlight
- Include: quote text, book title, author, beautiful background
- Watermark with Highlight logo (subtle, elegant)
- One-tap share to Instagram Stories, Twitter, LinkedIn
- Optional: link back to web profile/book page
- **Why first**: Viral loop, brand building, satisfying to build, showcases the aesthetic

#### 2. Reading Stats Dashboard
**Priority: HIGH**
- Welcome screen or dedicated stats page showing:
  - Total highlights
  - Total books
  - Highlights re-read count
  - Estimated reading hours (calculate from book count/highlights)
  - Streak/activity over time
- Beautiful visualization, not just numbers
- Include quote: "Reading is the potential to have a thousand lifetimes instead of one"
- **Why**: Immediate value, makes users feel accomplished, shareable

#### 3. Highlight Journaling
**Priority: HIGH**
- Add personal reflection to any highlight
- Support voice input (speech-to-text)
- "This made me think about..." / "I was at a point in my life where..."
- Journal entries resurface with the highlight
- **Why**: Deep engagement, personal meaning, differentiator from Readwise

#### 4. Search Your Library
**Priority: HIGH**
- Full-text search across all highlights
- "What have I read about [topic]?"
- Optional: AI-powered semantic search ("find highlights about dealing with failure")
- **Why**: Utility, makes the library actually useful for life decisions

---

### Tier 2: Build Soon (Medium-term)

#### 5. "10 Books That Define Me" Profile
- User selects their 10 most formative books
- Displayed beautifully on profile
- AI generates a "reader portrait":
  - "Based on these books, here's who you probably are"
  - "Your likely strengths"
  - "Your possible blind spots"
  - "If you were an AI model and this was your training data..."
- **Future**: Match with others who share defining books

#### 6. Direct Supabase Sync (Extension)
- Remove copy/paste friction
- Extension authenticates with Supabase directly
- One-click sync, highlights appear in web app instantly
- **Technical**: Chrome identity API or popup auth flow

#### 7. Spaced Repetition / Integration Score
- Track view count, last seen date
- Visual progress bar showing "integration level"
- Smart surfacing: prioritize fading highlights
- *Note: Keep it simple, don't over-engineer the "science"*

#### 8. Challenge Mode
- Hide highlight, test recall
- User types what they remember
- AI judges accuracy
- Gamification: streaks, scores

---

### Tier 3: Future / Mobile-First

#### 9. Lock Screen Quote Widget (Mobile)
- One highlight on your phone's lock screen
- Changes daily
- **Requires**: Mobile app revival

#### 10. Screen Saver Mode (Mobile)
- Beautiful rotating highlights as ambient display
- For charging/nightstand mode

#### 11. Daily Email/Push
- "Here's a highlight from 6 months ago"
- Simple, Readwise-style resurfacing
- *Lower priority than in-app features*

#### 12. Reading Clubs / Social
- Share highlight collections with friends
- Find people who read like you
- **Far future**: Community features

---

### Tier 4: Monetization

#### Payment Model Options (TBD)
- **Freemium**: 50 highlights free, unlimited = $5/month
- **One-time**: $19 lifetime access
- **Pay-what-you-want**: Let readers decide

#### Premium Features (candidates)
- Unlimited highlights
- AI features (search, challenge mode, reader portrait)
- Social sharing with no watermark
- Export to Notion/Obsidian

---

## Design Principles

1. **Beautifully simple** — Every screen should feel calm, not busy
2. **Midjourney aesthetic** — The background images are a signature, keep them
3. **Two modes**: Immersive swipe view (full-screen beauty) + Clean library view (Twitter-wall simplicity)
4. **Reading is sacred** — The app should feel like a quiet library, not a productivity tool

---

## Technical Notes

- **Stack**: React + Vite + Tailwind (web), React Native + Expo (mobile, paused)
- **Backend**: Supabase (auth, database)
- **Hosting**: Netlify
- **AI**: TBD — likely Claude API for semantic search, challenge judging, reader portraits

---

## Open Questions

- [ ] Pricing model: subscription vs lifetime vs freemium?
- [ ] When to add auth/accounts as required? (Currently optional)
- [ ] How to handle highlights that aren't "loved" but "interesting"?
- [ ] Book cover images: scrape or manual?

---

## Build Order Recommendation

**Start tonight:**
1. **Social Sharing** — Highest impact, viral potential, fun to build

**This week:**
2. **Reading Stats Dashboard** — Quick win, visible value
3. **Search** — Makes the library useful

**Next sprint:**
4. **Highlight Journaling** — Differentiator
5. **Supabase Extension Sync** — Remove friction

---

*Can I build this solo with Claude? Absolutely. Let's go.*
