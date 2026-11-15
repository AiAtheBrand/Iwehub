# BookNest

A React single-page app for a **shared book library**. **Signed-in users** add
books (title, author, description, subjects, a cover image and the book file
itself) and everyone signed in can browse and download them. It is backed by
Supabase (Postgres + Auth + Storage).

Supabase is accessed directly from the browser using its **public anon key**,
which is safe to expose because Row Level Security (RLS) enforces access on the
server. Authentication uses **Supabase Auth** with email + password.

> This app used to also browse the public Project Gutenberg catalogue through a
> RapidAPI proxy. That has been removed: the app is now purely the shared
> library of uploaded books.

## Tech stack

- **React 19** + **Vite 8**
- **react-router-dom 7** (routing)
- **Tailwind CSS 4** (styling)
- **Supabase** (Postgres database + Auth + storage + auto REST API)
- **Express 5** (serves the production build)
- **Vitest** + **Testing Library** + **jsdom** (tests)

## Architecture

```
                     ┌───────────────┐
Browser ──▶ React ──▶│   Supabase    │  (table `books` + buckets `covers`, `book-files`)
                     └───────────────┘
```

- The **shared library** lives in Supabase and is visible to everyone. A book
  captures a title, author, description, subjects, cover image **and the book
  file itself**, all uploaded to Supabase Storage, so shared books can be
  downloaded by anyone. Each book has a **View** page (`/library/:id`) with a
  single Download button.
- Adding a book requires **signing in**. Deleting a book is allowed only for the
  user who added it.
- **Every page is gated behind sign-in.** All routes are children of an
  `AuthGate` layout route ([`src/components/AuthGate.jsx`](src/components/AuthGate.jsx)),
  so `/` and `/library/:id` both show the sign-in screen until a session exists.
  (When Supabase is not configured the wall is skipped so the app still runs.)
- Deleting a book also deletes its uploaded cover and book file, so no orphaned
  files are left behind in Storage.
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

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open the URL Vite prints (usually http://localhost:5173).

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Run the Vite dev server |
| `npm run build` | Production build into `dist/` |
| `npm start` | Serve `dist/` with Express (production) |
| `npm run preview` | Preview the built `dist/` with Vite |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once (CI) |
| `npm run coverage` | Run tests with coverage |

## Project structure

```
server/index.js          # Static server for the production build
supabase/schema.sql      # Database schema, policies, storage buckets
src/
├── lib/
│   ├── supabase.js      # Supabase client (guarded by env vars)
│   ├── limits.js        # Upload size limit (20 MB)
│   └── download.js      # Builds the download link for an uploaded file
├── api/library.js       # Supabase library client (list/get/add/delete)
├── hooks/
│   ├── useAuth.js       # Supabase session + sign in/up/out
│   ├── useLibraryBooks.js # Loads + mutates the shared library
│   └── useLibraryBook.js  # Loads a single library book
├── components/
│   ├── AuthGate.jsx     # Layout route: gates every page behind sign-in
│   ├── AuthForm.jsx     # Email + password sign in / sign up
│   ├── Library.jsx      # The signed-in grid: search, add, delete
│   ├── BookCard.jsx     # One book in the grid
│   ├── AddBookForm.jsx  # Add a book (details + cover + book file)
│   └── LibraryBookDetails.jsx # The /library/:id View page
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

- The **Supabase anon key** is intentionally public; the RLS policies above are
  what actually protect the data.
- Auth **enforces** who can write and delete; anonymous visitors can only read.
- There are no server-side secrets any more — the old RapidAPI proxy and key
  were removed, so no API key is shipped or stored.

## Deploying to Vercel

The app is a static SPA that talks to Supabase directly, so it deploys as a
normal Vite site. [`vercel.json`](vercel.json) is already set up.

1. **Import the repo** at [vercel.com/new](https://vercel.com/new) and pick the
   `bookStore` repository. Vercel auto-detects Vite:

   | Setting | Value |
   | --- | --- |
   | Framework preset | Vite |
   | Build command | `npm run build` |
   | Output directory | `dist` |
   | Install command | `npm install` |

2. **Add the environment variables** (Project → Settings → Environment
   Variables). Vite inlines `VITE_*` values at **build time**, so they must be
   present before the first build — adding them later requires a redeploy:

   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Point Supabase at the deployed domain.** In the Supabase dashboard →
   **Authentication → URL Configuration**, set the **Site URL** and add the
   Vercel domain to **Redirect URLs**, otherwise sign-in links will point at
   `localhost`.

4. **Set up email delivery for real users.** The default Supabase email service
   only delivers to project members and is rate-limited. Configure **custom
   SMTP** (Authentication → Emails) and turn on **Confirm email** before opening
   the app to the public.

### Why `vercel.json` matters

The router (`createBrowserRouter`) uses real paths such as `/library/<id>`.
`vercel.json` rewrites every unknown path back to `/index.html` so those deep
links load the app instead of returning a 404 on refresh. Without it, only the
home page would work on a hard refresh.

## Continuous integration

`.github/workflows/ci.yml` runs install, lint, tests and build on every push to
`main` and on every pull request.
