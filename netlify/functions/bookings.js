const crypto = require("crypto");
const { getBookings, deleteBooking } = require("./bookings-store");

exports.handler = async (event) => {
  const allowedOrigins = [
    "https://mainlinebounce.com",
    "https://www.mainlinebounce.com",
    process.env.SITE_URL,
  ].filter(Boolean);
  const origin = event.headers.origin;
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const headers = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const adminKey = event.headers["x-admin-key"];
  const expectedKey = process.env.ADMIN_KEY;

  let isValid = false;
  try {
    isValid = crypto.timingSafeEqual(
      Buffer.from(adminKey || ""),
      Buffer.from(expectedKey || "")
    );
  } catch (e) {
    isValid = false;
  }

  if (!isValid) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  /* 📖 GET → liste des bookings (admin) */
  if (event.httpMethod === "GET") {
    const list = await getBookings();
    list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return { statusCode: 200, headers, body: JSON.stringify({ bookings: list }) };
  }

  /* ✍️ POST → supprimer un booking (admin) */
  if (event.httpMethod === "POST") {
    try {
      const { action, id } = JSON.parse(event.body || "{}");
      if (action !== "delete" || !id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid action" }) };
      }
      const list = await deleteBooking(id);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, count: list.length }) };
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message || "Invalid request" }),
      };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
};
