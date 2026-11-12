/* Tells the admin page whether the HttpOnly session cookie is valid.
   Does not reveal the key or any session data. */
const {
  corsHeaders,
  json,
  noStore,
  getAdminSession,
} = require("./lib/security");

exports.handler = async (event) => {
  const headers = noStore(corsHeaders(event));

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method Not Allowed" }, headers);
  }

  return json(200, { authenticated: Boolean(getAdminSession(event)) }, headers);
};
