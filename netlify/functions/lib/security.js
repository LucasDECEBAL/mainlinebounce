/* Shared security helpers for the Netlify Functions.
   Keep these dependency-free so they bundle cleanly. */
const crypto = require("crypto");

const MAX_BODY_BYTES = 256 * 1024;
const DEFAULT_ORIGINS = [
  "https://mainlinebounce.com",
  "https://www.mainlinebounce.com",
];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest();
}

/* Constant-time comparison that never throws and never accepts an
   empty configured secret. Hashing first removes the length leak. */
function safeEqual(a, b) {
  const left = Buffer.from(String(a == null ? "" : a), "utf8");
  const right = Buffer.from(String(b == null ? "" : b), "utf8");
  if (!left.length || !right.length) return false;
  const same = crypto.timingSafeEqual(sha256(left), sha256(right));
  return same && left.length === right.length;
}

function getAdminKey() {
  const key = process.env.ADMIN_KEY || "";
  if (key.length < 16) {
    // Never print the key itself.
    console.warn("[security] ADMIN_KEY is missing or shorter than 16 characters");
  }
  return key;
}

/* Fail closed: if the server has no ADMIN_KEY, no request is authorized. */
function isAdmin(event) {
  const expected = getAdminKey();
  if (!expected) return false;

  const headers = event.headers || {};
  const provided =
    headers["x-admin-key"] ||
    headers["X-Admin-Key"] ||
    headers["X-ADMIN-KEY"] ||
    "";

  return safeEqual(provided, expected);
}

function corsHeaders(event) {
  const allowed = DEFAULT_ORIGINS
    .concat(process.env.SITE_URL ? [process.env.SITE_URL] : [])
    .filter(Boolean);

  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };

  const origin = event && event.headers && event.headers.origin;
  if (origin && allowed.indexOf(origin) !== -1) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function json(statusCode, payload, extraHeaders) {
  return {
    statusCode,
    headers: Object.assign(
      { "Content-Type": "application/json" },
      extraHeaders || {}
    ),
    body: JSON.stringify(payload),
  };
}

function noStore(headers) {
  return Object.assign({}, headers || {}, { "Cache-Control": "no-store" });
}

function getClientIp(event) {
  const h = (event && event.headers) || {};
  const direct = h["x-nf-client-connection-ip"];
  if (direct) return String(direct).trim();
  const forwarded = String(h["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || "unknown";
}

/* Small in-memory limiter (per function instance). It frustrates burst
   abuse without adding write latency to Netlify Blobs. */
const buckets = new Map();

function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  let entry = buckets.get(key);

  if (!entry || now > entry.reset) {
    entry = { count: 0, reset: now + windowMs };
  }

  entry.count += 1;
  buckets.set(key, entry);

  if (buckets.size > 5000) {
    for (const [bucketKey, value] of buckets) {
      if (now > value.reset) buckets.delete(bucketKey);
    }
  }

  return {
    ok: entry.count <= limit,
    retryAfter: Math.max(1, Math.ceil((entry.reset - now) / 1000)),
  };
}

function readRawBody(event) {
  if (event.isBase64Encoded) {
    return Buffer.from(event.body || "", "base64").toString("utf8");
  }
  return String(event.body || "");
}

function readJson(event, maxBytes) {
  const limit = maxBytes || MAX_BODY_BYTES;
  const raw = readRawBody(event);

  if (raw.length > limit) throw new HttpError(413, "Payload too large");
  if (!raw.trim()) throw new HttpError(400, "Empty body");

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new HttpError(400, "Invalid JSON");
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new HttpError(400, "Invalid body");
  }

  return data;
}

/* Text cleanup: drop control characters, bound the length. */
function text(value, max) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .slice(0, max || 500);
}

function line(value, max) {
  return text(value, max).replace(/[\r\n]+/g, " ").trim();
}

const EMAIL_RE = /^[^\s@<>"'`]+@[^\s@<>"'`]+\.[A-Za-z]{2,}$/;

function email(value) {
  const candidate = line(value, 150).toLowerCase();
  return EMAIL_RE.test(candidate) ? candidate : "";
}

/* Only allow links that cannot execute script. */
function safeUrl(value) {
  const candidate = text(value, 500).trim();
  if (!candidate) return "";

  if (/^tel:[+0-9().\-\s]+$/i.test(candidate)) return candidate;
  if (/\s/.test(candidate)) return "";
  if (/^https?:\/\//i.test(candidate)) return candidate;
  if (/^mailto:[^\s]+$/i.test(candidate)) return candidate;
  if (/^#[A-Za-z0-9_\-:.]*$/.test(candidate)) return candidate;
  if (/^\/(?!\/)[A-Za-z0-9._~\-/%]*(\?[A-Za-z0-9._~%&=+#\-]*)?(#[A-Za-z0-9._~%\-]*)?$/.test(candidate)) return candidate;
  if (/^[A-Za-z0-9][A-Za-z0-9._~\-/]*(\?[A-Za-z0-9._~%&=+#\-]*)?(#[A-Za-z0-9._~%\-]*)?$/.test(candidate)) {
    return candidate;
  }

  return "";
}

function safeImage(value) {
  const url = safeUrl(value);
  if (/^(mailto|tel):/i.test(url)) return "";
  return url;
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = {
  HttpError,
  DEFAULT_ORIGINS,
  MAX_BODY_BYTES,
  safeEqual,
  isAdmin,
  corsHeaders,
  json,
  noStore,
  getClientIp,
  rateLimit,
  readJson,
  text,
  line,
  email,
  safeUrl,
  safeImage,
  escapeHtml,
};
