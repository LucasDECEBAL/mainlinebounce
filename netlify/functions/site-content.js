const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");
const {
  HttpError,
  corsHeaders,
  json,
  noStore,
  isAdmin,
  getClientIp,
  rateLimit,
  readJson,
  text,
  safeUrl,
  safeImage,
} = require("./lib/security");

/* ============================================
   DEFAULT CONTENT (if nothing has been saved yet)
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

    /* ----- ADD-ONS PAGE ----- */
    {
      id: "misting-fan", name: "Misting Fan", page: "addons", category: "kids",
      price: 50, oldPrice: null, badge: "",
      shortDesc: "Cool mist for hot days — keep guests comfortable all party long.",
      longDesc: "Cool mist for hot days — keep guests comfortable all party long.",
      dimension: "", image: "images/placeholder.svg",
      position: 1, available: true, url: "", addons: [],
    },
    {
      id: "generator", name: "Generator", page: "addons", category: "kids",
      price: 100, oldPrice: null, badge: "",
      shortDesc: "Power for inflatables, lights and sound — wherever your event is.",
      longDesc: "Power for inflatables, lights and sound — wherever your event is.",
      dimension: "", image: "images/placeholder.svg",
      position: 2, available: true, url: "", addons: [],
    },
    {
      id: "tent", name: "Tent", page: "addons", category: "kids",
      price: 75, oldPrice: null, badge: "",
      shortDesc: "Shade and shelter for food, gifts and seating areas.",
      longDesc: "Shade and shelter for food, gifts and seating areas.",
      dimension: "", image: "images/canopy.png",
      position: 3, available: true, url: "", addons: [],
    },
    {
      id: "white-folding-tables", name: "White Folding Tables", page: "addons", category: "kids",
      price: 15, oldPrice: null, badge: "",
      shortDesc: "Perfect for food, gifts, and seating.",
      longDesc: "Perfect for food, gifts, and seating.",
      dimension: "", image: "images/tables.png",
      position: 4, available: true, url: "", addons: [],
    },
    {
      id: "white-folding-chairs", name: "White Folding Chairs", page: "addons", category: "kids",
      price: 2, oldPrice: null, badge: "",
      shortDesc: "Clean seating for parties and events.",
      longDesc: "Clean seating for parties and events.",
      dimension: "", image: "images/chairs.png",
      position: 5, available: true, url: "", addons: [],
    },
    {
      id: "foam-machine", name: "Foam Machine", page: "addons", category: "kids",
      price: 299, oldPrice: null, badge: "",
      shortDesc: "Turn any party into an epic foam party — kids and teens love it.",
      longDesc: "Turn any party into an epic foam party — kids and teens love it.",
      dimension: "", image: "images/foam-machine.svg",
      position: 6, available: true, url: "", addons: [],
    },
    {
      id: "popcorn-machine", name: "Popcorn Machine", page: "addons", category: "kids",
      price: null, oldPrice: null, badge: "",
      shortDesc: "Fresh popcorn all party long — a crowd favorite for every event.",
      longDesc: "Fresh popcorn all party long — a crowd favorite for every event.",
      dimension: "", image: "images/placeholder.svg",
      position: 7, available: true, url: "", addons: [],
    },

    /* ----- SILENT DISCO PAGE ----- */
    {
      id: "dance-floor", name: "Dance Floor Rental", page: "silent-disco", category: "teen",
      price: 200, oldPrice: null, badge: "",
      shortDesc: "20 × 20 ft dance floor — indoor or outdoor.",
      longDesc: "20 × 20 ft dance floor — indoor or outdoor.",
      dimension: "20 × 20 ft", image: "images/placeholder.svg",
      position: 1, available: true, url: "", addons: [],
    },
    {
      id: "silent-disco-10", name: "Silent Disco — 10 Headsets", page: "silent-disco", category: "teen",
      price: 399, oldPrice: null, badge: "",
      shortDesc: "Dance floor included + 10 wireless headsets.",
      longDesc: "Dance floor included + 10 wireless headsets.",
      dimension: "", image: "images/silent-disco.png",
      position: 2, available: true, url: "", addons: [],
    },
    {
      id: "silent-disco-30", name: "Silent Disco — 30 Headsets", page: "silent-disco", category: "teen",
      price: 549, oldPrice: null, badge: "",
      shortDesc: "Dance floor included + 30 wireless headsets.",
      longDesc: "Dance floor included + 30 wireless headsets.",
      dimension: "", image: "images/silent-disco.png",
      position: 3, available: true, url: "", addons: [],
    },
    {
      id: "silent-disco-50", name: "Silent Disco — 50 Headsets", page: "silent-disco", category: "teen",
      price: 649, oldPrice: null, badge: "",
      shortDesc: "Dance floor included + 50 wireless headsets.",
      longDesc: "Dance floor included + 50 wireless headsets.",
      dimension: "", image: "images/silent-disco.png",
      position: 4, available: true, url: "", addons: [],
    },

    /* ----- PHOTO BOOTHS PAGE ----- */
    {
      id: "photo-booth-rental", name: "Photo Booth Rental", page: "photo-booths", category: "teen",
      price: null, oldPrice: null, badge: "",
      shortDesc: "Photo booth with unlimited prints, fun props and a friendly attendant.",
      longDesc: "Make your event unforgettable with our photo booth rental. Includes unlimited prints, a wide selection of props and a friendly attendant. Perfect for birthdays, weddings, corporate events and more. Call us for a custom quote.",
      dimension: "", image: "images/photo-booths.webp",
      position: 1, available: true, url: "", addons: [],
    },
  ],
  packages: [
    {
      id: "silent-disco-package",
      name: "Silent Disco",
      page: "silent-disco",
      type: "choice",
      price: null,
      oldPrice: null,
      badge: "",
      shortDesc: "Dance floor included. Choose 10, 30 or 50 wireless headsets.",
      longDesc:
        "Perfect for teen parties, birthdays and corporate events, indoors or outdoors. Add a dance floor and up to 50 wireless headsets.",
      features: [
        "Choose 10, 30 or 50 wireless headsets",
        "Dance floor included",
        "Perfect for teen parties, birthdays and corporate events",
      ],
      image: "images/silent-disco.png",
      position: 2,
      available: true,
      hideItems: true,
      choices: [
        { productId: "silent-disco-10", quantity: 1 },
        { productId: "silent-disco-30", quantity: 1 },
        { productId: "silent-disco-50", quantity: 1 },
      ],
      items: [],
    },
    {
      id: "magic-castle-superhero-package",
      name: "Magic Castle + SuperHero Bundle",
      page: "inflatables",
      type: "bundle",
      price: 500,
      oldPrice: 675,
      badge: "LIMITED TIME",
      shortDesc: "Two inflatables in one bundle - double the fun.",
      longDesc:
        "Get TWO amazing inflatables together! Combine our classic Magic Castle with the action-packed Super Hero Duo Combo. Double the fun, double the memories for your party!",
      features: [
        "2 inflatables in one package",
        "Magic Castle + Super Hero Duo Combo included",
        "Perfect for larger events",
        "Save $175 compared to individual rentals",
        "Delivery available",
      ],
      image: "images/magic-castle-superhero-combo.png",
      position: 1,
      available: true,
      hideItems: false,
      choices: [],
      items: [
        { productId: "magic-castle", quantity: 1 },
        { productId: "superhero-combo", quantity: 1 },
      ],
    },
    {
      id: "party-package",
      name: "Party Package",
      page: "inflatables",
      type: "mixed",
      price: 550,
      oldPrice: 850,
      badge: "GRAND OPENING PRICE",
      shortDesc: "Your choice of inflatable + tables, chairs, tent & mister.",
      longDesc:
        "The ultimate party solution! Choose your favorite inflatable (Magic Castle OR Super Hero Duo Combo) and get it bundled with 3 tables, 24 chairs, 1 tent, and a mister water system. Everything you need for an unforgettable celebration!",
      features: [
        "Choose Magic Castle OR Super Hero Duo Combo",
        "3 tables included",
        "24 chairs included",
        "1 large tent included",
        "Misting Fan included",
        "Perfect for large events",
        "Save $300 on this package!",
      ],
      image: "images/magic-castle-or-superhero-combo.png",
      position: 1,
      available: true,
      hideItems: false,
      choices: [
        { productId: "magic-castle", quantity: 1 },
        { productId: "superhero-combo", quantity: 1 },
      ],
      items: [
        { productId: "white-folding-tables", quantity: 3 },
        { productId: "white-folding-chairs", quantity: 24 },
        { productId: "tent", quantity: 1 },
        { productId: "misting-fan", quantity: 1 },
      ],
    },
  ],  faq: [
    {
      id: "booking-advance",
      question: "How far in advance should I book?",
      answer:
        "We recommend booking as early as possible, especially for weekends and summer months. Popular dates fill up fast — a 2–3 week advance notice is ideal, but we always try to accommodate last-minute requests when available.",
      position: 1,
    },
    {
      id: "delivery-areas",
      question: "What areas do you deliver to?",
      answer:
        "We proudly serve the Main Line area and surrounding communities in the Greater Philadelphia region. Please call us at (267) 405-3125 to confirm delivery availability for your specific location.",
      position: 2,
    },
    {
      id: "rain-policy",
      question: "What happens if it rains on my event day?",
      answer:
        "Safety is our top priority. In case of heavy rain, strong winds, or severe weather, we will work with you to reschedule your rental at no extra charge. Light drizzle may be fine for non-water inflatables — just give us a call and we'll advise you.",
      position: 3,
    },
    {
      id: "payment-methods",
      question: "What payment methods do you accept?",
      answer:
        "We accept cash, Zelle, Venmo, and major credit/debit cards. A deposit is required at the time of booking to secure your date. The remaining balance is due on the day of your event before setup.",
      position: 4,
    },
    {
      id: "rental-period",
      question: "How long is the rental period?",
      answer:
        "Our standard rental includes a full-day use (typically up to 6–8 hours). We drop off and pick up on the same day. Extended rental periods may be available — contact us for custom pricing.",
      position: 5,
    },
    {
      id: "setup-requirements",
      question: "Do I need to provide anything for setup?",
      answer:
        "You will need a flat, clear outdoor area large enough for the inflatable, access to a standard electrical outlet (for the blower), and a water source nearby for water slides. We handle everything else — delivery, setup, and takedown!",
      position: 6,
    },
    {
      id: "clean-safe",
      question: "Are your inflatables clean and safe?",
      answer:
        "Absolutely! Every inflatable is thoroughly cleaned and sanitized after each use. All our equipment is commercial-grade and regularly inspected to ensure the highest safety standards for your children and guests.",
      position: 7,
    },
    {
      id: "cancel-reschedule",
      question: "Can I cancel or reschedule my booking?",
      answer:
        "Yes! We understand that plans change. Please notify us at least 48 hours in advance to reschedule at no extra charge. Cancellations made less than 48 hours before the event may be subject to a partial deposit forfeiture. Weather-related cancellations are always free to reschedule.",
      position: 8,
    },
  ],
};

