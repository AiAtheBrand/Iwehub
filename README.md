# Gutenberg Books

A small React single-page app that browses public-domain books from the
[Project Gutenberg Free Books API](https://rapidapi.com/) (via RapidAPI) and
shows a detail page for each title.

The browser never talks to RapidAPI directly: a tiny Express server holds the
API key and proxies the requests, so the secret is never shipped to the client.

## Tech stack

- **React 19** + **Vite 8** (dev server & bundler)
- **react-router-dom 7** (client-side routing)
- **Tailwind CSS 4** (utility-first styling, via `@tailwindcss/vite`)
- **Express 5** (API proxy / static server)
- **Vitest** + **Testing Library** + **jsdom** (tests)

## Architecture

```
Browser ──/api/books──▶ Express (server/index.js) ──▶ RapidAPI
   ▲                          │  (injects x-rapidapi-key from .env)
   │                          │
   └── SPA assets ◀───────────┘  serves dist/ in production
```

- In **development**, Vite serves the SPA and proxies `/api/*` to the Express
  server (`vite.config.js` → `server.proxy`).
- In **production**, Express serves both the built `dist/` assets and `/api/*`.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file from the template and fill in your own
   RapidAPI credentials:

   ```bash
   cp .env.example .env
   ```

   ```
   RAPIDAPI_KEY=your-rapidapi-key-here
   RAPIDAPI_HOST=project-gutenberg-free-books-api1.p.rapidapi.com
   PORT=8787
   ```

3. Start the API server **and** the Vite dev server together:

   ```bash
   npm run dev:all
   ```

   Open the URL Vite prints (usually http://localhost:5173).

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev:all` | Run the API server and Vite dev server together |
| `npm run server` | Run only the API proxy server |
| `npm run dev` | Run only the Vite dev server (expects the API server) |
| `npm run build` | Production build into `dist/` |
| `npm start` | Serve `dist/` + `/api` from Express (production) |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once (CI) |
| `npm run coverage` | Run tests with coverage |

## Project structure

```
server/
└── index.js            # Express API proxy + static file server
src/
├── api/books.js        # API client (getBooks, getBook) -> calls /api/*
├── hooks/
│   ├── useBooks.js     # Loads the book list
│   └── useBook.js      # Loads a single book by id
├── components/
│   ├── BookCard.jsx    # Grid card for one book
│   └── BookDetails.jsx # Detail page for one book
├── router/router.jsx   # Route table ("/" and "/books/:id")
├── App.jsx             # Home page
├── main.jsx            # Entry point (mounts the router)
└── index.css           # Tailwind entry
```

## Security notes

- The API key lives in `.env` (gitignored) and is read **only** by the server,
  so it is not included in the browser bundle.
- If a key is ever committed or shared, rotate it. The key that previously
  lived in the client source should be treated as compromised.

## Continuous integration

`.github/workflows/ci.yml` runs install, lint, tests and build on every push to
`main` and on every pull request.
