const {
  HttpError,
  corsHeaders,
  json,
  noStore,
  isAdmin,
  getClientIp,
  rateLimit,
  readJson,
  line,
  text,
} = require("./lib/security");
const {
  getBookings,
  recordBooking,
  deleteBooking,
  updateBooking,
  ensureHistoricalBookings,
} = require("./bookings-store");

exports.handler = async (event) => {
  const headers = noStore(corsHeaders(event));

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const limit = rateLimit("bookings:" + getClientIp(event), 120, 5 * 60 * 1000);
  if (!limit.ok) {
    return json(429, { error: "Too many requests" }, headers);
  }

  if (!isAdmin(event)) {
    return json(401, { error: "Unauthorized" }, headers);
  }

  /* GET -> booking list (admin) */
  if (event.httpMethod === "GET") {
    try {
      try {
        await ensureHistoricalBookings();
      } catch (error) {
        console.error("Historical import error:", error);
      }

      const list = await getBookings();
      list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      return json(200, { bookings: list }, headers);
    } catch (error) {
      console.error("bookings GET error:", error);
      return json(500, { error: "Unable to load bookings" }, headers);
    }
  }

  /* POST -> create / update / delete (admin) */
  if (event.httpMethod === "POST") {
    try {
      const body = readJson(event, 64 * 1024);
      const action = line(body.action, 20);
      const id = line(body.id, 100);

      if (action === "delete") {
        if (!id) throw new HttpError(400, "Missing id");
        const list = await deleteBooking(id);
        return json(200, { success: true, count: list.length }, headers);
      }

      if (action === "create") {
        const booking = body.booking && typeof body.booking === "object" ? body.booking : null;
        if (!booking || !line(booking.name, 100)) {
          throw new HttpError(400, "Missing booking data");
        }

        const created = await recordBooking({
          date: line(booking.eventDate, 20),
          name: line(booking.name, 100),
          email: line(booking.email, 150),
          phone: line(booking.phone, 40),
          address: line(booking.address, 200),
          location: line(booking.location, 100),
          guests: line(booking.guests, 20),
          comments: text(booking.comments, 500),
          items: text(booking.items, 1000),
          total: booking.total,
          payment: booking.payment,
          createdAt: line(booking.createdAt, 40),
        });
        return json(200, { success: true, booking: created }, headers);
      }

      if (action === "update") {
        const booking = body.booking && typeof body.booking === "object" ? body.booking : null;
        if (!booking || !line(booking.id, 100)) {
          throw new HttpError(400, "Missing booking");
        }

        const optLine = (value, max) => (value === undefined ? undefined : line(value, max));
        const optText = (value, max) => (value === undefined ? undefined : text(value, max));

        const updated = await updateBooking(line(booking.id, 100), {
          createdAt: optLine(booking.createdAt, 40),
          eventDate: optLine(booking.eventDate, 20),
          name: optLine(booking.name, 100),
          email: optLine(booking.email, 150),
          phone: optLine(booking.phone, 40),
          address: optLine(booking.address, 200),
          location: optLine(booking.location, 100),
          guests: optLine(booking.guests, 20),
          items: optText(booking.items, 1000),
          comments: optText(booking.comments, 500),
          total: booking.total,
          payment: booking.payment === undefined ? undefined : line(booking.payment, 20),
        });

        if (!updated) throw new HttpError(404, "Booking not found");
        return json(200, { success: true, booking: updated }, headers);
      }

      throw new HttpError(400, "Invalid action");
    } catch (error) {
      if (error instanceof HttpError) {
        return json(error.status, { error: error.message }, headers);
      }
      console.error("bookings POST error:", error);
      return json(500, { error: "Unable to update bookings" }, headers);
    }
  }

  return json(405, { error: "Method Not Allowed" }, headers);
};

