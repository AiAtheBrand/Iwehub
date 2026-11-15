# Gutenberg Books

A React single-page app that browses public-domain books from the
[Project Gutenberg Free Books API](https://rapidapi.com/) and lets **signed-in
users** add their own books to a **shared library** backed by Supabase
(Postgres + Auth).

The browser never talks to RapidAPI directly: a small Express server holds the
API key and proxies those requests. Supabase is accessed directly from the
browser using its **public anon key**, which is safe to expose because Row Level
Security (RLS) enforces access on the server. Authentication uses **Supabase
Auth** with email + password.

## Tech stack

- **React 19** + **Vite 8**
- **react-router-dom 7** (routing)
- **Tailwind CSS 4** (styling)
- **Express 5** (RapidAPI proxy / static server)
- **Supabase** (Postgres database + Auth + storage + auto REST API)
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
  Each book has a **View** page (`/books/:id`) with its description, subjects and
  per-format downloads.
- The **shared library** (books users add) lives in Supabase and is visible to
  everyone. A book captures a title, author, description, subjects, cover image
  **and the book file itself**, all uploaded to Supabase Storage, so shared
  books can be downloaded by anyone. Library books have their own **View** page
  (`/library/:id`) with a single Download button.
- Adding a book requires **signing in**. Deleting a **library** book is allowed
  only for the user who added it; deleting a **catalogue** book only hides it
  locally (stored in `localStorage`).
- **Every page is gated behind sign-in.** All routes are children of an
  `AuthGate` layout route ([`src/components/AuthGate.jsx`](src/components/AuthGate.jsx)),
  so `/`, `/books/:id` and `/library/:id` all show the sign-in screen until a
  session exists. (When Supabase is not configured the wall is skipped so the
  app still runs.)
- Deleting a library book also deletes its uploaded cover and book file, so no
  orphaned files are left behind in Storage.
- Uploads are limited to **20 MB per file** (see
  [`src/lib/limits.js`](src/lib/limits.js)); the form rejects larger files
  immediately and the API layer enforces the same limit again.

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
      `books` table, the `covers` and `book-files` storage buckets, and the
      access policies.
   3. Enable email auth: **Authentication → Providers → Email** and make sure
      it is on. New sign-ups must **confirm their email** before they can sign
      in (this is the default). For quick local testing you can turn
      *Confirm email* off under **Authentication → Sign In / Providers**, but
      leave it on in production.
   4. Open **Project Settings → API** and copy the **Project URL** and the
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
│   ├── useAuth.js       # Supabase session + sign in/up/out
│   ├── useBooks.js      # Loads the catalogue
│   ├── useLibraryBooks.js # Loads + mutates the shared library
│   └── useLocalStorage.js # Persists local state (catalogue deletions)
├── components/
│   ├── AuthForm.jsx     # Email + password sign in / sign up
│   ├── BookCard.jsx
│   ├── BookDetails.jsx
│   └── AddBookForm.jsx
├── router/router.jsx
├── App.jsx
└── main.jsx
```

## Authentication & access control

Users sign in with **email + password** (Supabase Auth). The UI hides the add
button/form when signed out, and only shows a **Delete** button on books the
current user is allowed to remove.

Row Level Security in [`supabase/schema.sql`](supabase/schema.sql) enforces the
rules on the server, so the client can never bypass them:

| Action | Who is allowed |
| --- | --- |
| Read books | everyone (including anonymous visitors) |
| Insert a book | signed-in users, and `created_by` must equal their user id |
| Delete a book | only the user who created it (`auth.uid() = created_by`) |
| Read covers / book files | everyone |
| Upload a cover / book file | signed-in users |
| Delete a cover / book file | only the user who uploaded it (`owner_id = auth.uid()`) |

Because `created_by` defaults to `auth.uid()`, the database stamps ownership
automatically when an authenticated user inserts a row.

## Security notes

- The **RapidAPI key** is server-side only (`.env`, no `VITE_` prefix) and is
  never sent to the browser.
- The **Supabase anon key** is intentionally public; the RLS policies above are
  what actually protect the data.
- Auth **enforces** who can write and delete; anonymous visitors can only read.
- Rotate the RapidAPI key if it was ever committed.

## Continuous integration

`.github/workflows/ci.yml` runs install, lint, tests and build on every push to
`main` and on every pull request.
