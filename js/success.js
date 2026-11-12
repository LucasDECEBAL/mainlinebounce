/* ============================================
   SUCCESS PAGE — verify the Stripe session
   before showing success / firing conversions
   ============================================ */
(function () {
  var params = new URLSearchParams(window.location.search);
  var sessionId = params.get("session_id") || "";

  var icon = document.getElementById("successIcon");
  var title = document.getElementById("successTitle");
  var text = document.getElementById("successText");

  function setState(iconText, titleText, html) {
    if (icon) icon.textContent = iconText;
    if (title) title.textContent = titleText;
    if (text) text.innerHTML = html;
  }

  function readPending() {
    try {
      return JSON.parse(localStorage.getItem("mlb_pending_booking")) || {};
    } catch (e) {
      return {};
    }
  }

  function clearCart() {
    try {
      localStorage.removeItem("mlb_cart");
      localStorage.removeItem("mlb_pending_booking");
    } catch (e) {}
  }

  function consentGranted() {
    return Boolean(
      window.mlbConsent && window.mlbConsent.granted && window.mlbConsent.granted()
    );
  }

  function fireConversion(amount, currency) {
    if (typeof window.gtag !== "function" || !consentGranted()) return;

    /* Enhanced conversions: only with the explicit form consent. */
    var hasFormConsent = false;
    try {
      hasFormConsent = localStorage.getItem("mlb_data_consent") === "true";
    } catch (e) {}

    var pending = readPending();
    if (hasFormConsent && pending && pending.email) {
      var nameParts = String(pending.name || "").trim().split(" ");
      window.gtag("set", "user_data", {
        email: pending.email || "",
        phone_number: pending.phone || "",
        address: {
          first_name: nameParts[0] || "",
          last_name: nameParts.slice(1).join(" ") || "",
          street: pending.address || "",
          country: "US",
        },
      });
    }

    window.gtag("event", "conversion", {
      send_to: "AW-18226675274/yt2_CK2Y18IcEMr8k_ND",
      value: amount,
      currency: currency,
    });
  }

  function verify() {
    if (!sessionId) {
      setState(
        "ℹ️",
        "Booking status",
        'We could not find a payment confirmation on this page. If you just booked, ' +
          'check your inbox or call us at <a href="tel:2674053125">(267) 405-3125</a>.'
      );
      return;
    }

    fetch(
      "/.netlify/functions/verify-session?session_id=" + encodeURIComponent(sessionId),
      { cache: "no-store" }
    )
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        var data = result.data || {};

        if (!result.ok || !data.paid) {
          setState(
            "⚠️",
            "Payment not confirmed",
            'We could not confirm your payment yet. If money was taken, ' +
              'call us at <a href="tel:2674053125">(267) 405-3125</a> and we will sort it out.'
          );
          return;
        }

        var amount = Number(data.amount) || 0;
        var currency = data.currency || "USD";

        setState(
          "🎉",
          "Payment successful!",
          "Thank you for your booking! Your payment of <strong>$" +
            amount.toFixed(2) +
            "</strong> has been received and your reservation is confirmed.<br><br>" +
            "We'll contact you shortly with all the details. Get ready to bounce! 🦘"
        );

        clearCart();
        fireConversion(amount, currency);
      })
      .catch(function () {
        setState(
          "⚠️",
          "Unable to verify",
          'We could not reach our payment service. If you were charged, ' +
            'call us at <a href="tel:2674053125">(267) 405-3125</a>.'
        );
      });
  }

  verify();
})();
