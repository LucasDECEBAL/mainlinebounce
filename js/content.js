/* ============================================
   MAIN LINE BOUNCE — DYNAMIC CONTENT (CMS)
   Loads banners + products from the backend
   ============================================ */

const CONTENT_API = "/.netlify/functions/site-content";

/* Fallback content (if the backend is unreachable) */
const DEFAULT_CONTENT = {
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
      longDesc: "Get TWO amazing inflatables together! Combine our classic Magic Castle with the action-packed Super Hero Duo Combo. Double the fun, double the memories for your party!",
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
      longDesc: "The ultimate party solution! Choose Magic Castle or Super Hero Duo Combo and get it bundled with 3 tables, 24 chairs, 1 tent and a mister water system. Everything you need for an unforgettable celebration.",
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
      longDesc: "Cool off with our water slide. Perfect for summer events, teen birthdays and backyard parties.",
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
      longDesc: "A classic bounce house with a magical castle design. Perfect for birthday parties and backyard events for kids of all ages.",
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
      longDesc: "Action-packed superhero bounce house with slide and climb features. Perfect for kids and teens who love adventure and excitement!",
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
    { id: "misting-fan", name: "Misting Fan", page: "addons", price: 50, oldPrice: null, badge: "", shortDesc: "Cool mist for hot days — keep guests comfortable all party long.", longDesc: "Cool mist for hot days — keep guests comfortable all party long.", dimension: "", image: "images/placeholder.svg", position: 1, available: true, url: "", addons: [] },
    { id: "generator", name: "Generator", page: "addons", price: 100, oldPrice: null, badge: "", shortDesc: "Power for inflatables, lights and sound — wherever your event is.", longDesc: "Power for inflatables, lights and sound — wherever your event is.", dimension: "", image: "images/placeholder.svg", position: 2, available: true, url: "", addons: [] },
    { id: "tent", name: "Tent", page: "addons", price: 75, oldPrice: null, badge: "", shortDesc: "Shade and shelter for food, gifts and seating areas.", longDesc: "Shade and shelter for food, gifts and seating areas.", dimension: "", image: "images/canopy.png", position: 3, available: true, url: "", addons: [] },
    { id: "white-folding-tables", name: "White Folding Tables", page: "addons", price: 15, oldPrice: null, badge: "", shortDesc: "Perfect for food, gifts, and seating.", longDesc: "Perfect for food, gifts, and seating.", dimension: "", image: "images/tables.png", position: 4, available: true, url: "", addons: [] },
    { id: "white-folding-chairs", name: "White Folding Chairs", page: "addons", price: 2, oldPrice: null, badge: "", shortDesc: "Clean seating for parties and events.", longDesc: "Clean seating for parties and events.", dimension: "", image: "images/chairs.png", position: 5, available: true, url: "", addons: [] },
    { id: "foam-machine", name: "Foam Machine", page: "addons", price: 299, oldPrice: null, badge: "", shortDesc: "Turn any party into an epic foam party — kids and teens love it.", longDesc: "Turn any party into an epic foam party — kids and teens love it.", dimension: "", image: "images/foam-machine.svg", position: 6, available: true, url: "", addons: [] },
    { id: "popcorn-machine", name: "Popcorn Machine", page: "addons", price: null, oldPrice: null, badge: "", shortDesc: "Fresh popcorn all party long — a crowd favorite for every event.", longDesc: "Fresh popcorn all party long — a crowd favorite for every event.", dimension: "", image: "images/placeholder.svg", position: 7, available: true, url: "", addons: [] },

    /* ----- SILENT DISCO PAGE ----- */
    { id: "dance-floor", name: "Dance Floor Rental", page: "silent-disco", price: 200, oldPrice: null, badge: "", shortDesc: "20 × 20 ft dance floor — indoor or outdoor.", longDesc: "20 × 20 ft dance floor — indoor or outdoor.", dimension: "20 × 20 ft", image: "images/placeholder.svg", position: 1, available: true, url: "", addons: [] },
    { id: "silent-disco-10", name: "Silent Disco — 10 Headsets", page: "silent-disco", price: 399, oldPrice: null, badge: "", shortDesc: "Dance floor included + 10 wireless headsets.", longDesc: "Dance floor included + 10 wireless headsets.", dimension: "", image: "images/placeholder.svg", position: 2, available: true, url: "", addons: [] },
    { id: "silent-disco-30", name: "Silent Disco — 30 Headsets", page: "silent-disco", price: 549, oldPrice: null, badge: "", shortDesc: "Dance floor included + 30 wireless headsets.", longDesc: "Dance floor included + 30 wireless headsets.", dimension: "", image: "images/placeholder.svg", position: 3, available: true, url: "", addons: [] },
    { id: "silent-disco-50", name: "Silent Disco — 50 Headsets", page: "silent-disco", price: 649, oldPrice: null, badge: "", shortDesc: "Dance floor included + 50 wireless headsets.", longDesc: "Dance floor included + 50 wireless headsets.", dimension: "", image: "images/placeholder.svg", position: 4, available: true, url: "", addons: [] },

    /* ----- PHOTO BOOTHS PAGE ----- */
    { id: "photo-booth-rental", name: "Photo Booth Rental", page: "photo-booths", price: null, oldPrice: null, badge: "", shortDesc: "Photo booth with unlimited prints, fun props and a friendly attendant.", longDesc: "Make your event unforgettable with our photo booth rental. Includes unlimited prints, a wide selection of props and a friendly attendant. Perfect for birthdays, weddings, corporate events and more. Call us for a custom quote.", dimension: "", image: "images/photo-booths.webp", position: 1, available: true, url: "", addons: [] },
  ],
  faq: [
    {
      id: "booking-advance",
      question: "How far in advance should I book?",
      answer: "We recommend booking as early as possible, especially for weekends and summer months. Popular dates fill up fast — a 2–3 week advance notice is ideal, but we always try to accommodate last-minute requests when available.",
      position: 1,
    },
    {
      id: "delivery-areas",
      question: "What areas do you deliver to?",
      answer: "We proudly serve the Main Line area and surrounding communities in the Greater Philadelphia region. Please call us at (267) 405-3125 to confirm delivery availability for your specific location.",
      position: 2,
    },
    {
      id: "rain-policy",
      question: "What happens if it rains on my event day?",
      answer: "Safety is our top priority. In case of heavy rain, strong winds, or severe weather, we will work with you to reschedule your rental at no extra charge. Light drizzle may be fine for non-water inflatables — just give us a call and we'll advise you.",
      position: 3,
    },
    {
      id: "payment-methods",
      question: "What payment methods do you accept?",
      answer: "We accept cash, Zelle, Venmo, and major credit/debit cards. A deposit is required at the time of booking to secure your date. The remaining balance is due on the day of your event before setup.",
      position: 4,
    },
    {
      id: "rental-period",
      question: "How long is the rental period?",
      answer: "Our standard rental includes a full-day use (typically up to 6–8 hours). We drop off and pick up on the same day. Extended rental periods may be available — contact us for custom pricing.",
      position: 5,
    },
    {
      id: "setup-requirements",
      question: "Do I need to provide anything for setup?",
      answer: "You will need a flat, clear outdoor area large enough for the inflatable, access to a standard electrical outlet (for the blower), and a water source nearby for water slides. We handle everything else — delivery, setup, and takedown!",
      position: 6,
    },
    {
      id: "clean-safe",
      question: "Are your inflatables clean and safe?",
      answer: "Absolutely! Every inflatable is thoroughly cleaned and sanitized after each use. All our equipment is commercial-grade and regularly inspected to ensure the highest safety standards for your children and guests.",
      position: 7,
    },
    {
      id: "cancel-reschedule",
      question: "Can I cancel or reschedule my booking?",
      answer: "Yes! We understand that plans change. Please notify us at least 48 hours in advance to reschedule at no extra charge. Cancellations made less than 48 hours before the event may be subject to a partial deposit forfeiture. Weather-related cancellations are always free to reschedule.",
      position: 8,
    },
  ],
};