const CATEGORIES = ["kids", "teen", "corporate"];
const PAGES = ["inflatables", "addons", "silent-disco", "photo-booths"];
const LEGACY_PRODUCT_IDS = new Set(["combo-special-1", "combo-special-2"]);
const PACKAGES_VERSION = 2;
const PACKAGE_MIGRATION_IDS = [
  "silent-disco-package",
  "magic-castle-superhero-package",
  "party-package",
];
const BANNER_KEYS = ["home", "inflatables", "addons", "youngAdult"];

/* ============================================
   VALIDATION / SANITIZATION
   ============================================ */
function cleanStr(value, max) {
  return text(value, max);
}

const RESERVED_IDS = ["__proto__", "prototype", "constructor"];

function cleanId(value) {
  const id = cleanStr(value, 60).trim();
  if (!id || RESERVED_IDS.indexOf(id) !== -1) return "";
  return id;
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
    link: safeUrl(b && b.link),
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

function cleanProduct(input) {
  const p = input && typeof input === "object" ? input : {};
  const page = PAGES.includes(p.page) ? p.page : "inflatables";
  const category = CATEGORIES.includes(p.category) ? p.category : "kids";

  const priceProvided = p.price !== null && p.price !== undefined && p.price !== "";
  let price = null;
  if (priceProvided) {
    price = cleanPrice(p.price);
    if (price === null) throw new Error("Invalid price");
  }

  let addons = Array.isArray(p.addons) ? p.addons : [];
  addons = addons
    .map((id) => cleanId(id))
    .filter(Boolean)
    .slice(0, 6);

  return {
    id: cleanId(p.id) || "item-" + crypto.randomBytes(4).toString("hex"),
    name: cleanStr(p.name, 100),
    page,
    category,
    price,
    oldPrice: cleanPrice(p.oldPrice),
    badge: cleanStr(p.badge, 30),
    shortDesc: cleanStr(p.shortDesc, 300),
    longDesc: cleanStr(p.longDesc, 3000),
    dimension: cleanStr(p.dimension, 60),
    image: safeImage(p.image) || "images/placeholder.svg",
    position: Math.min(99, Math.max(1, parseInt(p.position, 10) || 1)),
    available: p.available !== false,
    url: safeUrl(p.url),
    addons,
  };
}

function cleanFaqItem(f) {
  return {
    id: cleanStr(f && f.id, 60) || "faq-" + Date.now().toString(36),
    question: cleanStr(f && f.question, 300),
    answer: cleanStr(f && f.answer, 3000),
    position: Math.min(99, Math.max(1, parseInt(f && f.position, 10) || 1)),
  };
}

function cleanPackageItems(source, productIds, allowQuantity) {
  const seen = new Set();
  return (Array.isArray(source) ? source : [])
    .slice(0, 30)
    .map((item) => {
      const productId = cleanId(item && item.productId);
      if (!productId || seen.has(productId)) return null;
      if (productIds && !productIds.has(productId)) return null;
      seen.add(productId);
      return {
        productId,
        quantity: allowQuantity
          ? Math.min(100, Math.max(1, parseInt(item && item.quantity, 10) || 1))
          : 1,
      };
    })
    .filter(Boolean);
}

function cleanPackage(input, productIds) {
  const p = input && typeof input === "object" ? input : {};
  const page = PAGES.includes(p.page) ? p.page : "inflatables";
  const type = p.type === "bundle" ? "bundle" : p.type === "mixed" ? "mixed" : "choice";

  let price = null;
  if (type !== "choice") {
    const priceProvided = p.price !== null && p.price !== undefined && p.price !== "";
    if (priceProvided) {
      price = cleanPrice(p.price);
      if (price === null) throw new Error("Invalid price");
    }
  }

  let choiceSource = [];
  if (type === "choice") {
    choiceSource = Array.isArray(p.choices) ? p.choices : p.items;
  } else if (type === "mixed") {
    choiceSource = p.choices;
  }

  const includedSource = type === "choice" ? [] : p.items;
  const choices = cleanPackageItems(choiceSource, productIds, false);
  const items = cleanPackageItems(includedSource, productIds, true);

  let featureSource = [];
  if (Array.isArray(p.features)) featureSource = p.features;
  else if (typeof p.features === "string") featureSource = p.features.split(/\r?\n/);
  const features = featureSource
    .map((feature) => cleanStr(feature, 160))
    .filter(Boolean)
    .slice(0, 12);

  return {
    id: cleanId(p.id) || "pkg-" + crypto.randomBytes(4).toString("hex"),
    name: cleanStr(p.name, 100),
    page,
    type,
    price: type === "choice" ? null : price,
    oldPrice: type === "choice" ? null : cleanPrice(p.oldPrice),
    badge: cleanStr(p.badge, 30),
    shortDesc: cleanStr(p.shortDesc, 300),
    longDesc: cleanStr(p.longDesc, 3000),
    features,
    image: safeImage(p.image) || "images/placeholder.svg",
    position: Math.min(99, Math.max(1, parseInt(p.position, 10) || 1)),
    available: p.available !== false,
    hideItems: p.hideItems !== false,
    choices,
    items,
  };
}

function sanitizePackages(packages, productIds) {
  const seenIds = new Set();
  return (Array.isArray(packages) ? packages : [])
    .slice(0, 100)
    .map((pkg) => {
      try {
        return cleanPackage(pkg, productIds);
      } catch (error) {
        return null;
      }
    })
    .filter((pkg) => {
      if (!pkg || !pkg.name) return false;
      if (pkg.type === "choice") return pkg.choices.length > 0;
      if (pkg.type === "bundle") return pkg.items.length > 0;
      return pkg.choices.length > 0 && pkg.items.length > 0;
    })
    .map((pkg) => {
      if (seenIds.has(pkg.id)) {
        let candidate = pkg.id + "-2";
        let suffix = 2;
        while (seenIds.has(candidate)) {
          suffix += 1;
          candidate = pkg.id + "-" + suffix;
        }
        pkg.id = candidate;
      }
      seenIds.add(pkg.id);
      return pkg;
    });
}

function cleanContent(raw) {
  const source = raw && typeof raw === "object" ? raw : {};

  const banners = {};
  BANNER_KEYS.forEach((key) => {
    banners[key] = cleanBanner(source.banners && source.banners[key]);
  });

  const products = (Array.isArray(source.products) ? source.products : [])
    .slice(0, 300)
    .map(cleanProduct)
    .filter((p) => p.name && !LEGACY_PRODUCT_IDS.has(p.id));

  const seenIds = new Set();
  products.forEach((product) => {
    if (seenIds.has(product.id)) {
      let candidate = product.id + "-2";
      let suffix = 2;
      while (seenIds.has(candidate)) {
        suffix += 1;
        candidate = product.id + "-" + suffix;
      }
      product.id = candidate;
    }
    seenIds.add(product.id);
  });

  const productIds = new Set(products.map((product) => product.id));
  const packages = sanitizePackages(source.packages, productIds);

  const faq = (Array.isArray(source.faq) ? source.faq : DEFAULT_CONTENT.faq)
    .slice(0, 50)
    .map(cleanFaqItem)
    .filter((f) => f.question);

  return { version: 1, packagesVersion: PACKAGES_VERSION, banners, products, packages, faq };
}

/* Complète un contenu sauvegardé avec les valeurs par défaut manquantes
   (ex: ancien contenu sauvegardé avant l'ajout de la FAQ) */
function normalizeStored(stored) {
  const base = JSON.parse(JSON.stringify(DEFAULT_CONTENT));

  if (!stored || typeof stored !== "object") {
    const products = normalizeProductList(base.products);
    const productIds = new Set(products.map((product) => product.id));
    return {
      version: 1,
      packagesVersion: PACKAGES_VERSION,
      banners: base.banners,
      products,
      packages: sanitizePackages(base.packages, productIds),
      faq: base.faq,
    };
  }

  const banners = {};
  BANNER_KEYS.forEach((key) => {
    banners[key] =
      stored.banners && stored.banners[key]
        ? cleanBanner(stored.banners[key])
        : cleanBanner(base.banners[key]);
  });

  let products = Array.isArray(stored.products) ? stored.products : base.products;

  products = products
    .filter((p) => p && typeof p === "object" && !LEGACY_PRODUCT_IDS.has(p.id))
    .map((p) => ({
      ...p,
      id: typeof p.id === "string" ? p.id : "",
      image: safeImage(p.image) || "images/placeholder.svg",
      url: safeUrl(p.url),
    }));

  // S'assure que chaque page a du contenu (migration des anciennes données)
  ["addons", "silent-disco", "photo-booths"].forEach((page) => {
    if (!products.some((p) => p.page === page)) {
      products = products.concat(base.products.filter((p) => p.page === page));
    }
  });

  const normalizedProducts = normalizeProductList(products);
  const productIds = new Set(normalizedProducts.map((product) => product.id));
  const packageVersion = Number(stored.packagesVersion) || 0;
  const packageSource = Array.isArray(stored.packages) ? stored.packages.slice() : base.packages.slice();

  if (packageVersion < PACKAGES_VERSION) {
    base.packages.forEach((pkg) => {
      if (PACKAGE_MIGRATION_IDS.indexOf(pkg.id) === -1) return;
      const index = packageSource.findIndex((entry) => entry && entry.id === pkg.id);
      if (index === -1) {
        packageSource.push(JSON.parse(JSON.stringify(pkg)));
        return;
      }
      const existing = packageSource[index];
      if (!Array.isArray(existing.features) || !existing.features.length) {
        packageSource[index] = Object.assign({}, existing, {
          features: JSON.parse(JSON.stringify(pkg.features || [])),
        });
      }
    });
  }

  return {
    version: 1,
    packagesVersion: PACKAGES_VERSION,
    banners,
    products: normalizedProducts,
    packages: sanitizePackages(packageSource, productIds),
    faq: Array.isArray(stored.faq) && stored.faq.length ? stored.faq : base.faq,
  };
}
/* Page + positions 1..N par page (ordre ligne par ligne) */
function normalizeProductList(products) {
  const withPage = products.map((p) => ({
    ...p,
    page: PAGES.includes(p.page) ? p.page : "inflatables",
  }));

  const out = [];
  PAGES.forEach((page) => {
    withPage
      .filter((p) => p.page === page)
      .sort(
        (a, b) =>
          (Number(a.position) || 0) - (Number(b.position) || 0) ||
          String(a.name || "").localeCompare(String(b.name || ""))
      )
      .forEach((p, i) => out.push({ ...p, position: i + 1 }));
  });

  return out;
}

const DEFAULTS_SNAPSHOT_KEY = "defaults-snapshot.json";
const SYNC_FIELDS = [
  "name",
  "page",
  "category",
  "price",
  "oldPrice",
  "badge",
  "shortDesc",
  "longDesc",
  "dimension",
  "image",
  "position",
  "available",
  "url",
  "addons",
];

function buildDefaultSnapshot() {
  const products = normalizeProductList(DEFAULT_CONTENT.products.map(cleanProduct));
  return {
    hash: crypto.createHash("sha256").update(JSON.stringify(products)).digest("hex"),
    products,
  };
}

function sameValue(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function syncProductsWithDefaults(storedProducts, previousSnapshot, currentSnapshot) {
  const stored = Array.isArray(storedProducts) ? storedProducts : [];
  const current =
    currentSnapshot && Array.isArray(currentSnapshot.products) ? currentSnapshot.products : [];
  const previous =
    previousSnapshot && Array.isArray(previousSnapshot.products)
      ? previousSnapshot.products
      : null;
  const before = JSON.stringify(stored);

  if (!previous) {
    const updated = stored.map((product) => {
      const fallback = current.find((p) => p.id === product.id);
      if (!fallback) return product;

      const next = { ...product };
      SYNC_FIELDS.forEach((field) => {
        if (
          !Object.prototype.hasOwnProperty.call(next, field) &&
          Object.prototype.hasOwnProperty.call(fallback, field)
        ) {
          next[field] = fallback[field];
        }
      });

      if (
        (!next.image || next.image === "images/placeholder.svg") &&
        fallback.image &&
        fallback.image !== "images/placeholder.svg"
      ) {
        next.image = fallback.image;
      }

      return next;
    });

    const products = normalizeProductList(updated);
    return {
      products,
      changed: JSON.stringify(products) !== before,
      initialized: true,
    };
  }

  const previousById = new Map(previous.map((p) => [p.id, p]));
  const currentById = new Map(current.map((p) => [p.id, p]));
  const storedById = new Map(stored.map((p) => [p.id, p]));
  const out = [];

  stored.forEach((product) => {
    const oldDefault = previousById.get(product.id);
    const newDefault = currentById.get(product.id);

    if (newDefault && oldDefault) {
      const next = { ...product };
      SYNC_FIELDS.forEach((field) => {
        const inNew = Object.prototype.hasOwnProperty.call(newDefault, field);
        const inOld = Object.prototype.hasOwnProperty.call(oldDefault, field);
        const inStored = Object.prototype.hasOwnProperty.call(product, field);

        if (!inNew) {
          if (inOld && sameValue(product[field], oldDefault[field])) {
            delete next[field];
          }
          return;
        }

        if (!inStored) {
          next[field] = newDefault[field];
          return;
        }

        if (inOld && sameValue(product[field], oldDefault[field])) {
          next[field] = newDefault[field];
        }
      });
      out.push(next);
      return;
    }

    if (newDefault) {
      out.push(product);
      return;
    }

    if (oldDefault) {
      const unchanged = SYNC_FIELDS.filter((field) => field !== "position").every(
        (field) => {
          const inOld = Object.prototype.hasOwnProperty.call(oldDefault, field);
          const inStored = Object.prototype.hasOwnProperty.call(product, field);
          if (!inOld && !inStored) return true;
          return inOld && inStored && sameValue(product[field], oldDefault[field]);
        }
      );
      if (!unchanged) out.push(product);
      return;
    }

    out.push(product);
  });

  current.forEach((product) => {
    if (storedById.has(product.id) || previousById.has(product.id)) return;
    out.push({ ...product });
  });

  const products = normalizeProductList(out);
  return {
    products,
    changed: JSON.stringify(products) !== before,
    initialized: false,
  };
}

async function readDefaultsSnapshot(store) {
  try {
    const snapshot = await store.get(DEFAULTS_SNAPSHOT_KEY, { type: "json" });
    if (snapshot && snapshot.hash && Array.isArray(snapshot.products)) {
      return snapshot;
    }
  } catch (error) {}
  return null;
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

  const headers = noStore(corsHeaders(event));

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  /* 📖 GET → public content (read by the site) */
  if (event.httpMethod === "GET") {
    try {
      const stored = await store.get("content.json", { type: "json" });
      const packagesNeedMigration = !stored || !Array.isArray(stored.packages) || (Number(stored.packagesVersion) || 0) < PACKAGES_VERSION;
      const content = normalizeStored(stored);
      const currentSnapshot = buildDefaultSnapshot();
      const previousSnapshot = await readDefaultsSnapshot(store);
      const sync = syncProductsWithDefaults(
        content.products,
        previousSnapshot,
        currentSnapshot
      );
      content.products = sync.products;

      if (
        packagesNeedMigration ||
        !previousSnapshot ||
        previousSnapshot.hash !== currentSnapshot.hash ||
        sync.changed
      ) {
        try {
          await store.set("content.json", JSON.stringify(content));
          await store.set(DEFAULTS_SNAPSHOT_KEY, JSON.stringify(currentSnapshot));
        } catch (error) {
          console.error("site-content sync save error:", error);
        }
      }

      return json(200, content, headers);
    } catch (error) {
      console.error("site-content GET error:", error);
      return json(500, { error: "Unable to load content" }, headers);
    }
  }

  /* ✍️ POST → admin only */
  if (event.httpMethod === "POST") {
    const isVerify = Boolean(event.queryStringParameters && event.queryStringParameters.verify);

    if (isVerify) {
      const limit = rateLimit("admin-verify:" + getClientIp(event), 20, 15 * 60 * 1000);
      if (!limit.ok) {
        return json(
          429,
          { error: "Too many attempts. Please try again later." },
          Object.assign({}, headers, { "Retry-After": String(limit.retryAfter) })
        );
      }
    }

    if (!isAdmin(event)) {
      return json(401, { error: "Unauthorized" }, headers);
    }

    if (isVerify) {
      return json(200, { ok: true }, headers);
    }

    try {
      let raw = readJson(event, 512 * 1024);

      if (!Array.isArray(raw.packages)) {
        let existingPackages = DEFAULT_CONTENT.packages;
        try {
          const existing = await store.get("content.json", { type: "json" });
          if (existing && Array.isArray(existing.packages)) {
            existingPackages = existing.packages;
          }
        } catch (error) {}
        raw = Object.assign({}, raw, { packages: existingPackages });
      }

      const content = cleanContent(raw);

      if (content.products.length === 0 && Array.isArray(raw.products) && raw.products.length > 0) {
        throw new HttpError(400, "No valid products");
      }

      await store.set("content.json", JSON.stringify(content));
      return json(200, content, headers);
    } catch (error) {
      if (error instanceof HttpError) {
        return json(error.status, { error: error.message }, headers);
      }
      if (error instanceof Error && error.message === "Invalid price") {
        return json(400, { error: "Invalid price" }, headers);
      }
      console.error("site-content POST error:", error);
      return json(400, { error: "Invalid content" }, headers);
    }
  }

  return json(405, { error: "Method Not Allowed" }, headers);
};

exports.DEFAULT_CONTENT = DEFAULT_CONTENT;
exports.__test = {
  buildDefaultSnapshot,
  syncProductsWithDefaults,
  normalizeProductList,
  cleanContent,
  normalizeStored,
  cleanPackage,
  sanitizePackages,
};
