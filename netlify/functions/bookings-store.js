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
    createdAt:
      input.createdAt && !isNaN(Date.parse(input.createdAt))
        ? new Date(input.createdAt).toISOString()
        : new Date().toISOString(),
    eventDate: clean(input.date, 20),
    name: clean(input.name, 100),
    email: clean(input.email, 150),
    phone: clean(input.phone, 40),
    address: clean(input.address, 200),
    location: clean(input.location, 100),
    country: clean(input.country, 60),
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

async function updateBooking(id, patch) {
  const list = await getBookings();
  const index = list.findIndex((b) => b.id === id);
  if (index === -1) return null;

  const current = list[index];
  const pick = (value, max, fallback) =>
    value === undefined ? fallback : clean(value, max);

  const updated = {
    ...current,
    createdAt:
      patch.createdAt && !isNaN(Date.parse(patch.createdAt))
        ? new Date(patch.createdAt).toISOString()
        : current.createdAt,
    eventDate: pick(patch.eventDate, 20, current.eventDate),
    name: pick(patch.name, 100, current.name),
    email: pick(patch.email, 150, current.email),
    phone: pick(patch.phone, 40, current.phone),
    address: pick(patch.address, 200, current.address),
    location: pick(patch.location, 100, current.location),
    guests: pick(patch.guests, 20, current.guests),
    items: pick(patch.items, 1000, current.items),
    comments: pick(patch.comments, 500, current.comments),
    total: patch.total === undefined
      ? current.total
      : Math.round((Number(patch.total) || 0) * 100) / 100,
    payment:
      patch.payment === "paid" || patch.payment === "pay_on_site"
        ? patch.payment
        : current.payment,
  };

  list[index] = updated;
  await store().set(KEY, JSON.stringify(list));
  return updated;
}

/* ============================================
   CLIENTS HISTORIQUES (import unique depuis Stripe)
   ============================================ */
const HISTORICAL_BOOKINGS = [
  { name: "Steven Rizzo", email: "stevenrizzo@gmail.com", country: "United States", createdAt: "2026-10-02T10:41:00", total: 500 },
  { name: "John Ramirez", email: "jframirez@gmail.com", country: "United States", createdAt: "2026-09-22T12:36:00", total: 250 },
  { name: "Alexandra Bonnem", email: "amshutt13@gmail.com", country: "United States", createdAt: "2026-09-02T12:28:00", total: 250 },
  { name: "Carmine Baroni", email: "carminebaroni@gmail.com", country: "United States", createdAt: "2026-08-27T18:16:00", total: 425 },
  { name: "Maureen Moore", email: "maureenmoore777@gmail.com", country: "United States", createdAt: "2026-08-26T21:12:00", total: 500 },
  { name: "Maria Fordham", email: "maria.mckenna14@gmail.com", country: "United States", createdAt: "2026-08-21T14:26:00", total: 300 },
  { name: "Decebal-Danger Lucas", email: "lucasdecebaldanger09@gmail.com", country: "France", createdAt: "2026-07-29T11:12:00", total: 4 },
  { name: "Stephanie Slaski", email: "stephanieslaski@gmail.com", country: "United States", createdAt: "2026-07-24T10:50:00", total: 312 },
  { name: "Jonathan Woy", email: "jonathanwoy@gmail.com", country: "United States", createdAt: "2026-07-10T21:03:00", total: 300 },
  { name: "Ammarah Hussain", email: "Ammarah.hsn@gmail.com", country: "United States", createdAt: "2026-06-30T13:08:00", total: 250 },
  { name: "Allison Harkins", email: "allison.harkins1981@gmail.com", country: "United States", createdAt: "2026-06-25T21:26:00", total: 250 },
  { name: "John Friel", email: "johnfriel3@gmail.com", country: "United States", createdAt: "2026-06-25T10:33:00", total: 78 },
  { name: "Carline Leblanc", email: "carlineleblanc@gmail.com", country: "United States", createdAt: "2026-06-24T19:34:00", total: 2 },
];

const SEED_FLAG = "historical-import-v1";

/* Insère les clients historiques une seule fois (anti-doublon par email + flag) */
async function ensureHistoricalBookings() {
  const s = store();

  const alreadySeeded = await s.get(SEED_FLAG, { type: "json" });
  if (alreadySeeded) return { added: 0 };

  const list = await getBookings();
  const knownEmails = new Set(
    list.map((b) => String(b.email || "").toLowerCase()).filter(Boolean)
  );

  let added = 0;
  HISTORICAL_BOOKINGS.forEach((c, i) => {
    const emailKey = c.email.toLowerCase();
    if (knownEmails.has(emailKey)) return;
    knownEmails.add(emailKey);

    list.push({
      id: "IMP-" + String(i + 1).padStart(3, "0"),
      createdAt: c.createdAt,
      eventDate: "",
      name: c.name,
      email: c.email,
      phone: "",
      address: "",
      location: "",
      country: c.country,
      guests: "",
      comments: "",
      items: "",
      total: c.total,
      payment: "paid",
      source: "stripe-import",
      stripeSessionId: "",
    });
    added += 1;
  });

  if (added > 0) {
    await s.set(KEY, JSON.stringify(list));
  }
  await s.set(SEED_FLAG, JSON.stringify({ seededAt: new Date().toISOString(), added }));

  return { added };
}

module.exports = {
  getBookings,
  recordBooking,
  deleteBooking,
  updateBooking,
  ensureHistoricalBookings,
};
