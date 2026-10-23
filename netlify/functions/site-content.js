const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");

/* ============================================
   CONTENU PAR DÉFAUT (si rien n'a été sauvegardé)
   ============================================ */
const DEFAULT_CONTENT = {
  version: 1,
  banners: {
    home: {
      enabled: true,
      text: "❄️ WINTER/FALL SPECIAL ❄️",
      title: "Pre-book an inflatable package before March 1st — Get 25% OFF",
      sub: "Bad weather? We reschedule or refund.",
      cta: "Shop Now",
      link: "inflatables.html",
    },
    inflatables: {
      enabled: true,
      text: "🎉 BOOK EARLY & SAVE",
      title: "Reserve your date before March 1st — 25% OFF packages",
      sub: "Bad weather? We reschedule or refund.",
      cta: "Call now",
      link: "tel:2674053125",
    },
    addons: {
      enabled: true,
      text: "🛠️ COMPLETE YOUR PARTY",
      title: "Tents, tables, chairs, misting fans & more",
      sub: "Add them to any rental in one click.",
      cta: "Call us",
      link: "tel:2674053125",
    },
    youngAdult: {
      enabled: true,
      text: "🎧 SILENT DISCO",
      title: "Dance floors + wireless headsets for teens & young adults",
      sub: "10 to 50 headsets — everyone dances to their own beat.",
      cta: "See packages",
      link: "silent-disco.html",
    },
  },
  addons: [
    { id: "misting-fan", name: "Misting Fan", price: 50, image: "images/placeholder.svg", desc: "Cool mist for hot days." },
    { id: "generator", name: "Generator", price: 100, image: "images/placeholder.svg", desc: "Power for inflatables and sound." },
    { id: "tent", name: "Tent", price: 75, image: "images/canopy.png", desc: "Shade and shelter." },
    { id: "white-folding-tables", name: "White Folding Tables", price: 15, image: "images/tables.png", desc: "For food, gifts and seating." },
    { id: "white-folding-chairs", name: "White Folding Chairs", price: 2, image: "images/chairs.png", desc: "Clean seating." },
    { id: "foam-machine", name: "Foam Machine", price: 299, image: "images/foam-machine.svg", desc: "Epic foam party." },
    { id: "popcorn-machine", name: "Popcorn Machine", price: null, image: "images/placeholder.svg", desc: "Call for price." },
  ],
  products: [
    {
      id: "combo-special-1",
      name: "Magic Castle + SuperHero Bundle",
      category: "kids",
      price: 500,
      oldPrice: 675,
      badge: "LIMITED TIME",
      shortDesc: "Two inflatables in one bundle — double the fun.",
      longDesc:
        "Get TWO amazing inflatables together! Combine our classic Magic Castle with the action-packed Super Hero Duo Combo. Double the fun, double the memories for your party!",
      dimension: "",
      image: "images/magic-castle-superhero-combo.png",
      position: 1,
      available: true,
      url: "combo-special-1.html",
      addons: ["misting-fan", "generator", "tent", "white-folding-tables", "white-folding-chairs", "foam-machine"],
    },
    {
      id: "combo-special-2",
      name: "Party Package",
      category: "corporate",
      price: 550,
      oldPrice: 850,
      badge: "LIMITED TIME",
      shortDesc: "Inflatable of your choice + tables, chairs, tent & mister.",
      longDesc:
        "The ultimate party solution! Choose Magic Castle or Super Hero Duo Combo and get it bundled with 3 tables, 24 chairs, 1 tent and a mister water system. Everything you need for an unforgettable celebration.",
      dimension: "",
      image: "images/magic-castle-or-superhero-combo.png",
      position: 1,
      available: true,
      url: "combo-special-2.html",
      addons: ["misting-fan", "generator", "tent", "white-folding-tables", "white-folding-chairs", "foam-machine"],
    },
    {
      id: "dolphin-slide",
      name: "Water Slide",
      category: "teen",
      price: 399,
      oldPrice: null,
      badge: "",
      shortDesc: "Cool off with our water slide — a summer favorite.",
      longDesc:
        "Cool off with our water slide. Perfect for summer events, teen birthdays and backyard parties.",
      dimension: "28L × 13W × 15H",
      image: "images/dolphin-slide.png",
      position: 1,
      available: true,
      url: "",
      addons: ["misting-fan", "generator", "tent", "white-folding-tables", "white-folding-chairs", "foam-machine"],
    },
    {
      id: "magic-castle",
      name: "Magic Castle",
      category: "kids",
      price: 299,
      oldPrice: null,
      badge: "",
      shortDesc: "A classic bounce house with a magical castle design.",
      longDesc:
        "A classic bounce house with a magical castle design. Perfect for birthday parties and backyard events for kids of all ages.",
      dimension: "13 × 13 ft",
      image: "images/magic-castle.png",
      position: 2,
      available: true,
      url: "",
      addons: ["misting-fan", "generator", "tent", "white-folding-tables", "white-folding-chairs", "foam-machine"],
    },
    {
      id: "superhero-combo",
      name: "Super Hero Duo Combo",
      category: "kids",
      price: 349,
      oldPrice: null,
      badge: "",
      shortDesc: "Action-packed bounce house with slide and climb features.",
      longDesc:
        "Action-packed superhero bounce house with slide and climb features. Perfect for kids and teens who love adventure and excitement!",
      dimension: "13 × 15 × 30 ft (L)",
      image: "images/superhero-combo.png",
      position: 3,
      available: true,
      url: "",
      addons: ["misting-fan", "generator", "tent", "white-folding-tables", "white-folding-chairs", "foam-machine"],
    },
    {
      id: "big-fun-xl",
      name: "Big & Fun XL",
      category: "kids",
      price: 325,
      oldPrice: null,
      badge: "",
      shortDesc: "Our biggest bounce house for non-stop fun.",
      longDesc: "Our biggest bounce house — tons of room for non-stop jumping fun at any party.",
      dimension: "",
      image: "images/big-fun-xl.png",
      position: 4,
      available: true,
      url: "",
      addons: ["misting-fan", "generator", "tent", "white-folding-tables", "white-folding-chairs", "foam-machine"],
    },
    {
      id: "slip-and-slide",
      name: "Slip and Slide",
      category: "teen",
      price: 425,
      oldPrice: null,
      badge: "",
      shortDesc: "The wetter, the better — a summer must-have.",
      longDesc: "The wetter, the better! A giant slip and slide that keeps kids and teens cool all afternoon.",
      dimension: "",
      image: "images/slip-and-slide.png",
      position: 2,
      available: true,
      url: "",
      addons: ["misting-fan", "generator", "tent", "white-folding-tables", "white-folding-chairs", "foam-machine"],
    },
    {
      id: "tropical-paradise",
      name: "Tropical Paradise",
      category: "teen",
      price: 425,
      oldPrice: null,
      badge: "",
      shortDesc: "A tropical-themed inflatable for an island vibe.",
      longDesc: "Bring the island vibe to your party with our Tropical Paradise inflatable.",
      dimension: "",
      image: "images/tropical-paradise.png",
      position: 3,
      available: true,
      url: "",
      addons: ["misting-fan", "generator", "tent", "white-folding-tables", "white-folding-chairs", "foam-machine"],
    },
  ],
};

