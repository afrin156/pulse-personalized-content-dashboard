# Pulse: Personalized Content Dashboard

A responsive dashboard that merges **news**, **movie recommendations** and **social posts** into one feed you can search, favorite, reorder and theme.

Built with **Next.js 14 (App Router) · React 18 · TypeScript · Redux Toolkit · Tailwind CSS · Framer Motion**, tested with **Jest + React Testing Library** and **Playwright**.

> **No API keys needed.** Without keys the app serves realistic built-in sample data, so it runs perfectly out of the box. Add keys to use live data (see [Live APIs](#live-apis)).

---

## Quick start

Requirements: **Node.js 18.17+** (Node 20 or 22 recommended) and npm.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit + integration tests (Jest, 114 tests) |
| `npm run test:coverage` | Same, with a coverage report |
| `npm run test:e2e` | Playwright end-to-end tests (see below) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm run validate` | typecheck + lint + tests + build in one go |

For E2E tests, install the browser once: `npx playwright install chromium`, then `npm run test:e2e`.

---

## User flow

1. **Open the app.** Your feed loads news, a movie recommendation and a social post, interleaved, with skeleton loaders while waiting.
2. **Scroll.** More content loads automatically (infinite scroll). A **Load more** button is there as a keyboard-friendly fallback.
3. **Make it yours.** Click the settings icon: pick news categories, add hashtags for the social feed, set your name, switch dark mode. The feed reloads instantly.
4. **Rearrange.** Drag a card by its grip handle, or use the up/down arrows (works with keyboard and screen readers). Your order is remembered.
5. **Favorite.** Tap the heart on any card. Find everything in **Favorites**. Favoriting movies also tunes the movie recommendations (by genre).
6. **Explore Trending.** A ranked top list, filterable by News / Movies / Posts.
7. **Search.** Type in the header. Requests are debounced (350 ms), stale responses are ignored, and results are filterable by type.

Everything you set is saved to `localStorage` and restored on reload.

---

## Requirements checklist

| Requirement | Where |
| --- | --- |
| User preferences panel, persisted | `SettingsPanel.tsx`, `preferencesSlice.ts`, `lib/storage.ts`, `Providers.tsx` |
| News API (categories) | `lib/server/news.ts` → `/api/news` (NewsAPI when `NEWS_API_KEY` is set) |
| Recommendations API (TMDB) | `lib/server/movies.ts` → `/api/recommendations` (TMDB when `TMDB_API_KEY` is set) |
| Social posts (mock allowed) | `lib/server/social.ts` → `/api/social` (mock, filtered by hashtags) |
| Interactive cards with image, headline, description, CTA | `ContentCard.tsx` |
| Infinite scroll | `hooks/useInfiniteScroll.ts`, `FeedSection.tsx` |
| Responsive layout, sidebar, header with search/settings/account | `Dashboard.tsx`, `Sidebar.tsx`, `Header.tsx` |
| Feed / Trending / Favorites sections | `FeedSection`, `TrendingSection`, `FavoritesSection` |
| Search across categories + debounce | `SearchBar.tsx`, `hooks/useDebounce.ts`, `searchSlice.ts` |
| Drag and drop | Framer Motion `Reorder` in `FeedSection.tsx` (+ keyboard alternative) |
| Dark mode (CSS custom properties + Tailwind) | `globals.css`, `tailwind.config.ts`, `ThemeSync.tsx`, inline no-flash script in `layout.tsx` |
| Animations | Section transitions, drawer/dialog slide, loading spinner + shimmer skeletons, card hover, drag lift. Respects `prefers-reduced-motion`. |
| Redux Toolkit + async thunks | `src/store/*` (`createAsyncThunk`) |
| Unit / integration / E2E tests | `tests/*`, `e2e/*` |

---

## Architecture

```
src/
  app/
    api/news|recommendations|social/route.ts   thin route handlers (validate params, call server libs)
    layout.tsx, page.tsx, globals.css
  components/     UI (Dashboard, Header, Sidebar, SearchBar, SettingsPanel, ContentCard, sections…)
  hooks/          useDebounce, useInfiniteScroll
  lib/
    server/       news.ts, movies.ts, social.ts   (live API + sample-data fallback)
    client.ts     fetchSources(): calls the 3 endpoints in parallel and merges them
    mockData.ts, utils.ts, storage.ts, types.ts, constants.ts
  store/          preferences, favorites, feed, search, trending, ui slices + typed hooks
tests/            Jest unit + integration tests
e2e/              Playwright specs
```

### Key decisions

* **API keys stay on the server.** The browser only talks to our own `/api/*` routes; those call NewsAPI/TMDB with the key (NewsAPI key is sent in a header, never in a URL). Keys are never exposed to client code.
* **Always works.** If a key is missing, or a live API fails or is rate-limited, the route silently falls back to sample data. In the browser, one failing source never breaks the feed: the others still render and a small notice appears.
* **One state tree.** Redux Toolkit holds preferences, favorites, feed pages + card order, search and trending state. Async work uses `createAsyncThunk` with a `condition` guard to avoid duplicate page loads, and a request-id check so a slow, outdated search response can never overwrite a newer one. Typing also aborts the previous in-flight request.
* **Safe persistence.** localStorage is read after mount (so server and client HTML match), parse errors and a blocked/full storage are handled, saved values are validated, and nothing is written before the initial read finishes.
* **Feed lives above the sections.** Switching between Feed / Trending / Favorites never throws away already-loaded pages or scroll position.
* **Accessibility.** Skip link, landmarks, visible focus, `aria-pressed` toggles, tabs with `role="tab"`, live regions, focus-trapped settings dialog (Escape closes, focus returns), keyboard alternative for drag and drop, reduced-motion support, high-contrast colour tokens.
* **Performance.** Debounced search, paginated requests (4 items per source per page), lazy-loaded images, cached upstream fetches (5-10 minutes), memoised selectors.

---

## Live APIs

```bash
cp .env.example .env.local
# then fill in:
NEWS_API_KEY=...     # https://newsapi.org
TMDB_API_KEY=...     # https://www.themoviedb.org/settings/api (v3 API key)
```

Restart the dev server after changing `.env.local`. Responses include `"source": "live"` or `"source": "mock"` so you can see which one you are getting (open `/api/news` in the browser).

Notes: NewsAPI's free Developer plan is meant for development (results are limited to 100 per query and delayed), which is why this app calls it server-side and caps paging at 5 pages. The social feed is a **mock source by design** (the assignment allows this); `lib/server/social.ts` returns the same shape as the other sources so a real provider can replace it.

---

## Testing

* **Unit tests:** utilities, every Redux slice and thunk (success, error, duplicates, stale responses, reset), debounce hook, storage, API client, server data sources (live mapping, fallback, pagination, bad params) and route handlers.
* **Integration tests:** the whole `Dashboard` with the network layer mocked: loading, content rendering, empty states, errors with retry, partial failures, infinite scroll, Load more, reorder + remembered order, favorites flow, trending tabs, debounced search (results, empty, error, clear), settings changes refetching, theme toggle, mobile drawer, localStorage restore/save.
* **E2E (Playwright):** feed, search, favorites persistence, dark mode persistence, settings, button reorder + persistence, drag and drop, load more, trending. They run against the production build with sample data.

---

## Not included

The optional bonus features (authentication, WebSocket/SSE real-time feed, i18n) were left out to keep the core solid. The account area in the header is a local profile name (editable in Settings), not real authentication.
