# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kindle Swipe is a cross-platform app (Web + iOS/Android)** for swiping through and managing reading highlights. Users import highlights from various sources and browse them in a Tinder-like card swipe interface.

### Philosophy

The app should be **ready-to-use even without a Kindle**. Users can discover the best extracts from the world's greatest books - not just short quotes, but meaningful passages that showcase an author's style and the subjects they explore. The goal is to spark curiosity and make people want to read the full book.

### Two Codebases

| Platform | Location | Tech Stack |
|----------|----------|------------|
| **Web App** | This repo (`kindle swipe/`) | React + Vite + Tailwind |
| **Mobile App** | `../kindle-swipe-mobile/` | React Native + Expo (TestFlight ready) |

Both apps share the same Supabase backend and user accounts.

## Commands

### Web App (this repo)
- `npm run dev` - Start development server (Vite)
- `npm run build` - Production build
- `npm run preview` - Preview production build

### Mobile App (`../kindle-swipe-mobile/`)
- `npx expo start` - Start Expo dev server
- `npx expo run:ios` - Run on iOS simulator
- `eas build --platform ios` - Build for TestFlight

## Architecture

React app for swiping through and managing reading highlights. Users import highlights from various sources and browse them in a Tinder-like card swipe interface.

### Core Data Flow

1. **Authentication**: `AuthContext.jsx` manages Supabase auth (Google OAuth + email/password). User state flows down via context.

2. **Highlights Management**: `useHighlights.js` hook is the core data layer:
   - Loads from Supabase if logged in, falls back to localStorage
   - Auto-syncs to both Supabase and localStorage backup
   - Handles import, navigation, filtering, and CRUD operations
   - `SOURCE_TYPES` enum defines content types: kindle, journal, voice, thought, quote, tweet

3. **Import Parsers**: `src/utils/` contains parsers for different formats:
   - `parseClippings.js` - Kindle's My Clippings.txt format
   - `parseAmazonNotebook.js` - Amazon Kindle web notebook (HTML, JSON, plain text)
   - Both generate deterministic IDs for deduplication

### Component Structure

- `App.jsx` - Main orchestrator with filter/navigation state
- `SwipeDeck.jsx` / `SwipeCard.jsx` - Swipe interface with framer-motion animations
- `DropZone.jsx` - File import UI
- `LibraryPanel.jsx` - Full library view with search/filter
- `SettingsPanel.jsx` - Settings and stats
- `BooksHistory.jsx` - Book tracking view

### Database

**Supabase** (`src/utils/supabase.js`):
- `highlights` table stores user highlights with user_id reference
- Auth via Supabase Auth with Google OAuth

**IndexedDB** (`src/utils/database.js`):
- Local fallback for users/sessions/books
- Legacy code, Supabase is primary

### Styling

Tailwind CSS with dark theme (bg-[#0a0a0a]). Background images from `src/utils/backgrounds.js`.
