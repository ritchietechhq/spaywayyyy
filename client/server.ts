import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { handleApiRequest } from "../server/src/routes/api.ts";

// Spayway Static & API Gateway Server with Real Rates Oracle
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

const STATIC_DIRS = ["/assets/", "/styles/", "/scripts/"];

function serveStatic(urlPath: string, res: import("node:http").ServerResponse): boolean {
  const clean = urlPath.split("?")[0];
  const isLanding = clean === "/" || clean === "/index.html";
  const isApp = clean === "/app" || clean === "/app.html";
  const isAuth = clean === "/auth" || clean === "/auth.html";

  if (!isLanding && !isApp && !isAuth && !STATIC_DIRS.some((d) => clean.startsWith(d))) {
    return false;
  }

  const rel = isLanding
    ? "landing.html"
    : isApp
    ? "app.html"
    : isAuth
    ? "auth.html"
    : clean.slice(1);
  const full = normalize(join(__dirname, rel));

  // Strictly restrict served files to landing.html, app.html, auth.html, or the public static directories
  const allowedRoots = STATIC_DIRS.map((d) => join(__dirname, d));
  const isAllowed =
    full === join(__dirname, "landing.html") ||
    full === join(__dirname, "app.html") ||
    full === join(__dirname, "auth.html") ||
    allowedRoots.some((root) => full.startsWith(root));

  if (!isAllowed) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return true;
  }

  if (!existsSync(full)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return true;
  }

  res.writeHead(200, {
    "Content-Type": MIME[extname(full)] || "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  res.end(readFileSync(full));
  return true;
}

const clientServer = createServer((req, res) => {
  const url = req.url || "/";
  if (url.startsWith("/api/") || url === "/health") {
    handleApiRequest(req, res);
    return;
  }
  if (serveStatic(url, res)) return;
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

clientServer.listen(PORT, () => {
  console.log(
    `[spayway-client] Landing: http://localhost:${PORT} | Auth: http://localhost:${PORT}/auth | Workspace: http://localhost:${PORT}/app`
  );
});
