/* Media upload + delivery for the CMS.
   Files are stored in Netlify Blobs and served back from this function. */
const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");
const {
  HttpError,
  corsHeaders,
  json,
  isAdmin,
  getClientIp,
  rateLimit,
  readJson,
} = require("./lib/security");

/* Netlify caps a function request body at ~6 MB, and base64 adds ~33 %.
   3.5 MB of binary data stays safely under that limit. */
const MAX_DECODED_BYTES = 3.5 * 1024 * 1024;

const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const KEY_RE = /^m\/[A-Za-z0-9_-]{16,80}\.[a-z0-9]{2,5}$/;

function store() {
  return getStore({
    name: "media",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  });
}

function mediaUrl(key) {
  return "/.netlify/functions/media?key=" + encodeURIComponent(key);
}

exports.handler = async (event) => {
  const headers = corsHeaders(event);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: headers, body: "" };
  }

  /* 📥 GET → serve a stored file (public, immutable) */
  if (event.httpMethod === "GET") {
    const query = event.queryStringParameters || {};
    const key = String(query.key || "").trim();

    if (!KEY_RE.test(key)) {
      return json(400, { error: "Invalid key" }, headers);
    }

    try {
      const data = await store().get(key, { type: "arrayBuffer" });
      if (!data) {
        return json(404, { error: "Not found" }, headers);
      }

      let contentType = "application/octet-stream";
      try {
        const meta = await store().getMetadata(key);
        if (meta && meta.metadata && meta.metadata.contentType) {
          contentType = meta.metadata.contentType;
        }
      } catch (error) {
        /* metadata is optional */
      }

      return {
        statusCode: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": "inline",
        },
        body: Buffer.from(data).toString("base64"),
        isBase64Encoded: true,
      };
    } catch (error) {
      console.error("media GET error:", error);
      return json(500, { error: "Unable to load file" }, headers);
    }
  }

  /* 📤 POST → admin upload */
  if (event.httpMethod === "POST") {
    const limit = rateLimit("media-upload:" + getClientIp(event), 60, 10 * 60 * 1000);
    if (!limit.ok) {
      return json(
        429,
        { error: "Too many uploads. Please wait a few minutes." },
        Object.assign({}, headers, { "Retry-After": String(limit.retryAfter) })
      );
    }

    if (!isAdmin(event)) {
      return json(401, { error: "Unauthorized" }, headers);
    }

    try {
      const body = readJson(event, 5 * 1024 * 1024);
      const type = String(body.type || "").toLowerCase();
      const extension = ALLOWED_TYPES[type];

      if (!extension) {
        throw new HttpError(400, "Unsupported file type (JPG, PNG, WEBP, GIF, MP4, WEBM only)");
      }

      const raw = String(body.data || "");
      if (!raw) throw new HttpError(400, "Missing file data");

      const buffer = Buffer.from(raw, "base64");
      if (!buffer.length) throw new HttpError(400, "Empty file");
      if (buffer.length > MAX_DECODED_BYTES) {
        throw new HttpError(413, "File too large — max 3.5 MB");
      }

      const hash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 40);
      const key = "m/" + hash + "." + extension;

      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );
      await store().set(key, arrayBuffer, { metadata: { contentType: type } });

      return json(200, { url: mediaUrl(key), type: type }, headers);
    } catch (error) {
      if (error instanceof HttpError) {
        return json(error.status, { error: error.message }, headers);
      }
      console.error("media POST error:", error);
      return json(400, { error: "Upload failed" }, headers);
    }
  }

  return json(405, { error: "Method Not Allowed" }, headers);
};
