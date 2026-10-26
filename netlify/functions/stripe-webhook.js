// Receives Stripe payment confirmations (signature verified) and
// records the booking + sends notifications.
const { sendBookingEmail } = require("./booking-email");
const { recordBooking } = require("./bookings-store");
const { text, line, email } = require("./lib/security");

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

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
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return { statusCode: 500, body: "Webhook not configured" };
  }

  const signature = event.headers["stripe-signature"];
  if (!signature) {
    return { statusCode: 400, body: "Missing signature" };
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : String(event.body || "");

  let stripeEvent;
  try {
    stripeEvent = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Invalid webhook signature:", error.message);
    return { statusCode: 400, body: "Invalid signature" };
  }

  if (stripeEvent.type !== "checkout.session.completed") {
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }

  const session = stripeEvent.data.object;
  if (!session || session.payment_status !== "paid") {
    // Delayed payment methods can complete later; do not record until paid.
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }

  const m = session.metadata || {};
  const total = (Number(session.amount_total) / 100).toFixed(2);

  const customer = {
    name: line(m.name, 100),
    email: email(m.email) || email(session.customer_details && session.customer_details.email) || email(session.customer_email),
    phone: line(m.phone, 40),
    address: line(m.address, 200),
    date: line(m.date, 10),
    location: line(m.location, 100),
    guests: line(m.guests, 20),
    comments: text(m.comments, 400),
  };

  const items = line(m.items, 450);

  try {
    await recordBooking({
      date: customer.date,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      location: customer.location,
      guests: customer.guests,
      comments: customer.comments,
      items,
      total,
      payment: "paid",
      stripeSessionId: session.id,
    });
  } catch (error) {
    console.error("Booking save failed:", error);
  }

  if (DISCORD_WEBHOOK) {
    const discordMessage = {
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: "New Booking - PAID ONLINE",
          color: 5763719,
          fields: [
            { name: "Customer Name", value: customer.name || "N/A", inline: true },
            { name: "Email", value: customer.email || "N/A", inline: true },
            { name: "Address", value: customer.address || "N/A", inline: false },
            { name: "Phone", value: customer.phone || "N/A", inline: true },
            { name: "Event Date", value: customer.date || "N/A", inline: true },
            { name: "Event Location", value: customer.location || "N/A", inline: false },
            { name: "Number of Guests", value: customer.guests || "N/A", inline: true },
            { name: "Comments", value: customer.comments || "No comments", inline: false },
            { name: "Items Ordered", value: items || "No items", inline: false },
            { name: "Total Paid", value: "$" + total + " (PAID)", inline: true },
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
      if (!response.ok) console.error("Discord notification failed:", response.status);
    } catch (error) {
      console.error("Discord notification error:", error);
    }
  }

  try {
    await sendBookingEmail({
      title: "New Booking - PAID ONLINE",
      customer,
      itemsText: items || "No items",
      total,
      paidLabel: "PAID",
    });
  } catch (error) {
    console.error("Email notification failed:", error);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
