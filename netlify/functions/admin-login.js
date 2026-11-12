/* Exchanges the admin key for an HttpOnly session cookie.
   The key is sent once, over HTTPS, and is never stored in the browser. */
const {
  corsHeaders,
  json,
  noStore,
  readJson,
  getClientIp,
  rateLimitPersistent,
  safeEqual,
  getAdminKey,
  signSession,
  sessionCookie,
  isTrustedOrigin,
} = require("./lib/security");

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

exports.handler = async (event) => {
  const headers = noStore(corsHeaders(event));

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" }, headers);
  }

  if (!isTrustedOrigin(event)) {
    return json(403, { error: "Forbidden" }, headers);
  }

  /* 5 attempts per 15 minutes per IP, shared across function instances.
     The legacy ?verify=1 endpoint uses the same bucket, so an attacker
     cannot double the budget by alternating endpoints. */
  const limit = await rateLimitPersistent(
    "admin-verify",
    getClientIp(event),
    MAX_ATTEMPTS,
    WINDOW_MS
  );

  if (!limit.ok) {
    return json(
      429,
      { error: "Too many attempts. Please try again in 15 minutes." },
      Object.assign({}, headers, { "Retry-After": String(limit.retryAfter) })
    );
  }

  let body;
  try {
    body = readJson(event, 4 * 1024);
  } catch (error) {
    return json(400, { error: "Invalid request" }, headers);
  }

  const key = typeof body.key === "string" ? body.key : "";
  const expected = getAdminKey();

  if (!expected || !safeEqual(key, expected)) {
    return json(401, { error: "Invalid admin key" }, headers);
  }

  const token = signSession();
  if (!token) {
    console.error("admin-login: no session secret configured");
    return json(500, { error: "Session unavailable" }, headers);
  }

  return {
    statusCode: 200,
    headers: Object.assign({}, headers, { "Set-Cookie": sessionCookie(token) }),
    body: JSON.stringify({ ok: true }),
  };
};
