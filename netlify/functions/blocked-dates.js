const { getStore } = require("@netlify/blobs");
const {
  HttpError,
  corsHeaders,
  json,
  noStore,
  isAdmin,
  readJson,
  line,
} = require("./lib/security");

const ITEM_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,59}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DATES_PER_ITEM = 400;
const MAX_ITEMS = 200;

function store() {
  return getStore({
    name: "blocked-dates",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  });
}

function isValidDate(value) {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

exports.handler = async (event) => {
  const headers = noStore(corsHeaders(event));

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod === "GET") {
    try {
      const data = (await store().get("data", { type: "json" })) || {};
      return json(200, data, headers);
    } catch (error) {
      console.error("blocked-dates GET error:", error);
      return json(500, { error: "Unable to load blocked dates" }, headers);
    }
  }

  if (event.httpMethod === "POST") {
    if (!isAdmin(event)) {
      return json(401, { error: "Unauthorized" }, headers);
    }

    try {
      const body = readJson(event, 4 * 1024);
      const item = line(body.item, 60);
      const date = line(body.date, 10);
      const action = body.action === "unblock" ? "unblock" : body.action === "block" ? "block" : "";

      if (item !== "ALL" && !ITEM_RE.test(item)) {
        throw new HttpError(400, "Invalid item");
      }
      if (!isValidDate(date)) {
        throw new HttpError(400, "Invalid date");
      }
      if (!action) {
        throw new HttpError(400, "Invalid action");
      }

      const data = (await store().get("data", { type: "json" })) || {};
      const safe = {};

      Object.keys(data).forEach((key) => {
        if ((key === "ALL" || ITEM_RE.test(key)) && Array.isArray(data[key])) {
          safe[key] = data[key].filter((d) => typeof d === "string" && isValidDate(d));
        }
      });

      if (!Array.isArray(safe[item])) safe[item] = [];

      if (action === "block") {
        if (safe[item].indexOf(date) === -1) {
          if (safe[item].length >= MAX_DATES_PER_ITEM) {
            throw new HttpError(400, "Too many blocked dates for this item");
          }
          safe[item].push(date);
        }
      } else {
        safe[item] = safe[item].filter((d) => d !== date);
        if (!safe[item].length) delete safe[item];
      }

      if (Object.keys(safe).length > MAX_ITEMS) {
        throw new HttpError(400, "Too many items with blocked dates");
      }

      await store().set("data", JSON.stringify(safe));
      return json(200, { success: true, data: safe }, headers);
    } catch (error) {
      if (error instanceof HttpError) {
        return json(error.status, { error: error.message }, headers);
      }
      console.error("blocked-dates POST error:", error);
      return json(500, { error: "Unable to update blocked dates" }, headers);
    }
  }

  return json(405, { error: "Method Not Allowed" }, headers);
};
