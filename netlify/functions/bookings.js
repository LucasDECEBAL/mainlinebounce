const crypto = require("crypto");
const {
  getBookings,
  deleteBooking,
  updateBooking,
  ensureHistoricalBookings,
} = require("./bookings-store");

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
    try {
      await ensureHistoricalBookings(); // import unique des clients historiques
    } catch (e) {
      console.error("Historical import error:", e);
    }

    const list = await getBookings();
    list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return { statusCode: 200, headers, body: JSON.stringify({ bookings: list }) };
  }

  /* ✍️ POST → supprimer / modifier un booking (admin) */
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const { action, id, booking } = body;

      if (action === "delete") {
        if (!id) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing id" }) };
        }
        const list = await deleteBooking(id);
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, count: list.length }) };
      }

      if (action === "update") {
        if (!booking || !booking.id) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing booking" }) };
        }
        const updated = await updateBooking(booking.id, booking);
        if (!updated) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: "Booking not found" }) };
        }
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, booking: updated }) };
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid action" }) };
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
