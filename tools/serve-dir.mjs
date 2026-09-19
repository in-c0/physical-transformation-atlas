// Serve one directory read-only on 127.0.0.1 (used to hand screenshots to a browser tab).
// Usage: node tools/serve-dir.mjs <dir> [port]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.argv[2] ?? ".");
const port = Number(process.argv[3] ?? 8765);
const TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".html": "text/html; charset=utf-8", ".txt": "text/plain", ".md": "text/plain; charset=utf-8" };
createServer(async (req, res) => {
  const p = join(root, normalize(decodeURIComponent((req.url ?? "/").split("?")[0])).replace(/^([/\\])+/, ""));
  if (!p.startsWith(root)) {
    res.writeHead(403);
    return res.end();
  }
  try {
    const body = await readFile(p);
    res.writeHead(200, { "content-type": TYPES[extname(p)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`serving ${root} at http://127.0.0.1:${port}`));
