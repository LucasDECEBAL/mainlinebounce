/* Server-side catalog + cart validation shared by checkout and notifications.
   The browser never decides product names or prices. */
const { getStore } = require("@netlify/blobs");
const { HttpError, line } = require("./security");
const DEFAULT_CONTENT = require("../site-content").DEFAULT_CONTENT;

const MAX_ITEMS = 30;
const MAX_QTY = 100;

function storeFor(name) {
  return getStore({
    name,
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  });
}

async function loadCatalog() {
  const stored = await storeFor("site-content").get("content.json", { type: "json" });
  const products =
    stored && Array.isArray(stored.products) && stored.products.length
      ? stored.products
      : DEFAULT_CONTENT.products;

  const map = new Map();
  products.forEach((product) => {
    if (product && typeof product.id === "string") {
      map.set(product.id, product);
    }
  });
  return map;
}

function normalizeCart(rawCart, catalog) {
  if (!Array.isArray(rawCart) || !rawCart.length) {
    throw new HttpError(400, "Your cart is empty");
  }
  if (rawCart.length > MAX_ITEMS) {
    throw new HttpError(400, "Too many items in the cart");
  }

  const merged = new Map();

  rawCart.forEach((item) => {
    if (!item || typeof item !== "object") {
      throw new HttpError(400, "Invalid cart item");
    }

    const id = line(item.id, 60);
    const product = catalog.get(id);
    if (!product) {
      throw new HttpError(400, "Your cart contains an item that is no longer available");
    }
    if (product.available === false) {
      throw new HttpError(409, "One of the selected items is currently unavailable");
    }

    const price = Number(product.price);
    if (!Number.isFinite(price) || price <= 0) {
      throw new HttpError(409, "One of the selected items must be booked by phone");
    }

    const rawQty = item.qty !== undefined ? item.qty : item.quantity;
    const quantity = Math.min(MAX_QTY, Math.max(1, parseInt(rawQty, 10) || 1));
    const previous = merged.get(id);
    merged.set(id, {
      product,
      price,
      quantity: Math.min(MAX_QTY, (previous ? previous.quantity : 0) + quantity),
    });
  });

  return Array.from(merged.values());
}

async function assertDateAvailable(date, itemIds) {
  if (!date) return;

  const blocked = (await storeFor("blocked-dates").get("data", { type: "json" })) || {};
  const isBlocked = (list) => Array.isArray(list) && list.indexOf(date) !== -1;

  const blockedDate =
    isBlocked(blocked.ALL) ||
    itemIds.some((id) => isBlocked(blocked[id]));

  if (blockedDate) {
    throw new HttpError(409, "That date is no longer available. Please pick another one.");
  }
}

module.exports = {
  MAX_ITEMS,
  MAX_QTY,
  storeFor,
  loadCatalog,
  normalizeCart,
  assertDateAvailable,
};
