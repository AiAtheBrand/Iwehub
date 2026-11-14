# Gutenberg Books

A React single-page app that browses public-domain books from the
[Project Gutenberg Free Books API](https://rapidapi.com/) and lets users add
their own books to a **shared library** backed by Supabase (Postgres).

The browser never talks to RapidAPI directly: a small Express server holds the
API key and proxies those requests. Supabase is accessed directly from the
browser using its **public anon key**, which is safe to expose because Row Level
Security (RLS) enforces access on the server.

## Tech stack

- **React 19** + **Vite 8**
- **react-router-dom 7** (routing)
- **Tailwind CSS 4** (styling)
- **Express 5** (RapidAPI proxy / static server)
- **Supabase** (Postgres database + storage + auto REST API)
- **Vitest** + **Testing Library** + **jsdom** (tests)

## Architecture

```
                    ┌───────────────┐
   catalog ────────▶│ Express proxy │──────▶ RapidAPI (Project Gutenberg)
                    └───────────────┘
Browser ──▶ React
   │                ┌───────────────┐
   └── shared ─────▶│   Supabase    │  (Postgres table `books` + storage `covers`)
      library       └───────────────┘
```

- The **Gutenberg catalogue** is read-only and fetched through the Express proxy.
- The **shared library** (books users add) lives in Supabase and is visible to
  everyone. Cover images are uploaded to Supabase Storage.
- Deleting a **library** book removes it for everyone; deleting a **catalogue**
  book only hides it locally (stored in `localStorage`).

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your env file:

   ```bash
   cp .env.example .env
   ```

3. **Supabase setup** (one time):

   1. Create a project at [supabase.com](https://supabase.com).
   2. Open **SQL Editor → New query**, paste the contents of
      [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the
      `books` table, the `covers` storage bucket, and the access policies.
   3. Open **Project Settings → API** and copy the **Project URL** and the
      **anon public** key into `.env`:

      ```
      VITE_SUPABASE_URL=https://your-project-ref.supabase.co
      VITE_SUPABASE_ANON_KEY=your-anon-key
      ```

4. Fill in your RapidAPI credentials in `.env` (see `.env.example`).

5. Run the API server **and** the Vite dev server together:

   ```bash
   npm run dev:all
   ```

   Open the URL Vite prints (usually http://localhost:5173).

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev:all` | Run the API server and Vite dev server together |
| `npm run server` | Run only the API proxy server |
| `npm run dev` | Run only the Vite dev server |
| `npm run build` | Production build into `dist/` |
| `npm start` | Serve `dist/` + `/api` from Express (production) |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once (CI) |
| `npm run coverage` | Run tests with coverage |

## Project structure

```
server/index.js          # Express proxy + static server
supabase/schema.sql      # Database schema, policies, storage bucket
src/
├── lib/supabase.js      # Supabase client (guarded by env vars)
├── api/
│   ├── books.js         # Gutenberg catalogue client (via /api proxy)
│   └── library.js       # Supabase library client (list/add/delete)
├── hooks/
│   ├── useBooks.js      # Loads the catalogue
│   ├── useLibraryBooks.js # Loads + mutates the shared library
│   └── useLocalStorage.js # Persists local state (catalogue deletions)
├── components/
│   ├── BookCard.jsx
│   ├── BookDetails.jsx
│   └── AddBookForm.jsx
├── router/router.jsx
├── App.jsx
└── main.jsx
```

## Security notes

- The **RapidAPI key** is server-side only (`.env`, no `VITE_` prefix) and is
  never sent to the browser.
- The **Supabase anon key** is intentionally public; protect your data with RLS
  policies (see `supabase/schema.sql`).
- The current RLS policies allow **anyone** to add/delete library books for
  demo purposes. Add authentication before exposing this publicly.
- Rotate the RapidAPI key if it was ever committed.

## Continuous integration

`.github/workflows/ci.yml` runs install, lint, tests and build on every push to
`main` and on every pull request.
