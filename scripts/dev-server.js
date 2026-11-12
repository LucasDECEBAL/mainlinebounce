/* ============================================
   MAIN LINE BOUNCE — LOCAL DEV SERVER
   Emulates the Netlify Functions used by the admin (site-content, media,
   blocked-dates, bookings) so everything can be tested before deploying.

   Usage:  npm run dev
   Admin:  http://localhost:8888/admin.html
   Key:    dev-admin-key-1234  (override with ADMIN_KEY env var)
   ============================================ */

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const LOCAL_DIR = path.join(ROOT, ".local-dev");
const MEDIA_DIR = path.join(LOCAL_DIR, "media");
const CONTENT_FILE = path.join(LOCAL_DIR, "content.json");
const PORT = Number(process.env.PORT) || 8888;
const ADMIN_KEY = process.env.ADMIN_KEY || "dev-admin-key-1234";

/* Reuse the real sanitizer + default content */
const siteContent = require(path.join(ROOT, "netlify", "functions", "site-content.js"));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};

const UPLOAD_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

function ensureDirs() {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

function loadContent() {
  try {
    return JSON.parse(fs.readFileSync(CONTENT_FILE, "utf8"));
  } catch (error) {
    return siteContent.__test.cleanContent(
      JSON.parse(JSON.stringify(siteContent.DEFAULT_CONTENT))
    );
  }
}

function saveContent(content) {
  ensureDirs();
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2), "utf8");
}

function readBody(req, limit) {
  return new Promise(function (resolve, reject) {
    let size = 0;
    const chunks = [];

    req.on("data", function (chunk) {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", function () { resolve(Buffer.concat(chunks)); });
    req.on("error", reject);
  });
}

function isAdmin(req) {
  return req.headers["x-admin-key"] === ADMIN_KEY;
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function serveStatic(res, pathname) {
  const clean = decodeURIComponent(pathname);
  let filePath = path.join(ROOT, clean === "/" ? "index.html" : clean.replace(/^\/+/, ""));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    return res.end("<h1>404 — not found</h1>");
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async function (req, res) {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  try {
    /* ---------- site-content ---------- */
    if (pathname === "/.netlify/functions/site-content") {
      if (req.method === "POST") {
        if (!isAdmin(req)) return sendJson(res, 401, { error: "Unauthorized" });
        if (url.searchParams.get("verify")) return sendJson(res, 200, { ok: true });

        const body = await readBody(req, 6 * 1024 * 1024);
        let parsed;
        try {
          parsed = JSON.parse(body.toString("utf8"));
        } catch (error) {
          return sendJson(res, 400, { error: "Invalid JSON" });
        }

        let content;
        try {
          content = siteContent.__test.cleanContent(parsed);
        } catch (error) {
          return sendJson(res, 400, { error: error.message || "Invalid content" });
        }

        saveContent(content);
        console.log(
          "[site-content] saved — " + content.products.length + " products, " +
          content.blog.length + " blog posts"
        );
        return sendJson(res, 200, content);
      }

      return sendJson(res, 200, loadContent());
    }

    /* ---------- media ---------- */
    if (pathname === "/.netlify/functions/media") {
      if (req.method === "GET") {
        const key = url.searchParams.get("key") || "";
        if (!/^m\/[A-Za-z0-9_-]{16,80}\.[a-z0-9]{2,5}$/.test(key)) {
          return sendJson(res, 400, { error: "Invalid key" });
        }

        const file = path.join(MEDIA_DIR, path.basename(key));
        if (!fs.existsSync(file)) return sendJson(res, 404, { error: "Not found" });

        const ext = path.extname(file).toLowerCase();
        res.writeHead(200, {
          "Content-Type": MIME[ext] || "application/octet-stream",
          "Cache-Control": "public, max-age=31536000, immutable",
        });
        return fs.createReadStream(file).pipe(res);
      }

      if (req.method === "POST") {
        if (!isAdmin(req)) return sendJson(res, 401, { error: "Unauthorized" });

        const body = await readBody(req, 6 * 1024 * 1024);
        let payload;
        try {
          payload = JSON.parse(body.toString("utf8"));
        } catch (error) {
          return sendJson(res, 400, { error: "Invalid JSON" });
        }

        const type = String(payload.type || "").toLowerCase();
        const ext = UPLOAD_TYPES[type];
        if (!ext) return sendJson(res, 400, { error: "Unsupported file type" });

        const buffer = Buffer.from(String(payload.data || ""), "base64");
        if (!buffer.length) return sendJson(res, 400, { error: "Empty file" });
        if (buffer.length > 3.5 * 1024 * 1024) {
          return sendJson(res, 413, { error: "File too large — max 3.5 MB" });
        }

        ensureDirs();
        const hash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 40);
        const key = "m/" + hash + "." + ext;
        fs.writeFileSync(path.join(MEDIA_DIR, path.basename(key)), buffer);
        console.log("[media] uploaded " + key + " (" + Math.round(buffer.length / 1024) + " KB)");

        return sendJson(res, 200, {
          url: "/.netlify/functions/media?key=" + encodeURIComponent(key),
          type: payload.type,
        });
      }

      return sendJson(res, 405, { error: "Method Not Allowed" });
    }

    /* ---------- blocked-dates (local file) ---------- */
    if (pathname === "/.netlify/functions/blocked-dates") {
      ensureDirs();
      const file = path.join(LOCAL_DIR, "blocked-dates.json");
      let data = {};
      try { data = JSON.parse(fs.readFileSync(file, "utf8")); } catch (error) {}

      if (req.method === "POST") {
        if (!isAdmin(req)) return sendJson(res, 401, { error: "Unauthorized" });

        let body = {};
        try {
          body = JSON.parse((await readBody(req, 100 * 1024)).toString("utf8") || "{}");
        } catch (error) {}

        if (body.action === "block" && body.item && body.date) {
          if (!Array.isArray(data[body.item])) data[body.item] = [];
          if (data[body.item].indexOf(body.date) === -1) data[body.item].push(body.date);
        } else if (body.action === "unblock" && body.item && body.date) {
          data[body.item] = (data[body.item] || []).filter(function (d) { return d !== body.date; });
          if (!data[body.item].length) delete data[body.item];
        }

        fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
        return sendJson(res, 200, { success: true, data: data });
      }

      return sendJson(res, 200, data);
    }

    /* ---------- bookings (empty stub) ---------- */
    if (pathname === "/.netlify/functions/bookings") {
      if (!isAdmin(req)) return sendJson(res, 401, { error: "Unauthorized" });
      return sendJson(res, 200, { bookings: [] });
    }

    /* ---------- other functions are not emulated ---------- */
    if (pathname.indexOf("/.netlify/functions/") === 0) {
      return sendJson(res, 501, { error: "Not available in local dev: " + pathname });
    }

    /* ---------- static files ---------- */
    return serveStatic(res, pathname);
  } catch (error) {
    console.error("dev-server error:", error);
    sendJson(res, 500, { error: error.message || "Server error" });
  }
});

ensureDirs();
server.listen(PORT, "127.0.0.1", function () {
  console.log("");
  console.log("  Main Line Bounce — local dev server");
  console.log("  -----------------------------------");
  console.log("  Site:      http://localhost:" + PORT + "/");
  console.log("  Admin:     http://localhost:" + PORT + "/admin.html");
  console.log("  Admin key: " + ADMIN_KEY);
  console.log("");
  console.log("  Local only (127.0.0.1) — not reachable from the network.");
  console.log("  Local data: .local-dev/ (uploaded images + content.json)");
  console.log("  Ctrl+C to stop");
  console.log("");
});
