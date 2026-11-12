/* ============================================
   CHECKOUT PAGE — modals + blocked dates
   (external file: CSP without 'unsafe-inline')
   ============================================ */

function showModal(message, title, icon, action) {
  document.getElementById("modalTitle").textContent = title || "Oops!";
  document.getElementById("modalText").textContent = message || "";
  document.getElementById("modalIcon").textContent = icon || "⚠️";

  const actionBtn = document.getElementById("modalAction");
  if (actionBtn) {
    if (action && action.href) {
      actionBtn.textContent = action.label || "View cart";
      actionBtn.href = action.href;
      actionBtn.style.display = "";
    } else {
      actionBtn.style.display = "none";
    }
  }

  document.getElementById("customModal").classList.add("show");
}

function hideModal() {
  document.getElementById("customModal").classList.remove("show");
}

document.getElementById("modalClose").addEventListener("click", hideModal);
document.getElementById("customModal").addEventListener("click", function (e) {
  if (e.target === this) hideModal();
});

/* ---------- Blocked dates (per item + global) ---------- */
(function () {
  const API = "/.netlify/functions/blocked-dates";
  const dateInput = document.getElementById("date");
  const form = document.getElementById("checkoutForm");
  if (!dateInput) return;

  let allBlocked = {};

  const today = new Date().toISOString().split("T")[0];
  dateInput.setAttribute("min", today);

  function getCartItems() {
    try {
      const cart = JSON.parse(localStorage.getItem("mlb_cart")) || [];
      return cart.filter(function (item) { return item && item.id; });
    } catch (e) {
      return [];
    }
  }

  function blockedInfoForDate(date) {
    if ((allBlocked["ALL"] || []).indexOf(date) !== -1) {
      return { global: true, names: [] };
    }

    const names = [];
    getCartItems().forEach(function (item) {
      if ((allBlocked[item.id] || []).indexOf(date) !== -1) {
        names.push(item.name || item.id);
      }
    });

    return { global: false, names: names };
  }

  function showBlockedModal(info) {
    let message;

    if (info.global) {
      message =
        "Sorry, our whole inventory is unavailable on this date.\n\n" +
        "Please choose another date.";
    } else {
      message =
        "Sorry, " + (info.names.length > 1 ? "these items are" : "this item is") +
        " not available on this date:\n\n" +
        info.names.map(function (name) { return "• " + name; }).join("\n") +
        "\n\nPlease remove " + (info.names.length > 1 ? "them" : "it") +
        " from your cart or choose another date.";
    }

    showModal(message, "Date not available", "📅", { label: "View cart", href: "cart.html" });
  }

  fetch(API)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      allBlocked = data || {};
    })
    .catch(function () {
      allBlocked = {};
    });

  dateInput.addEventListener("change", function () {
    if (!dateInput.value) return;

    const info = blockedInfoForDate(dateInput.value);
    if (info.global || info.names.length > 0) {
      showBlockedModal(info);
      dateInput.value = "";
    }
  });

  if (form) {
    form.addEventListener("submit", function (e) {
      if (!dateInput.value) return;

      const info = blockedInfoForDate(dateInput.value);
      if (info.global || info.names.length > 0) {
        e.preventDefault();
        showBlockedModal(info);
      }
    });
  }
})();
