/* ============================================
   MAIN LINE BOUNCE — CONTENU DYNAMIQUE (CMS)
   Lit bannières + articles depuis le backend
   ============================================ */

const CONTENT_API = "/.netlify/functions/site-content";

/* Contenu de secours (si le backend est injoignable) */
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
  ],
};

const CATEGORY_LABELS = {
  kids: "Kids Party",
  teen: "Teen & Young Adult",
  corporate: "Corporate & Large Events",
};
const CATEGORY_ORDER = ["kids", "teen", "corporate"];

let cachedContent = null;

/* ---------- Utilitaires ---------- */
function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(value) {
  const n = Number(value) || 0;
  return "$" + (Math.round(n * 100) / 100).toString().replace(/\.00$/, "");
}

function detailUrl(product) {
  if (product.url) return product.url;
  return "product.html?id=" + encodeURIComponent(product.id);
}

/* ---------- Chargement ---------- */
async function loadSiteContent() {
  if (cachedContent) return cachedContent;
  try {
    const res = await fetch(CONTENT_API, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    cachedContent = await res.json();
  } catch (e) {
    cachedContent = DEFAULT_CONTENT;
  }
  return cachedContent;
}

/* ---------- Bananières ---------- */
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
    if (banner.cta && banner.link) {
      btn.textContent = banner.cta;
      btn.href = banner.link;
      btn.style.display = "";
    } else {
      btn.style.display = "none";
    }
  }
}

/* ---------- Boutons panier ---------- */
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

/* ---------- Carte produit ---------- */
function productCardHTML(p) {
  const url = detailUrl(p);
  const priceHTML = p.oldPrice
    ? '<span class="price-old">' + money(p.oldPrice) + '</span><span class="price-new">' + money(p.price) + "</span>"
    : money(p.price);

  const action = p.available
    ? '<button class="btn btn-pink btn-sm" data-add-to-cart data-id="' + esc(p.id) +
      '" data-name="' + esc(p.name) + '" data-price="' + esc(p.price) +
      '" data-image="' + esc(p.image) + '">Add to cart</button>'
    : '<button class="btn btn-outline btn-sm" disabled>Unavailable</button>';

  return (
    '<article class="product-card' + (p.available ? "" : " is-unavailable") + '">' +
      '<div class="product-image"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy" /></div>' +
      "<h3>" + esc(p.name) + "</h3>" +
      (p.badge ? '<span class="promo-badge">' + esc(p.badge) + "</span>" : "") +
      (p.available ? "" : '<span class="promo-badge badge-unavailable">UNAVAILABLE</span>') +
      '<span class="price-tag">' + priceHTML + "</span>" +
      '<a href="' + esc(url) + '" class="btn btn-pink btn-sm">View Details</a>' +
      action +
    "</article>"
  );
}

/* ---------- Catalogue (page Inflatables) ---------- */
function renderCatalog(root, content) {
  const html = CATEGORY_ORDER.map((cat) => {
    const items = content.products
      .filter((p) => p.category === cat)
      .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));

    if (!items.length) return "";

    return (
      '<section class="catalog-section" id="' + cat + '">' +
        '<h2 class="catalog-title">' + CATEGORY_LABELS[cat] + "</h2>" +
        '<div class="products-grid">' + items.map(productCardHTML).join("") + "</div>" +
      "</section>"
    );
  }).join("");

  root.innerHTML = html || '<p class="catalog-empty">No products available right now.</p>';
  bindAddButtons(root);
}

/* ---------- Page détail produit ---------- */
function renderProductPage(root, content, product) {
  const addonList = (product.addons || [])
    .map((id) => content.addons.find((a) => a.id === id))
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
                  '" data-image="' + esc(a.image) + '">Add to cart</button>';
              return (
                '<article class="equipment-card">' +
                  '<div class="product-image"><img src="' + esc(a.image) + '" alt="' + esc(a.name) + '" loading="lazy" /></div>' +
                  "<h3>" + esc(a.name) + "</h3>" +
                  '<p class="desc">' + esc(a.desc) + "</p>" +
                  '<span class="price-tag">' + (a.price == null ? "Call for price" : money(a.price)) + "</span>" +
                  action +
                "</article>"
              );
            }).join("") +
          "</div>" +
        "</div>" +
      "</section>"
    : "";

  const actions = product.available
    ? '<button class="btn btn-pink" id="detail-add"' +
      ' data-add-to-cart data-id="' + esc(product.id) +
      '" data-name="' + esc(product.name) + '" data-price="' + esc(product.price) +
      '" data-image="' + esc(product.image) + '">Add to cart</button>' +
      '<a href="tel:2674053125" class="btn btn-outline">Call Now</a>'
    : '<a href="tel:2674053125" class="btn btn-pink">📞 Currently unavailable — call us</a>';

  root.innerHTML =
    '<section class="product-detail">' +
      '<div class="container">' +
        '<div class="product-detail-inner">' +
          '<div class="detail-image-card"><img src="' + esc(product.image) + '" alt="' + esc(product.name) + '" /></div>' +
          '<div class="detail-info-card">' +
            "<h1>" + esc(product.name) + "</h1>" +
            (product.badge ? '<span class="promo-badge">' + esc(product.badge) + "</span>" : "") +
            (product.available ? "" : '<span class="promo-badge badge-unavailable">CURRENTLY UNAVAILABLE</span>') +
            '<p class="detail-desc">' + esc(product.shortDesc) + "</p>" +
            (product.longDesc ? '<p class="detail-long">' + esc(product.longDesc) + "</p>" : "") +
            '<span class="price-tag">' +
              (product.oldPrice
                ? '<span class="price-old">' + money(product.oldPrice) + '</span><span class="price-new">' + money(product.price) + "</span>"
                : money(product.price)) +
            "</span>" +
            (product.dimension
              ? '<div class="size-info"><h3>Dimensions</h3><p>' + esc(product.dimension) + "</p></div>"
              : "") +
            '<div class="detail-buttons">' + actions + "</div>" +
            '<a href="inflatables.html" class="btn btn-outline btn-sm">← Back to Inflatables</a>' +
          "</div>" +
        "</div>" +
      "</div>" +
    "</section>" +
    addonsHTML;

  bindAddButtons(root);
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", async function () {
  const content = await loadSiteContent();

  document.querySelectorAll("[data-banner]").forEach(function (el) {
    renderBanner(el.getAttribute("data-banner"), content);
  });

  const catalogRoot = document.getElementById("catalog-root");
  if (catalogRoot) renderCatalog(catalogRoot, content);

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
