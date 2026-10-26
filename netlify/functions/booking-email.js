const nodemailer = require("nodemailer");
const { escapeHtml, line, text } = require("./lib/security");

const DEFAULT_RECIPIENTS = [
  "garciajonathan916.jg@gmail.com",
  "carlineleblanc@gmail.com",
];

const EMAIL_RE = /^[^\s@<>"'`]+@[^\s@<>"'`]+\.[A-Za-z]{2,}$/;

function buildCartText(cart = []) {
  if (!Array.isArray(cart)) return "";
  return cart
    .map((item) => {
      const name = line(item && item.name, 120);
      const price = Number(item && item.price) || 0;
      const quantity = Math.max(1, parseInt(item && (item.quantity || item.qty), 10) || 1);
      return `• ${name} x${quantity} = $${(price * quantity).toFixed(2)}`;
    })
    .join("\n");
}

function buildEmailContent({ title, customer = {}, cart = [], itemsText = "", total = "0.00", paidLabel = "" }) {
  const safe = {
    name: line(customer.name, 100),
    email: line(customer.email, 150),
    phone: line(customer.phone, 40),
    address: line(customer.address, 200),
    date: line(customer.date || customer.eventDate, 20),
    location: line(customer.location || customer.where, 100),
    guests: line(customer.guests, 20),
    comments: text(customer.comments, 500),
  };

  const subject = line(title, 120) || "New booking";
  const itemsSummary = text(itemsText || buildCartText(cart), 4000) || "No items";
  const safeTotal = Number(total);
  const totalLabel = Number.isFinite(safeTotal) ? safeTotal.toFixed(2) : "0.00";
  const safePaid = line(paidLabel, 40);

  const textBody = [
    subject,
    "",
    `Customer: ${safe.name || "N/A"}`,
    `Email: ${safe.email || "N/A"}`,
    `Phone: ${safe.phone || "N/A"}`,
    `Address: ${safe.address || "N/A"}`,
    `Event Date: ${safe.date || "N/A"}`,
    `Location: ${safe.location || "N/A"}`,
    `Guests: ${safe.guests || "N/A"}`,
    `Comments: ${safe.comments || "No comments"}`,
    "",
    "Items Ordered:",
    itemsSummary,
    "",
    `Total: $${totalLabel}${safePaid ? ` ${safePaid}` : ""}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#222;line-height:1.5">
      <h2>${escapeHtml(subject)}</h2>
      <p><strong>Customer:</strong> ${escapeHtml(safe.name || "N/A")}</p>
      <p><strong>Email:</strong> ${escapeHtml(safe.email || "N/A")}</p>
      <p><strong>Phone:</strong> ${escapeHtml(safe.phone || "N/A")}</p>
      <p><strong>Address:</strong> ${escapeHtml(safe.address || "N/A")}</p>
      <p><strong>Event Date:</strong> ${escapeHtml(safe.date || "N/A")}</p>
      <p><strong>Location:</strong> ${escapeHtml(safe.location || "N/A")}</p>
      <p><strong>Guests:</strong> ${escapeHtml(safe.guests || "N/A")}</p>
      <p><strong>Comments:</strong> ${escapeHtml(safe.comments || "No comments")}</p>
      <p><strong>Items Ordered:</strong><br>${escapeHtml(itemsSummary).replace(/\n/g, "<br>")}</p>
      <p><strong>Total:</strong> $${escapeHtml(totalLabel)}${safePaid ? " " + escapeHtml(safePaid) : ""}</p>
    </div>
  `;

  return { subject, text: textBody, html, replyTo: EMAIL_RE.test(safe.email) ? safe.email : undefined };
}

function getRecipients() {
  return (process.env.BOOKING_NOTIFICATION_EMAILS || DEFAULT_RECIPIENTS.join(","))
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => EMAIL_RE.test(value))
    .filter((value, index, list) => list.indexOf(value) === index);
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP_HOST, SMTP_USER, or SMTP_PASS is not configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendBookingEmail({ title, customer, cart, itemsText = "", total, paidLabel = "" }) {
  const transporter = createTransport();
  const recipients = getRecipients();
  if (!recipients.length) {
    throw new Error("No valid notification recipients configured");
  }

  const fromEmail = process.env.SMTP_FROM || `Main Line Bounce <${process.env.SMTP_USER}>`;
  const { subject, text, html, replyTo } = buildEmailContent({
    title,
    customer,
    cart,
    itemsText,
    total,
    paidLabel,
  });

  const info = await transporter.sendMail({
    from: fromEmail,
    to: recipients,
    subject,
    text,
    html,
    replyTo,
  });

  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
}

module.exports = { sendBookingEmail, buildEmailContent };
