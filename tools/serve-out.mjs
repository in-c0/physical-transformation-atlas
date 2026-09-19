// Serve apps/web/out the way Cloudflare's static assets do: clean URLs,
// `/x` → `/x.html`, `/x/` → `/x/index.html`, 404.html for misses.
// Usage: node tools/serve-out.mjs [port]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(import.meta.url), "..", "..", "apps", "web", "out");
const port = Number(process.argv[2] ?? 5178);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".txt": "text/plain", ".woff2": "font/woff2", ".woff": "font/woff" };

async function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^([/\\])+/, "");
  const candidates = [clean, clean + ".html", join(clean, "index.html")];
  for (const c of candidates) {
    const p = join(root, c);
    if (!p.startsWith(root)) continue;
    try {
      const s = await stat(p);
      if (s.isFile()) return p;
    } catch {}
  }
  return null;
}

export function startServer(p = port) {
  const server = createServer(async (req, res) => {
    const file = await resolveFile(req.url ?? "/");
    if (!file) {
      const nf = join(root, "404.html");
      try {
        const body = await readFile(nf);
        res.writeHead(404, { "content-type": TYPES[".html"] });
        return res.end(body);
      } catch {
        res.writeHead(404);
        return res.end("not found");
      }
    }
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  });
  return new Promise((ok) => server.listen(p, "127.0.0.1", () => ok(server)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await startServer(port);
  console.log(`serving ${root} at http://127.0.0.1:${port}`);
}
