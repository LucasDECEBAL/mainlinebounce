// Pay-on-site booking notifications (optional flow).
// The browser can never dictate prices or totals: the cart is rebuilt
// from the stored catalog before anything is emailed or recorded.
const {
  HttpError,
  corsHeaders,
  json,
  noStore,
  getClientIp,
  rateLimit,
  readJson,
  line,
  email,
  text,
} = require("./lib/security");
const {
  loadCatalog,
  normalizeCart,
  assertDateAvailable,
} = require("./lib/catalog");
const { sendBookingEmail } = require("./booking-email");
const { recordBooking } = require("./bookings-store");

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

exports.handler = async (event) => {
  const headers = noStore(corsHeaders(event));

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" }, headers);
  }

  const limit = rateLimit("booking:" + getClientIp(event), 6, 10 * 60 * 1000);
  if (!limit.ok) {
    return json(
      429,
      { error: "Too many requests. Please try again later." },
      Object.assign({}, headers, { "Retry-After": String(limit.retryAfter) })
    );
  }

  try {
    const body = readJson(event, 32 * 1024);
    const customer = body.customer && typeof body.customer === "object" ? body.customer : {};

    const name = line(customer.name, 100);
    const mail = email(customer.email);
    const address = line(customer.address, 200);
    const eventDate = line(customer.date, 10);
    const phone = line(customer.phone, 40);
    const location = line(customer.location, 100);
    const guests = line(customer.guests, 20);
    const comments = text(customer.comments, 400);

    if (name.length < 2) throw new HttpError(400, "Please enter your name");
    if (!mail) throw new HttpError(400, "Please enter a valid email address");
    if (!address) throw new HttpError(400, "Please enter your address");
    if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      throw new HttpError(400, "Invalid event date");
    }

    const catalog = await loadCatalog();
    const items = normalizeCart(body.cart, catalog);

    await assertDateAvailable(
      eventDate,
      items.map((entry) => entry.product.id)
    );

    const cart = items.map((entry) => ({
      name: line(entry.product.name, 120),
      price: entry.price,
      quantity: entry.quantity,
    }));

    const total = items
      .reduce((sum, entry) => sum + entry.price * entry.quantity, 0)
      .toFixed(2);

    const cartText = cart
      .map((item) => `• ${item.name} x${item.quantity} = $${(item.price * item.quantity).toFixed(2)}`)
      .join("\n");

    if (DISCORD_WEBHOOK) {
      const discordMessage = {
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: "New Booking - PAY ON SITE",
            color: 15138816,
            fields: [
              { name: "Customer Name", value: name || "N/A", inline: true },
              { name: "Email", value: mail || "N/A", inline: true },
              { name: "Address", value: address || "N/A", inline: false },
              { name: "Phone", value: phone || "N/A", inline: true },
              { name: "Event Date", value: eventDate || "N/A", inline: true },
              { name: "Event Location", value: location || "N/A", inline: false },
              { name: "Number of Guests", value: guests || "N/A", inline: true },
              { name: "Comments", value: comments || "No comments", inline: false },
              { name: "Items Ordered", value: cartText || "No items", inline: false },
              { name: "Total Amount", value: "$" + total + " (PAY ON SITE)", inline: true },
              { name: "Booking Time", value: new Date().toLocaleString("en-US"), inline: true },
            ],
          },
        ],
      };

      try {
        const response = await fetch(DISCORD_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(discordMessage),
        });
        if (!response.ok) {
          console.error("Discord notification failed:", response.status);
        }
      } catch (error) {
        console.error("Discord notification error:", error);
      }
    }

    try {
      await sendBookingEmail({
        title: "New Booking - PAY ON SITE",
        customer: {
          name,
          email: mail,
          address,
          phone,
          date: eventDate,
          location,
          guests,
          comments,
        },
        cart,
        total,
        paidLabel: "(PAY ON SITE)",
      });
    } catch (error) {
      console.error("Email notification failed:", error);
    }

    try {
      await recordBooking({
        date: eventDate,
        name,
        email: mail,
        phone,
        address,
        location,
        guests,
        comments,
        items: cartText,
        total,
        payment: "pay_on_site",
      });
    } catch (error) {
      console.error("Booking save failed:", error);
      throw new HttpError(500, "Unable to save your booking. Please call us.");
    }

    return json(200, { success: true }, headers);
  } catch (error) {
    if (error instanceof HttpError) {
      return json(error.status, { error: error.message }, headers);
    }
    console.error("send-booking error:", error);
    return json(500, { error: "Unable to send your booking. Please call us." }, headers);
  }
};
