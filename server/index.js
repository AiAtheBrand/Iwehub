import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load variables from .env (Node's built-in loader, no dotenv dependency).
// Falls back to real environment variables if the file is absent.
try {
  process.loadEnvFile();
} catch {
  // No .env file present - rely on the process environment.
}

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST =
  process.env.RAPIDAPI_HOST ??
  "project-gutenberg-free-books-api1.p.rapidapi.com";
const PORT = process.env.PORT ?? 8787;

const app = express();

/**
 * Proxy a request to the RapidAPI host, injecting the secret key server-side.
 * `id` is optional: without it we list books, with it we fetch one book.
 */
async function proxyBooks(id, res) {
  if (!RAPIDAPI_KEY) {
    res.status(500).json({ error: "Server is missing RAPIDAPI_KEY" });
    return;
  }

  const upstreamPath = id ? `/books/${encodeURIComponent(id)}` : "/books";

  try {
    const upstream = await fetch(`https://${RAPIDAPI_HOST}${upstreamPath}`, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
    });

    const body = await upstream.text();
    res.status(upstream.status).type("application/json").send(body);
  } catch {
    res.status(502).json({ error: "Upstream request failed" });
  }
}

app.get("/api/books", (_req, res) => proxyBooks(undefined, res));
app.get("/api/books/:id", (req, res) => proxyBooks(req.params.id, res));

// Serve the built SPA for any non-API route (used in production).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");

app.use(express.static(distDir));
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`API proxy listening on http://localhost:${PORT}`);
});
