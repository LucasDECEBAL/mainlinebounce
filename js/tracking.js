/* ============================================
   GOOGLE ADS + COOKIE CONSENT (Consent Mode v2)
   - Loads gtag with everything denied by default
   - Shows a small consent banner until a choice is stored
   - Handles [data-gtag-conversion] links (old inline onclick)
   ============================================ */
(function () {
  if (window.__mlbTrackingLoaded) return;
  window.__mlbTrackingLoaded = true;

  var ADS_ID = "AW-18226675274";
  var CONVERSION_SEND_TO = ADS_ID + "/beHlCK_u6bscEMr8k_ND";
  var CONSENT_KEY = "mlb_cookie_consent";

  function readConsent() {
    try {
      return localStorage.getItem(CONSENT_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function granted() {
    return readConsent() === "granted";
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };

  function consentPayload(value) {
    return {
      ad_storage: value,
      ad_user_data: value,
      ad_personalization: value,
      analytics_storage: value,
    };
  }

  window.gtag("js", new Date());
  window.gtag("consent", "default", consentPayload("denied"));
  if (granted()) {
    window.gtag("consent", "update", consentPayload("granted"));
  }
  window.gtag("config", ADS_ID);

  /* Load Google's script once */
  if (!document.querySelector('script[data-mlb-gtag]')) {
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + ADS_ID;
    script.setAttribute("data-mlb-gtag", "1");
    document.head.appendChild(script);
  }

  /* Old inline handler compatibility */
  window.gtag_report_conversion = function (url) {
    window.gtag("event", "conversion", {
      send_to: CONVERSION_SEND_TO,
      event_callback: function () {
        if (typeof url !== "undefined") window.location = url;
      },
    });
    if (typeof url !== "undefined") {
      setTimeout(function () {
        window.location = url;
      }, 800);
    }
    return false;
  };

  /* data-gtag-conversion="tel:..." or "inflatables.html" */
  document.addEventListener("click", function (event) {
    var target = event.target && event.target.closest
      ? event.target.closest("[data-gtag-conversion]")
      : null;
    if (!target) return;

    var url = target.getAttribute("data-gtag-conversion");
    if (!url) return;

    event.preventDefault();
    window.gtag_report_conversion(url);
  });

  /* ---------- Consent banner ---------- */
  function buildBanner() {
    if (readConsent()) return;
    if (document.getElementById("mlb-consent-banner")) return;

    var wrap = document.createElement("div");
    wrap.id = "mlb-consent-banner";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-label", "Cookie consent");
    wrap.style.cssText =
      "position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;" +
      "max-width:880px;margin:0 auto;background:#fff;border-radius:16px;" +
      "box-shadow:0 12px 40px rgba(0,0,0,.22);padding:18px 20px;" +
      "display:flex;gap:14px;flex-wrap:wrap;align-items:center;justify-content:space-between;" +
      "font-family:Poppins,sans-serif;color:#2d2b3a;";

    var text = document.createElement("div");
    text.style.cssText = "flex:1;min-width:220px;font-size:.84rem;line-height:1.5;";
    text.innerHTML =
      "We use cookies to measure our ads and improve your experience. " +
      '<a href="privacy.html" style="color:#f56a9b;font-weight:600;">Learn more</a>';

    var actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;";

    var decline = document.createElement("button");
    decline.type = "button";
    decline.textContent = "Decline";
    decline.setAttribute("data-consent", "denied");
    decline.style.cssText =
      "font-family:inherit;font-size:.85rem;font-weight:700;padding:10px 18px;" +
      "border-radius:999px;border:2px solid #e8e8ef;background:#fff;color:#2d2b3a;cursor:pointer;";

    var accept = document.createElement("button");
    accept.type = "button";
    accept.textContent = "Accept";
    accept.setAttribute("data-consent", "granted");
    accept.style.cssText =
      "font-family:inherit;font-size:.85rem;font-weight:700;padding:10px 18px;" +
      "border-radius:999px;border:none;background:#f56a9b;color:#fff;cursor:pointer;";

    actions.appendChild(decline);
    actions.appendChild(accept);
    wrap.appendChild(text);
    wrap.appendChild(actions);
    document.body.appendChild(wrap);

    wrap.addEventListener("click", function (event) {
      var button = event.target && event.target.closest
        ? event.target.closest("[data-consent]")
        : null;
      if (!button) return;

      var value = button.getAttribute("data-consent");
      try {
        localStorage.setItem(CONSENT_KEY, value);
      } catch (e) {}

      if (value === "granted") {
        window.gtag("consent", "update", consentPayload("granted"));
      }
      wrap.remove();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildBanner);
  } else {
    buildBanner();
  }

  window.mlbConsent = {
    granted: granted,
    read: readConsent,
  };
})();
