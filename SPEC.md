# Product Spec: Highlight Recall V1.1

## Overview

Evolving from a passive swipe-through app to an **active recall system**. Core additions: Integration Score, Challenge Mode, and smart surfacing algorithm.

---

## 1. Data Model Changes

**New fields on `highlights` table:**

| Field | Type | Description |
|-------|------|-------------|
| `integration_score` | float (0-100) | How "integrated" this highlight is in memory |
| `view_count` | int | Times viewed |
| `recall_attempts` | int | Times user attempted recall challenge |
| `recall_successes` | int | Times LLM judged recall as successful |
| `last_viewed_at` | timestamp | For decay calculation |
| `tags` | text[] | Array of tags (auto + user-generated) |

**Decay logic:** Score decays over time since `last_viewed_at`. Exact curve: -5 points per week of no interaction, floor at 0.

**Score increases:**
- View: +1
- Comment added: +3
- Recall attempted: +5
- Recall successful: +10

---

## 2. Surfacing Algorithm

When user swipes, next highlight chosen by weighted random from:

1. **Due for review** (40% weight): Low integration score + high time since last seen
2. **New/unseen** (30% weight): `view_count = 0`, prioritize recent imports
3. **Decay rescue** (20% weight): Previously high score, now decaying
4. **Random reinforcement** (10% weight): High-score highlights for confidence boost

User can still filter by source type or tag — algorithm operates within filtered set.

---

## 3. New UI Elements

### Integration Bar
- Appears on each card (bottom or side)
- Visual: thin progress bar, 0-100%
- Color gradient: red (0-30) → yellow (31-60) → green (61-100)
- Tooltip on hover/tap: "Integration Score: 73% — Last reviewed 3 days ago"

### Challenge Mode Button
- Button on card: "Challenge Me" or brain icon
- Tap → hides highlight text, shows prompt: "What was this highlight about?"
- User types response in text field
- Submit → LLM judges → shows result

### Challenge Result Screen
- Score: "You got the core idea" / "Partially there" / "Missed the key point"
- Brief explanation (1-2 sentences)
- Original highlight revealed
- Buttons: "Got it" (dismiss) / "Add note" (capture insight)

### Tags UI
- Tag pills below highlight text
- Auto-generated: book title, author, source type
- User can tap "+" to add custom tag
- Filter dropdown includes tag filtering

---

## 4. Screens & Routes

| Route | Screen | Changes |
|-------|--------|---------|
| `/` | Landing/Auth | Update copy per spec below |
| `/app` | Swipe Deck | Add integration bar, challenge button |
| `/library` | Library Panel | Add tag filtering, integration score column |
| `/settings` | Settings | Add "Review Stats" section |

---

## 5. Landing Page Copy

**Headline:**
> Highlights are capture. This is recall.

**Subhead:**
> You didn't highlight to highlight. You highlighted to remember.

**3 Bullets:**
> - **Active recall beats rereading** — Testing yourself strengthens retention more than seeing it again.
> - **Spacing makes it stick** — Resurfacing ideas over time improves long-term memory.
> - **Rewrite to own it** — Putting an idea in your own words deepens understanding.

**CTA Button:**
> Start Recalling

**Footer line (small, links to studies):**
> Built on decades of memory science. [See the research →]

---

## 6. In-App Microcopy

| Location | Copy |
|----------|------|
| Challenge prompt | "Don't peek — try to recall." |
| Challenge input placeholder | "What was this about? One sentence, your words." |
| Challenge success | "You've got it. Neural patterns reinforced." |
| Challenge partial | "Close — here's what you missed." |
| Challenge miss | "Not quite. Let's strengthen this one." |
| Integration bar tooltip | "Integration Score — how available this is in memory" |
| Low score nudge | "This one's fading. Worth a challenge?" |
| Empty state (no highlights) | "Nothing to recall yet. Import your first highlights." |

---

## 7. Research References

Link to these studies with brief descriptions:

1. **Roediger & Karpicke (2006)** — Testing effect: retrieval practice beats restudying
2. **Rowland (2014)** — Meta-analysis confirming testing effect across 61 studies
3. **Cepeda et al. (2006)** — Spacing effect: distributed practice beats massed practice
4. **Slamecka & Graf (1978)** — Generation effect: self-generated info remembered better
5. **Diekelmann & Born (2010)** — Sleep and memory consolidation

---

## 8. Prioritized Task List

### Phase 1: Core Recall System
1. Add new fields to Supabase schema (`integration_score`, `view_count`, `recall_attempts`, `recall_successes`, `last_viewed_at`, `tags`)
2. Update `useHighlights.js` to track views and compute/decay integration score
3. Build integration bar component and add to SwipeCard
4. Implement surfacing algorithm in SwipeDeck

### Phase 2: Challenge Mode
5. Build Challenge Mode UI (hide text, input field, submit)
6. Integrate LLM API for judging recall accuracy
7. Build result screen with score + explanation
8. Wire up score updates on challenge completion

### Phase 3: Tagging
9. Auto-generate tags from existing metadata (title, author, source)
10. Add tag pills UI to SwipeCard
11. Add user tag creation flow
12. Add tag filtering to filter dropdown

### Phase 4: Copy & Polish
13. Update AuthScreen with new landing copy
14. Add research references page/modal
15. Update all microcopy per spec
16. Add "Review Stats" section to SettingsPanel

---

## Open Questions (Parking Lot)

- **Sharing**: Spec'd copy says "Sharing is the final rep" — build later or placeholder?
- **Push notifications**: Not in V1.1, revisit later
- **Voice input for challenges**: Type only for now
- **Export**: Notion/Readwise integration deferred
