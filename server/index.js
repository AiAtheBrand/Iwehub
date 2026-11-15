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

const PORT = process.env.PORT ?? 8787;

const app = express();

// Serve the production build. The app talks to Supabase directly from the
// browser, so there is no server-side API to proxy.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");

app.use(express.static(distDir));

// Any other path returns index.html so client-side routes work on reload.
app.use((_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Serving dist/ on http://localhost:${PORT}`);
});
