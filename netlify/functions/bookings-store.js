const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");

const STORE_NAME = "bookings";
const KEY = "bookings.json";

function store() {
  return getStore({
    name: STORE_NAME,
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  });
}

function cleanLine(value, max) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, max);
}

function cleanMulti(value, max) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\r/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .slice(0, max);
}

function cleanTotal(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(1000000, Math.round(n * 100) / 100);
}

function newId() {
  return "BK-" + crypto.randomUUID().toUpperCase();
}

async function getBookings() {
  const list = await store().get(KEY, { type: "json" });
  return Array.isArray(list) ? list : [];
}

async function recordBooking(input) {
  const list = await getBookings();

  const sessionId = cleanLine(input.stripeSessionId, 100);
  if (sessionId) {
    const existing = list.find((b) => b.stripeSessionId === sessionId);
    if (existing) return existing;
  }

  const booking = {
    id: newId(),
    createdAt:
      input.createdAt && !isNaN(Date.parse(input.createdAt))
        ? new Date(input.createdAt).toISOString()
        : new Date().toISOString(),
    eventDate: cleanLine(input.date, 20),
    name: cleanLine(input.name, 100),
    email: cleanLine(input.email, 150),
    phone: cleanLine(input.phone, 40),
    address: cleanLine(input.address, 200),
    location: cleanLine(input.location, 100),
    country: cleanLine(input.country, 60),
    guests: cleanLine(input.guests, 20),
    comments: cleanMulti(input.comments, 500),
    items: cleanMulti(input.items, 1000),
    total: cleanTotal(input.total),
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

async function updateBooking(id, patch) {
  const list = await getBookings();
  const index = list.findIndex((b) => b.id === id);
  if (index === -1) return null;

  const current = list[index];
  const pickLine = (value, max, fallback) =>
    value === undefined ? fallback : cleanLine(value, max);
  const pickMulti = (value, max, fallback) =>
    value === undefined ? fallback : cleanMulti(value, max);

  const updated = {
    ...current,
    createdAt:
      patch.createdAt && !isNaN(Date.parse(patch.createdAt))
        ? new Date(patch.createdAt).toISOString()
        : current.createdAt,
    eventDate: pickLine(patch.eventDate, 20, current.eventDate),
    name: pickLine(patch.name, 100, current.name),
    email: pickLine(patch.email, 150, current.email),
    phone: pickLine(patch.phone, 40, current.phone),
    address: pickLine(patch.address, 200, current.address),
    location: pickLine(patch.location, 100, current.location),
    guests: pickLine(patch.guests, 20, current.guests),
    items: pickMulti(patch.items, 1000, current.items),
    comments: pickMulti(patch.comments, 500, current.comments),
    total: patch.total === undefined ? current.total : cleanTotal(patch.total),
    payment:
      patch.payment === "paid" || patch.payment === "pay_on_site"
        ? patch.payment
        : current.payment,
  };

  list[index] = updated;
  await store().set(KEY, JSON.stringify(list));
  return updated;
}

module.exports = {
  getBookings,
  recordBooking,
  deleteBooking,
  updateBooking,
};
