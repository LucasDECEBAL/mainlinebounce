const { getStore } = require("@netlify/blobs");

const STORE_NAME = "bookings";
const KEY = "bookings.json";

function store() {
  return getStore({
    name: STORE_NAME,
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  });
}

function clean(value, max) {
  if (value === null || value === undefined) return "";
  return String(value).slice(0, max);
}

function newId() {
  return (
    "BK-" +
    Date.now().toString(36).toUpperCase() +
    "-" +
    Math.random().toString(36).slice(2, 6).toUpperCase()
  );
}

async function getBookings() {
  const list = await store().get(KEY, { type: "json" });
  return Array.isArray(list) ? list : [];
}

async function recordBooking(input) {
  const list = await getBookings();

  const sessionId = clean(input.stripeSessionId, 100);
  if (sessionId) {
    const existing = list.find((b) => b.stripeSessionId === sessionId);
    if (existing) return existing;
  }

  const booking = {
    id: newId(),
    createdAt: new Date().toISOString(),
    eventDate: clean(input.date, 20),
    name: clean(input.name, 100),
    email: clean(input.email, 150),
    phone: clean(input.phone, 40),
    address: clean(input.address, 200),
    location: clean(input.location, 100),
    guests: clean(input.guests, 20),
    comments: clean(input.comments, 500),
    items: clean(input.items, 1000),
    total: Math.round((Number(input.total) || 0) * 100) / 100,
    payment: input.payment === "paid" ? "paid" : "pay_on_site",
    stripeSessionId: sessionId,
  };

  list.push(booking);
  await store().set(KEY, JSON.stringify(list));

  return booking;
}

async function deleteBooking(id) {
  const list = await getBookings();
  const next = list.filter((b) => b.id !== id);
  await store().set(KEY, JSON.stringify(next));
  return next;
}

module.exports = { getBookings, recordBooking, deleteBooking };