const PAGES = ["inflatables", "addons", "silent-disco", "photo-booths"];

const PAGE_LINKS = {
  inflatables: { label: "Inflatables", href: "inflatables.html" },
  addons: { label: "Add-ons", href: "add-ons.html" },
  "silent-disco": { label: "Silent Disco", href: "silent-disco.html" },
  "photo-booths": { label: "Photo Booths", href: "photo-booths.html" },
};

let cachedContent = null;
let contentIsFallback = false;

/* ---------- Helpers ---------- */
function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* Only allow links that cannot execute script. */
function safeUrl(value, fallback) {
  const raw = String(value == null ? "" : value).trim();
  if (!raw) return fallback || "";
  if (/^tel:[+0-9().\-\s]+$/i.test(raw)) return raw;
  if (/\s/.test(raw)) return fallback || "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^mailto:[^\s]+$/i.test(raw)) return raw;
  if (/^#[A-Za-z0-9_\-:.]*$/.test(raw)) return raw;
  if (/^\/(?!\/)[A-Za-z0-9._~\-/%]*(\?[A-Za-z0-9._~%&=+#\-]*)?(#[A-Za-z0-9._~%\-]*)?$/.test(raw)) return raw;
  if (/^[A-Za-z0-9][A-Za-z0-9._~\-/]*(\?[A-Za-z0-9._~%&=+#\-]*)?(#[A-Za-z0-9._~%\-]*)?$/.test(raw)) return raw;
  return fallback || "";
}

function safeImage(value) {
  const url = safeUrl(value);
  if (/^(mailto|tel):/i.test(url)) return "images/placeholder.svg";
  return url || "images/placeholder.svg";
}

function money(value) {
  const n = Number(value) || 0;
  return "$" + (Math.round(n * 100) / 100).toString().replace(/\.00$/, "");
}

function detailUrl(product) {
  const custom = safeUrl(product.url);
  if (custom) return custom;
  return "product.html?id=" + encodeURIComponent(product.id);
}

/* ---------- Loading ---------- */
async function loadSiteContent() {
  if (cachedContent) return cachedContent;
  try {
    const res = await fetch(CONTENT_API, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    cachedContent = await res.json();
    if (!Array.isArray(cachedContent.faq) || cachedContent.faq.length === 0) {
      cachedContent.faq = DEFAULT_CONTENT.faq;
    }
    normalizeProductPositions(cachedContent);
  } catch (e) {
    contentIsFallback = true;
    cachedContent = DEFAULT_CONTENT;
    normalizeProductPositions(cachedContent);
  }
  return cachedContent;
}

/* Positions 1..N par page (ordre ligne par ligne, de gauche à droite) */
function normalizeProductPositions(content) {
  const products = (content.products || []).map(function (p) {
    return Object.assign({}, p, {
      page: PAGES.indexOf(p.page) !== -1 ? p.page : "inflatables",
    });
  });

  const out = [];
  PAGES.forEach(function (page) {
    products
      .filter(function (p) { return p.page === page; })
      .sort(function (a, b) {
        return (Number(a.position) || 0) - (Number(b.position) || 0) ||
          String(a.name || "").localeCompare(String(b.name || ""));
      })
      .forEach(function (p, i) {
        out.push(Object.assign({}, p, { position: i + 1 }));
      });
  });

  content.products = out;
}

/* ---------- Banners ---------- */
function renderBanner(key, content) {
  const el = document.querySelector('[data-banner="' + key + '"]');
  if (!el) return;

  const banner = content.banners && content.banners[key];
  if (!banner || !banner.enabled || (!banner.text && !banner.title)) {
    el.style.display = "none";
    return;
  }

  el.style.display = "flex";

  const setText = (selector, value) => {
    const node = el.querySelector(selector);
    if (!node) return;
    if (value) {
      node.textContent = value;
      node.style.display = "";
    } else {
      node.style.display = "none";
    }
  };

  setText(".promo-text", banner.text);
  setText(".promo-title", banner.title);
  setText(".promo-sub", banner.sub);

  const btn = el.querySelector(".promo-btn");
  if (btn) {
    const href = safeUrl(banner.link);
    if (banner.cta && href) {
      btn.textContent = banner.cta;
      btn.href = href;
      btn.style.display = "";
    } else {
      btn.style.display = "none";
    }
  }
}

/* ---------- Cart buttons ---------- */
function bindAddButtons(root) {
  root.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      addToCart({
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: parseFloat(btn.dataset.price),
        image: btn.dataset.image,
      });
      showAddedFeedback(btn);
    });
  });
}

/* ---------- Product card ---------- */
function productCardHTML(p) {
  const url = detailUrl(p);
  const hasPrice = p.price !== null && p.price !== undefined;
  const priceHTML = !hasPrice
    ? "Call for price"
    : p.oldPrice
      ? '<span class="price-old">' + money(p.oldPrice) + '</span><span class="price-new">' + money(p.price) + "</span>"
      : money(p.price);

  let action;

  if (!p.available) {
    action = '<button class="btn btn-outline btn-sm" disabled>Unavailable</button>';
  } else if (!hasPrice) {
    action = '<a href="tel:2674053125" class="btn btn-pink btn-sm">📞 Call for price</a>';
  } else {
    action = '<button class="btn btn-pink btn-sm" data-add-to-cart data-id="' + esc(p.id) +
      '" data-name="' + esc(p.name) + '" data-price="' + esc(p.price) +
      '" data-image="' + esc(safeImage(p.image)) + '">Add to cart</button>';
  }

  return (
    '<article class="product-card' + (p.available ? "" : " is-unavailable") + '">' +
      '<div class="product-image"><img src="' + esc(safeImage(p.image)) + '" alt="' + esc(p.name) + '" loading="lazy" /></div>' +
      '<div class="product-card-body">' +
        "<h3>" + esc(p.name) + "</h3>" +
        (p.page === "photo-booths" && p.longDesc ? '<p class="product-long">' + esc(p.longDesc) + "</p>" : "") +
        (p.badge ? '<span class="promo-badge">' + esc(p.badge) + "</span>" : "") +
        (p.available ? "" : '<span class="promo-badge badge-unavailable">UNAVAILABLE</span>') +
        '<span class="price-tag">' + priceHTML + "</span>" +
        '<a href="' + esc(url) + '" class="btn btn-pink btn-sm">View Details</a>' +
        action +
      "</div>" +
    "</article>"
  );
}

/* ---------- Catalog (per page) ---------- */
function renderCatalog(root, content) {
  const page = root.getAttribute("data-page") || "inflatables";
  const items = (content.products || [])
    .filter(function (p) { return (p.page || "inflatables") === page; })
    .slice()
    .sort(function (a, b) {
      return (Number(a.position) || 0) - (Number(b.position) || 0) ||
        String(a.name || "").localeCompare(String(b.name || ""));
    });

  root.innerHTML = items.length
    ? '<div class="products-grid">' + items.map(productCardHTML).join("") + "</div>"
    : '<p class="catalog-empty">No products available right now.</p>';

  bindAddButtons(root);
}

/* ---------- Product detail page ---------- */
function renderProductPage(root, content, product) {
  const addonList = (product.addons || [])
    .map(function (id) {
      return (content.products || []).find(function (p) {
        return p.id === id && p.page === "addons";
      });
    })
    .filter(Boolean);

  const addonsHTML = addonList.length
    ? '<section class="products-section addons-upsell">' +
        '<div class="container">' +
          '<h2 class="catalog-title">Complete your party</h2>' +
          '<div class="equipment-grid">' +
            addonList.map(function (a) {
              const action = a.price == null
                ? '<a href="tel:2674053125" class="btn btn-pink">📞 Call for price</a>'
                : '<button class="btn btn-pink" data-add-to-cart data-id="' + esc(a.id) +
                  '" data-name="' + esc(a.name) + '" data-price="' + esc(a.price) +
                  '" data-image="' + esc(safeImage(a.image)) + '">Add to cart</button>';
              return (
                '<article class="equipment-card">' +
                  '<div class="product-image"><img src="' + esc(safeImage(a.image)) + '" alt="' + esc(a.name) + '" loading="lazy" /></div>' +
                  "<h3>" + esc(a.name) + "</h3>" +
                  '<p class="desc">' + esc(a.shortDesc) + "</p>" +
                  '<span class="price-tag">' + (a.price == null ? "Call for price" : money(a.price)) + "</span>" +
                  action +
                "</article>"
              );
            }).join("") +
          "</div>" +
        "</div>" +
      "</section>"
    : "";

  const hasPrice = product.price !== null && product.price !== undefined;

  const actions = !product.available
    ? '<a href="tel:2674053125" class="btn btn-pink">📞 Currently unavailable - call us</a>'
    : !hasPrice
      ? '<a href="tel:2674053125" class="btn btn-pink">📞 Call for price</a>'
      : '<button class="btn btn-pink" id="detail-add"' +
        ' data-add-to-cart data-id="' + esc(product.id) +
        '" data-name="' + esc(product.name) + '" data-price="' + esc(product.price) +
        '" data-image="' + esc(safeImage(product.image)) + '">Add to cart</button>' +
        '<a href="tel:2674053125" class="btn btn-outline">Call Now</a>';

  root.innerHTML =
    '<section class="product-detail">' +
      '<div class="container">' +
        '<div class="product-detail-inner">' +
          '<div class="detail-image-card"><img src="' + esc(safeImage(product.image)) + '" alt="' + esc(product.name) + '" /></div>' +
          '<div class="detail-info-card">' +
            "<h1>" + esc(product.name) + "</h1>" +
            (product.badge ? '<span class="promo-badge">' + esc(product.badge) + "</span>" : "") +
            (product.available ? "" : '<span class="promo-badge badge-unavailable">CURRENTLY UNAVAILABLE</span>') +
            '<p class="detail-desc">' + esc(product.shortDesc) + "</p>" +
            (product.longDesc ? '<p class="detail-long">' + esc(product.longDesc) + "</p>" : "") +
            '<span class="price-tag">' +
              (!hasPrice
                ? "Call for price"
                : product.oldPrice
                  ? '<span class="price-old">' + money(product.oldPrice) + '</span><span class="price-new">' + money(product.price) + "</span>"
                  : money(product.price)) +
            "</span>" +
            (product.dimension
              ? '<div class="size-info"><h3>Dimensions</h3><p>' + esc(product.dimension) + "</p></div>"
              : "") +
            '<div class="detail-buttons">' + actions + "</div>" +
            '<a href="' + (PAGE_LINKS[product.page] || PAGE_LINKS.inflatables).href + '" class="btn btn-outline btn-sm">← Back to ' + (PAGE_LINKS[product.page] || PAGE_LINKS.inflatables).label + "</a>" +
          "</div>" +
        "</div>" +
      "</div>" +
    "</section>" +
    addonsHTML;

  bindAddButtons(root);
}

/* ---------- FAQ page ---------- */
function renderFaq(root, content) {
  const items = (content.faq || [])
    .slice()
    .sort(function (a, b) { return a.position - b.position; });

  root.innerHTML = items.length
    ? items.map(function (f) {
        return (
          '<div class="faq-item">' +
            '<div class="faq-question">' +
              "<span>" + esc(f.question) + "</span>" +
              '<span class="faq-toggle-icon">+</span>' +
            "</div>" +
            '<div class="faq-answer">' + esc(f.answer) + "</div>" +
          "</div>"
        );
      }).join("")
    : '<p class="catalog-empty">No FAQ yet.</p>';

  if (typeof initFAQ === "function") initFAQ();
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", async function () {
  const content = await loadSiteContent();

  document.querySelectorAll("[data-banner]").forEach(function (el) {
    renderBanner(el.getAttribute("data-banner"), content);
  });

  const catalogRoot = document.getElementById("catalog-root");
  if (catalogRoot) renderCatalog(catalogRoot, content);

  const faqRoot = document.getElementById("faq-root");
  // Si le backend est injoignable, on garde les questions statiques du HTML
  // (déjà reliées à l'accordéon par main.js).
  if (faqRoot && !contentIsFallback) renderFaq(faqRoot, content);

  const productRoot = document.getElementById("product-root");
  if (productRoot) {
    const id = new URLSearchParams(window.location.search).get("id");
    const product = content.products.find(function (p) { return p.id === id; });

    if (!product) {
      productRoot.innerHTML =
        '<section class="products-section"><div class="container">' +
          '<div class="cart-empty" style="display:block; text-align:center;">' +
            "<p style=\"margin-bottom:20px;\">This product could not be found.</p>" +
            '<a href="inflatables.html" class="btn btn-pink">Browse Inflatables</a>' +
          "</div>" +
        "</div></section>";
    } else {
      document.title = product.name + " – Main Line Bounce";
      renderProductPage(productRoot, content, product);
    }
  }
});
