// Verifies a Stripe Checkout session before the success page reports a payment
// or fires an ad conversion. Public endpoint: returns only paid/amount/currency.
const {
  corsHeaders,
  json,
  noStore,
  getClientIp,
  rateLimit,
} = require("./lib/security");

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

const SESSION_RE = /^cs_(test|live)_[A-Za-z0-9]{10,255}$/;

exports.handler = async (event) => {
  const headers = noStore(corsHeaders(event));

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: headers, body: "" };
  }

  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" }, headers);
  }

  const limit = rateLimit("verify-session:" + getClientIp(event), 40, 10 * 60 * 1000);
  if (!limit.ok) {
    return json(
      429,
      { error: "Too many requests" },
      Object.assign({}, headers, { "Retry-After": String(limit.retryAfter) })
    );
  }

  const query = event.queryStringParameters || {};
  const sessionId = String(query.session_id || "").trim();

  if (!SESSION_RE.test(sessionId)) {
    return json(400, { paid: false, error: "Invalid session" }, headers);
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const paid = Boolean(session) && session.payment_status === "paid";

    return json(
      200,
      {
        paid: paid,
        amount: paid ? (Number(session.amount_total) || 0) / 100 : 0,
        currency: String(session.currency || "usd").toUpperCase(),
      },
      headers
    );
  } catch (error) {
    console.error("verify-session error:", error.message);
    return json(404, { paid: false }, headers);
  }
};
