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

/* ---- Admin session (HttpOnly cookie) -------------------------------
   The admin key is only sent once, to admin-login. After that, the
   browser holds an HttpOnly, SameSite=Strict cookie that JavaScript
   cannot read. The token is signed with ADMIN_SESSION_SECRET (or
   ADMIN_KEY as a fallback) and embeds a fingerprint of ADMIN_KEY so
   rotating the key invalidates every existing session. */

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function isDevContext() {
  return (
    process.env.CONTEXT === "dev" ||
    process.env.NODE_ENV === "development" ||
    process.env.NETLIFY_DEV === "true"
  );
}

function sessionCookieName() {
  /* __Host- requires Secure + Path=/ + no Domain. In local dev
     (http://localhost) we use a plain name so the cookie still works. */
  return isDevContext() ? "mlb_admin_dev" : "__Host-mlb_admin";
}

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_KEY || "";
}

function adminKeyFingerprint() {
  return crypto
    .createHash("sha256")
    .update(process.env.ADMIN_KEY || "")
    .digest("hex")
    .slice(0, 16);
}

function signSession(now) {
  const secret = sessionSecret();
  if (!secret) return "";

  const issuedAt = Number(now) || Date.now();
  const payload = {
    v: 1,
    sub: "admin",
    iat: issuedAt,
    exp: issuedAt + SESSION_TTL_MS,
    kv: adminKeyFingerprint(),
    jti: crypto.randomBytes(12).toString("base64url"),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update("v1." + encoded)
    .digest("base64url");

  return "v1." + encoded + "." + signature;
}

function verifySession(token, now) {
  if (typeof token !== "string" || !token) return null;

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;

  const secret = sessionSecret();
  if (!secret) return null;

  const encoded = parts[1];
  const expected = crypto
    .createHmac("sha256", secret)
    .update("v1." + encoded)
    .digest("base64url");

  if (!safeEqual(parts[2], expected)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch (error) {
    return null;
  }

  const current = Number(now) || Date.now();
  if (!payload || payload.v !== 1 || payload.sub !== "admin") return null;
  if (typeof payload.exp !== "number" || payload.exp <= current) return null;
  if (typeof payload.iat !== "number" || payload.iat > current + 60000) return null;
  if (payload.kv !== adminKeyFingerprint()) return null;

  return payload;
}

function getCookie(event, name) {
  const headers = (event && event.headers) || {};
  const raw = headers.cookie || headers.Cookie || "";
  if (!raw) return "";

  const parts = String(raw).split(";");
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      return part.slice(index + 1).trim();
    }
  }
  return "";
}

function getAdminSession(event) {
  return verifySession(getCookie(event, sessionCookieName()));
}

function sessionCookie(token) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  const secure = isDevContext() ? "" : "; Secure";
  return (
    sessionCookieName() +
    "=" + token +
    "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + maxAge + secure
  );
}

function clearSessionCookie() {
  const secure = isDevContext() ? "" : "; Secure";
  return (
    sessionCookieName() +
    "=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; " +
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT" + secure
  );
}

function isTrustedOrigin(event) {
  const headers = (event && event.headers) || {};
  const origin = headers.origin || headers.Origin;
  if (!origin) return true; // curl / server-to-server (no browser CSRF risk)

  /* Local development (netlify dev, http://localhost:8888). */
  if (isDevContext() && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return true;
  }

  const allowed = DEFAULT_ORIGINS.concat(
    [process.env.SITE_URL, process.env.URL, process.env.DEPLOY_PRIME_URL].filter(Boolean)
  );
  return allowed.indexOf(origin) !== -1;
}

function getAdminKey() {
  const key = process.env.ADMIN_KEY || "";
  if (key.length < 16) {
    // Never print the key itself.
    console.warn("[security] ADMIN_KEY is missing or shorter than 16 characters");
  }
  return key;
}

/* Fail closed: if the server has no ADMIN_KEY, no request is authorized.
   Accepts either the legacy x-admin-key header (kept for a smooth
   transition) or the HttpOnly session cookie. */
function isAdmin(event) {
  const expected = getAdminKey();
  if (!expected) return false;

  const headers = event.headers || {};
  const provided =
    headers["x-admin-key"] ||
    headers["X-Admin-Key"] ||
    headers["X-ADMIN-KEY"] ||
    "";

  if (provided && safeEqual(provided, expected)) return true;

  const session = getAdminSession(event);
  if (!session) return false;

  /* Cookie auth is automatic, so require a trusted Origin on writes
     (defense in depth on top of SameSite=Strict). */
  const method = String(event.httpMethod || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    if (!isTrustedOrigin(event)) return false;
  }

  return true;
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

/* Persistent limiter shared across function instances (Netlify Blobs).
   Falls back to the in-memory limiter if Blobs is unavailable. */
async function rateLimitPersistent(name, key, limit, windowMs) {
  const now = Date.now();
  const bucketKey =
    "rl/" +
    String(name).replace(/[^a-z0-9_-]/gi, "-") +
    "/" +
    crypto.createHash("sha256").update(String(key)).digest("hex");

  try {
    const { getStore } = require("@netlify/blobs");
    const store = getStore({
      name: "rate-limits",
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN,
    });

    let entry = await store.get(bucketKey, { type: "json" });
    if (!entry || typeof entry.reset !== "number" || now > entry.reset) {
      entry = { count: 0, reset: now + windowMs };
    }
    entry.count += 1;
    await store.set(bucketKey, JSON.stringify(entry));

    return {
      ok: entry.count <= limit,
      retryAfter: Math.max(1, Math.ceil((entry.reset - now) / 1000)),
    };
  } catch (error) {
    console.warn("[security] persistent rate limit fallback:", error.message);
    return rateLimit(name + ":" + key, limit, windowMs);
  }
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
  getAdminKey,
  isAdmin,
  signSession,
  verifySession,
  getAdminSession,
  sessionCookie,
  clearSessionCookie,
  sessionCookieName,
  isTrustedOrigin,
  corsHeaders,
  json,
  noStore,
  getClientIp,
  rateLimit,
  rateLimitPersistent,
  readJson,
  text,
  line,
  email,
  safeUrl,
  safeImage,
  escapeHtml,
};