const CATEGORIES = ["kids", "teen", "corporate"];
const BANNER_KEYS = ["home", "inflatables", "addons", "youngAdult"];

/* ============================================
   VALIDATION / NETTOYAGE
   ============================================ */
function cleanStr(value, max) {
  if (typeof value !== "string") return "";
  return value.slice(0, max);
}

function cleanPrice(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100000) return null;
  return Math.round(n * 100) / 100;
}

function cleanBanner(b) {
  return {
    enabled: Boolean(b && b.enabled),
    text: cleanStr(b && b.text, 80),
    title: cleanStr(b && b.title, 160),
    sub: cleanStr(b && b.sub, 160),
    cta: cleanStr(b && b.cta, 30),
    link: cleanStr(b && b.link, 300),
  };
}

function cleanAddon(a) {
  return {
    id: cleanStr(a && a.id, 60),
    name: cleanStr(a && a.name, 100),
    price: cleanPrice(a && a.price),
    image: cleanStr(a && a.image, 300) || "images/placeholder.svg",
    desc: cleanStr(a && a.desc, 200),
  };
}

function cleanProduct(p) {
  const price = cleanPrice(p && p.price);
  if (price === null) throw new Error("Prix invalide");
  const category = CATEGORIES.includes(p.category) ? p.category : "kids";

  let addons = Array.isArray(p.addons) ? p.addons : [];
  addons = addons
    .filter((id) => typeof id === "string")
    .map((id) => id.slice(0, 60))
    .slice(0, 6);

  return {
    id: cleanStr(p.id, 60) || "item-" + Date.now().toString(36),
    name: cleanStr(p.name, 100),
    category,
    price,
    oldPrice: cleanPrice(p.oldPrice),
    badge: cleanStr(p.badge, 30),
    shortDesc: cleanStr(p.shortDesc, 300),
    longDesc: cleanStr(p.longDesc, 3000),
    dimension: cleanStr(p.dimension, 60),
    image: cleanStr(p.image, 300) || "images/placeholder.svg",
    position: Math.min(99, Math.max(1, parseInt(p.position, 10) || 1)),
    available: p.available !== false,
    url: cleanStr(p.url, 300),
    addons,
  };
}

