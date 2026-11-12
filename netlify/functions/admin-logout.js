/* Clears the admin session cookie. */
const {
  corsHeaders,
  json,
  noStore,
  clearSessionCookie,
  isTrustedOrigin,
} = require("./lib/security");

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

  return {
    statusCode: 200,
    headers: Object.assign({}, headers, { "Set-Cookie": clearSessionCookie() }),
    body: JSON.stringify({ ok: true }),
  };
};
