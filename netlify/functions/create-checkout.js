// Creates a Stripe Checkout session.
// Prices and product names ALWAYS come from the stored catalog, never
// from the browser, so a tampered cart cannot change the amount charged.
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

let stripeClient = null;
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured");
  }
  if (!stripeClient) {
    stripeClient = require("stripe")(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

exports.handler = async (event) => {
  const headers = noStore(corsHeaders(event));

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" }, headers);
  }

  const limit = rateLimit("checkout:" + getClientIp(event), 15, 10 * 60 * 1000);
  if (!limit.ok) {
    return json(
      429,
      { error: "Too many checkout attempts. Please try again later." },
      Object.assign({}, headers, { "Retry-After": String(limit.retryAfter) })
    );
  }

  try {
    getStripe();

    const body = readJson(event, 32 * 1024);
    const customer = body.customer && typeof body.customer === "object" ? body.customer : {};

    const name = line(customer.name, 100);
    const mail = email(customer.email);
    const eventDate = line(customer.date, 10);
    const address = line(customer.address, 200);
    const phone = line(customer.phone, 40);
    const location = line(customer.location, 100);
    const guests = line(customer.guests, 20);
    const comments = text(customer.comments, 400);

    if (name.length < 2) throw new HttpError(400, "Please enter your name");
    if (!mail) throw new HttpError(400, "Please enter a valid email address");
    if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      throw new HttpError(400, "Invalid event date");
    }

    const catalog = await loadCatalog();
    const items = normalizeCart(body.cart, catalog);

    await assertDateAvailable(
      eventDate,
      items.reduce(function (ids, entry) {
        return ids.concat(entry.bookingIds || [entry.product.id]);
      }, [])
    );

    const lineItems = items.map((entry) => ({
      price_data: {
        currency: "usd",
        product_data: { name: line(entry.product.name, 120) },
        unit_amount: Math.round(entry.price * 100),
      },
      quantity: entry.quantity,
    }));

    const baseUrl = String(
      process.env.SITE_URL || process.env.URL || "https://mainlinebounce.com"
    ).replace(/\/+$/, "");

    const summary = lineItems
      .map((item) => `${item.price_data.product_data.name} x${item.quantity}`)
      .join(", ")
      .slice(0, 450);

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      customer_email: mail,
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout.html`,
      metadata: {
        name,
        email: mail,
        address,
        phone,
        date: eventDate,
        location,
        guests,
        comments,
        items: summary,
      },
    });

    return json(200, { id: session.id }, headers);
  } catch (error) {
    if (error instanceof HttpError) {
      return json(error.status, { error: error.message }, headers);
    }
    console.error("create-checkout error:", error);
    return json(500, { error: "Unable to start checkout. Please try again." }, headers);
  }
};