function cleanContent(raw) {
  const source = raw && typeof raw === "object" ? raw : {};

  const banners = {};
  BANNER_KEYS.forEach((key) => {
    banners[key] = cleanBanner(source.banners && source.banners[key]);
  });

  const addons = (Array.isArray(source.addons) ? source.addons : DEFAULT_CONTENT.addons)
    .slice(0, 30)
    .map(cleanAddon)
    .filter((a) => a.id && a.name);

  const products = (Array.isArray(source.products) ? source.products : [])
    .slice(0, 200)
    .map(cleanProduct)
    .filter((p) => p.name);

  return { version: 1, banners, addons, products };
}

/* ============================================
   HANDLER
   ============================================ */
exports.handler = async (event) => {
  const store = getStore({
    name: "site-content",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  });

  const allowedOrigins = [
    "https://mainlinebounce.com",
    "https://www.mainlinebounce.com",
    process.env.SITE_URL,
  ].filter(Boolean);
  const origin = event.headers.origin;
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const headers = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  /* 📖 GET → contenu public (lu par le site) */
  if (event.httpMethod === "GET") {
    const stored = await store.get("content.json", { type: "json" });
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stored || DEFAULT_CONTENT),
    };
  }

  /* ✍️ POST → admin uniquement */
  if (event.httpMethod === "POST") {
    const adminKey = event.headers["x-admin-key"];
    const expectedKey = process.env.ADMIN_KEY;

    let isValid = false;
    try {
      isValid = crypto.timingSafeEqual(
        Buffer.from(adminKey || ""),
        Buffer.from(expectedKey || "")
      );
    } catch (e) {
      isValid = false;
    }

    if (!isValid) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    // Vérification de la clé uniquement (login admin)
    if (event.queryStringParameters && event.queryStringParameters.verify) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    try {
      const raw = JSON.parse(event.body || "{}");
      const content = cleanContent(raw);

      if (content.products.length === 0 && Array.isArray(raw.products) && raw.products.length > 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Aucun article valide" }) };
      }

      await store.set("content.json", JSON.stringify(content));
      return { statusCode: 200, headers, body: JSON.stringify(content) };
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message || "Contenu invalide" }),
      };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
};
