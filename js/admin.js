
    const API_DATES = "/.netlify/functions/blocked-dates";
    const API_CONTENT = "/.netlify/functions/site-content";

    let ITEM_NAMES = {
      "ALL": "🌐 All inflatables"
    };

    const BANNER_LABELS = {
      home: "Home",
      inflatables: "Inflatables",
      addons: "Add-ons",
      youngAdult: "Young Adult (Silent Disco)"
    };

    const PAGE_LABELS = {
      inflatables: "Inflatables",
      addons: "Add-ons",
      "silent-disco": "Silent Disco",
      "photo-booths": "Photo Booths"
    };
    const PAGE_ORDER = ["inflatables", "addons", "silent-disco", "photo-booths"];

    const API_LOGIN = "/.netlify/functions/admin-login";
    const API_LOGOUT = "/.netlify/functions/admin-logout";
    const API_SESSION = "/.netlify/functions/admin-session";

    /* Older versions stored the admin key in sessionStorage. Remove any
       leftover copy so an XSS can no longer read it. */
    try { sessionStorage.removeItem("mlb_admin_key"); } catch (e) {}

    let content = null;

    /* ============================================
       LOGIN
       ============================================ */
    async function login() {
      const key = document.getElementById("adminKey").value.trim();
      const status = document.getElementById("loginStatus");

      if (!key) {
        status.textContent = "❌ Enter your admin key";
        status.style.color = "#e63329";
        return;
      }

      status.textContent = "⏳ Checking...";
      status.style.color = "var(--color-gray)";

      try {
        const res = await fetch(API_LOGIN, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ key: key })
        });

        if (res.status === 429) {
          status.textContent = "Too many attempts. Please wait a few minutes and try again.";
          status.style.color = "#e63329";
          return;
        }

        if (!res.ok) {
          status.textContent = "❌ Invalid admin key";
          status.style.color = "#e63329";
          return;
        }
      } catch (e) {
        status.textContent = "❌ Network error";
        status.style.color = "#e63329";
        return;
      }

      document.getElementById("adminKey").value = "";
      status.textContent = "";
      await enterPanel();
    }

    async function logout() {
      try {
        await fetch(API_LOGOUT, { method: "POST", credentials: "same-origin" });
      } catch (e) {}
      document.getElementById("panel").style.display = "none";
      document.getElementById("loginBox").style.display = "block";
      document.getElementById("logoutBtn").style.display = "none";
      document.getElementById("adminKey").value = "";
    }

    async function enterPanel() {
      try {
        await loadContent();
      } catch (e) {
        document.getElementById("panel").style.display = "none";
        document.getElementById("loginBox").style.display = "block";
        document.getElementById("logoutBtn").style.display = "none";
        const status = document.getElementById("loginStatus");
        status.textContent = "❌ Backend unavailable — deploy to Netlify or run `netlify dev`";
        status.style.color = "#e63329";
        return;
      }

      document.getElementById("loginBox").style.display = "none";
      document.getElementById("panel").style.display = "block";
      document.getElementById("logoutBtn").style.display = "inline-block";

      renderBannersForm();
      renderFaqAdmin();
      renderBlogAdmin();
      renderPackages();
      renderArticles();
      renderItemOptions();
      loadBlocked();
      loadBookings();
    }

    /* ============================================
       CONTENT (banners + products)
       ============================================ */
    async function loadContent() {
      const res = await fetch(API_CONTENT, { cache: "no-store", credentials: "same-origin" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      content = await res.json();
      if (!Array.isArray(content.packages)) content.packages = [];
    }

    async function saveContent(statusEl, okMessage) {
      statusEl.textContent = "⏳ Saving...";
      statusEl.style.color = "var(--color-gray)";

      const res = await fetch(API_CONTENT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(content)
      });

      if (res.status === 401) {
        logout();
        return false;
      }

      if (!res.ok) {
        let message = "Server error";
        try {
          const data = await res.json();
          message = data.error || message;
        } catch (e) {}
        statusEl.textContent = "❌ " + message;
        statusEl.style.color = "#e63329";
        return false;
      }

      content = await res.json();
      statusEl.textContent = "✅ " + okMessage;
      statusEl.style.color = "#27ae60";
      return true;
    }

    /* ============================================
       BANNERS
       ============================================ */
    function renderBannersForm() {
      const root = document.getElementById("bannersForm");

      root.innerHTML = Object.keys(BANNER_LABELS).map(function (key) {
        const b = (content.banners && content.banners[key]) || {};
        return (
          '<div class="banner-editor">' +
            "<h4>" + BANNER_LABELS[key] + "</h4>" +
            '<div class="check-row">' +
              '<input type="checkbox" id="b-' + key + '-enabled"' + (b.enabled ? " checked" : "") + ">" +
              "<span>Show banner</span>" +
            "</div>" +
            "<label>Small text (left)</label>" +
            '<input type="text" id="b-' + key + '-text" maxlength="80" value="' + escapeAttr(b.text || "") + '">' +
            "<label>Title (bold)</label>" +
            '<input type="text" id="b-' + key + '-title" maxlength="160" value="' + escapeAttr(b.title || "") + '">' +
            "<label>Sub-text</label>" +
            '<input type="text" id="b-' + key + '-sub" maxlength="160" value="' + escapeAttr(b.sub || "") + '">' +
            "<label>Button text</label>" +
            '<input type="text" id="b-' + key + '-cta" maxlength="30" value="' + escapeAttr(b.cta || "") + '">' +
            "<label>Button link</label>" +
            '<input type="text" id="b-' + key + '-link" maxlength="300" value="' + escapeAttr(b.link || "") + '">' +
          "</div>"
        );
      }).join("");
    }

    async function saveBanners() {
      if (!content) return;

      Object.keys(BANNER_LABELS).forEach(function (key) {
        content.banners[key] = {
          enabled: document.getElementById("b-" + key + "-enabled").checked,
          text: document.getElementById("b-" + key + "-text").value.trim(),
          title: document.getElementById("b-" + key + "-title").value.trim(),
          sub: document.getElementById("b-" + key + "-sub").value.trim(),
          cta: document.getElementById("b-" + key + "-cta").value.trim(),
          link: document.getElementById("b-" + key + "-link").value.trim()
        };
      });

      await saveContent(document.getElementById("bannerStatus"), "Banners saved");
    }

    /* ============================================
       FAQ
       ============================================ */
    function renderFaqAdmin() {
      const root = document.getElementById("faqTable");
      const items = (content.faq || []).slice().sort(function (a, b) {
        return a.position - b.position;
      });

      if (!items.length) {
        root.innerHTML = '<p style="color:var(--color-gray);">No FAQ yet. Click "New question".</p>';
        return;
      }

      const rows = items.map(function (f) {
        return (
          "<tr>" +
            "<td>" + f.position + "</td>" +
            "<td><strong>" + escapeHtml(f.question) + "</strong></td>" +
            '<td style="white-space:nowrap;">' +
              '<button class="row-btn edit" data-faq-edit="' + escapeAttr(f.id) + '">Edit</button>' +
              '<button class="row-btn del" data-faq-del="' + escapeAttr(f.id) + '">Delete</button>' +
            "</td>" +
          "</tr>"
        );
      }).join("");

      root.innerHTML =
        '<table class="articles-table">' +
          "<thead><tr><th>Pos.</th><th>Question</th><th></th></tr></thead>" +
          "<tbody>" + rows + "</tbody>" +
        "</table>";

      root.querySelectorAll("[data-faq-edit]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          openFaqForm(btn.getAttribute("data-faq-edit"));
        });
      });

      root.querySelectorAll("[data-faq-del]").forEach(function (btn) {
        btn.addEventListener("click", async function () {
          if (!confirm("Delete this question?")) return;

          const id = btn.getAttribute("data-faq-del");
          content.faq = content.faq.filter(function (f) { return f.id !== id; });

          const ok = await saveContent(document.getElementById("faqStatus"), "Question deleted");
          if (ok) {
            renderFaqAdmin();
            document.getElementById("faqFormBox").style.display = "none";
          }
        });
      });
    }

    function openFaqForm(id) {
      const box = document.getElementById("faqFormBox");
      box.style.display = "block";

      const item = id
        ? (content.faq || []).find(function (f) { return f.id === id; })
        : null;

      document.getElementById("faqFormTitle").textContent = item ? "Edit question" : "New question";
      document.getElementById("f-id").value = item ? item.id : "";
      document.getElementById("f-question").value = item ? item.question : "";
      document.getElementById("f-answer").value = item ? item.answer : "";
      document.getElementById("f-position").value = item ? item.position : 1;
      document.getElementById("faqStatus").textContent = "";

      if (box.scrollIntoView) box.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function saveFaq() {
      const status = document.getElementById("faqStatus");
      const question = document.getElementById("f-question").value.trim();

      if (!question) {
        status.textContent = "❌ Question is required";
        status.style.color = "#e63329";
        return;
      }

      const existingId = document.getElementById("f-id").value;
      const id = existingId || "faq-" + slugify(question) + "-" + Date.now().toString(36);

      const item = {
        id: id,
        question: question,
        answer: document.getElementById("f-answer").value.trim(),
        position: parseInt(document.getElementById("f-position").value, 10) || 1
      };

      if (!Array.isArray(content.faq)) content.faq = [];
      const index = content.faq.findIndex(function (f) { return f.id === id; });
      if (index >= 0) {
        content.faq[index] = item;
      } else {
        content.faq.push(item);
      }

      const ok = await saveContent(status, "Question saved");
      if (ok) {
        renderFaqAdmin();
        openFaqForm(item.id);
        status.textContent = "✅ Question saved";
        status.style.color = "#27ae60";
      }
    }

    /* ============================================
       MEDIA UPLOAD (photos & vidéos)
       ============================================ */
    const API_MEDIA = "/.netlify/functions/media";

    function readFileAsBase64(file) {
      return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () {
          resolve(String(reader.result || "").split(",")[1] || "");
        };
        reader.onerror = function () { reject(new Error("Could not read file")); };
        reader.readAsDataURL(file);
      });
    }

    function compressImage(file) {
      return new Promise(function (resolve, reject) {
        /* GIF is uploaded untouched (keeps the animation) */
        if (/gif/i.test(file.type)) {
          readFileAsBase64(file)
            .then(function (data) { resolve({ name: file.name, type: file.type, data: data }); })
            .catch(reject);
          return;
        }

        function process(sourceUrl, revoke) {
          const img = new Image();

          img.onload = function () {
            const MAX = 1600;
            const scale = Math.min(1, MAX / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            if (revoke) URL.revokeObjectURL(sourceUrl);
            resolve({
              name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
              type: "image/jpeg",
              data: (canvas.toDataURL("image/jpeg", 0.82).split(",")[1] || "")
            });
          };

          img.onerror = function () {
            if (revoke) {
              URL.revokeObjectURL(sourceUrl);
              /* Blob URLs can be blocked by a strict CSP — retry with a data URL. */
              const reader = new FileReader();
              reader.onload = function () { process(String(reader.result || ""), false); };
              reader.onerror = function () { reject(new Error("Could not read image")); };
              reader.readAsDataURL(file);
              return;
            }
            reject(new Error("Could not read image"));
          };

          img.src = sourceUrl;
        }

        process(URL.createObjectURL(file), true);
      });
    }

    async function uploadMediaFile(file) {
      const isImage = /^image\//.test(file.type);
      const isVideo = /^video\//.test(file.type);

      if (!isImage && !isVideo) throw new Error("Unsupported file type");
      if (isVideo && file.size > 3.5 * 1024 * 1024) {
        throw new Error("Video is too large (max 3.5 MB). Use a YouTube link instead.");
      }

      const payload = isImage
        ? await compressImage(file)
        : { name: file.name, type: file.type, data: await readFileAsBase64(file) };

      const res = await fetch(API_MEDIA, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        logout();
        throw new Error("Session expired — log in again");
      }

      if (!res.ok) {
        let message = "Upload failed";
        try { message = (await res.json()).error || message; } catch (e) {}
        throw new Error(message);
      }

      return await res.json(); /* { url, type } */
    }

    function mediaThumbHTML(url, type, index, isCover, removable) {
      const isVideo = type && type.indexOf("video") === 0;
      const label = isCover ? "Cover" : isVideo ? "Video" : "Photo";
      return (
        '<div class="media-thumb' + (isCover ? " is-cover" : "") + '">' +
          (isVideo
            ? '<video src="' + escapeAttr(url) + '" muted preload="metadata"></video>'
            : '<img src="' + escapeAttr(url) + '" alt="" />') +
          '<span class="media-badge">' + label + "</span>" +
          (removable
            ? '<button type="button" class="media-remove" data-media-remove="' + index + '" title="Remove">✕</button>'
            : "") +
        "</div>"
      );
    }

    /* ============================================
       PRODUCT PHOTOS (multi-upload)
       ============================================ */
    let articleImages = [];

    function renderArticleThumbs() {
      const root = document.getElementById("a-thumbs");
      if (!root) return;

      root.innerHTML = articleImages.map(function (url, i) {
        return mediaThumbHTML(url, "image", i, i === 0, true);
      }).join("");

      root.querySelectorAll("[data-media-remove]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          articleImages.splice(parseInt(btn.getAttribute("data-media-remove"), 10), 1);
          renderArticleThumbs();
        });
      });
    }

    async function handleArticleUploads(files) {
      if (!files || !files.length) return;
      const status = document.getElementById("articleStatus");
      status.textContent = "⏳ Uploading…";
      status.style.color = "var(--color-gray)";

      try {
        for (let i = 0; i < files.length; i++) {
          if (articleImages.length >= 8) throw new Error("Max 8 photos per product");
          const result = await uploadMediaFile(files[i]);
          articleImages.push(result.url);
        }
        renderArticleThumbs();
        status.textContent = "✅ Photos uploaded — remember to save.";
        status.style.color = "#27ae60";
      } catch (error) {
        status.textContent = "❌ " + error.message;
        status.style.color = "#e63329";
      }

      document.getElementById("a-files").value = "";
    }

    async function handlePackageUpload(file) {
      if (!file) return;
      const status = document.getElementById("packageStatus");
      status.textContent = "⏳ Uploading…";
      status.style.color = "var(--color-gray)";

      try {
        const result = await uploadMediaFile(file);
        document.getElementById("pkg-image").value = result.url;
        document.getElementById("pkg-thumbs").innerHTML =
          mediaThumbHTML(result.url, "image", 0, false, false);
        status.textContent = "✅ Photo uploaded — remember to save.";
        status.style.color = "#27ae60";
      } catch (error) {
        status.textContent = "❌ " + error.message;
        status.style.color = "#e63329";
      }

      document.getElementById("pkg-file").value = "";
    }

    /* ============================================
       PRODUCTS
       ============================================ */
    let articleFilterPage = "all";
    let packageFilterPage = "all";
    let showPackagedProducts = false;

    function packageChoices(pkg) {
      if (!pkg) return [];
      if (Array.isArray(pkg.choices) && pkg.choices.length) return pkg.choices;
      return pkg.type === "choice" ? (pkg.items || []) : [];
    }

    function packageIncluded(pkg) {
      if (!pkg || pkg.type === "choice") return [];
      return pkg.items || [];
    }

    function getPackagedProductIdsForPage(page) {
      const ids = new Set();
      (content.packages || []).forEach(function (pkg) {
        if (pkg.hideItems === false) return;
        const packagePage = pkg.page || "inflatables";
        if (page && packagePage !== page) return;
        packageChoices(pkg).concat(packageIncluded(pkg)).forEach(function (item) {
          const product = (content.products || []).find(function (p) {
            return p.id === item.productId;
          });
          if (product && (product.page || "inflatables") === packagePage) {
            ids.add(product.id);
          }
        });
      });
      return ids;
    }

    function packagePriceLabel(pkg) {
      if (pkg.type === "choice") {
        const prices = packageChoices(pkg)
          .map(function (item) {
            const product = (content.products || []).find(function (p) {
              return p.id === item.productId;
            });
            return product && product.available !== false ? Number(product.price) : NaN;
          })
          .filter(function (n) { return Number.isFinite(n) && n > 0; });
        return prices.length ? "From " + money(Math.min.apply(null, prices)) : "Call for price";
      }
      return pkg.price == null ? "Call for price" : money(pkg.price);
    }

    function renderPackages() {
      const root = document.getElementById("packagesTable");
      if (!root) return;

      const allPackages = (content.packages || []).slice().sort(function (a, b) {
        return (PAGE_ORDER.indexOf(a.page || "inflatables") - PAGE_ORDER.indexOf(b.page || "inflatables")) ||
          (Number(a.position) || 0) - (Number(b.position) || 0) ||
          String(a.name || "").localeCompare(String(b.name || ""));
      });
      const packages = packageFilterPage === "all"
        ? allPackages
        : allPackages.filter(function (pkg) {
            return (pkg.page || "inflatables") === packageFilterPage;
          });
      const countEl = document.getElementById("packageCount");
      if (countEl) {
        countEl.textContent = packages.length + " package" + (packages.length === 1 ? "" : "s");
      }

      if (!packages.length) {
        root.innerHTML = '<p style="color:var(--color-gray);">' +
          (packageFilterPage === "all" ? "No packages yet." : "No packages for this page.") +
          "</p>";
        return;
      }

      const rows = packages.map(function (pkg) {
        const typeLabel = pkg.type === "bundle"
          ? "Bundle"
          : pkg.type === "mixed"
            ? "Choice + included"
            : "Choice";
        const count = packageChoices(pkg).length + packageIncluded(pkg).length;
        return (
          "<tr>" +
            "<td>" + (pkg.position || 1) + "</td>" +
            "<td><strong>" + escapeHtml(pkg.name) + "</strong></td>" +
            "<td>" + (PAGE_LABELS[pkg.page] || PAGE_LABELS.inflatables) + "</td>" +
            "<td>" + typeLabel + "</td>" +
            "<td>" + count + "</td>" +
            "<td>" + escapeHtml(packagePriceLabel(pkg)) + "</td>" +
            "<td>" + (pkg.available ? '<span class="tag">Available</span>' : '<span class="tag off">Unavailable</span>') + "</td>" +
            '<td style="white-space:nowrap;">' +
              '<button class="row-btn edit" data-package-edit="' + escapeAttr(pkg.id) + '">Edit</button>' +
              '<button class="row-btn del" data-package-del="' + escapeAttr(pkg.id) + '">Delete</button>' +
            "</td>" +
          "</tr>"
        );
      }).join("");

      root.innerHTML =
        '<table class="articles-table">' +
          "<thead><tr><th>Pos.</th><th>Name</th><th>Page</th><th>Type</th><th>Items</th><th>Price</th><th>Status</th><th></th></tr></thead>" +
          "<tbody>" + rows + "</tbody>" +
        "</table>";

      root.querySelectorAll("[data-package-edit]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          openPackageForm(btn.getAttribute("data-package-edit"));
        });
      });

      root.querySelectorAll("[data-package-del]").forEach(function (btn) {
        btn.addEventListener("click", async function () {
          const id = btn.getAttribute("data-package-del");
          const pkg = (content.packages || []).find(function (p) { return p.id === id; });
          if (!pkg) return;
          if (!confirm('Delete package "' + pkg.name + '"?')) return;

          content.packages = (content.packages || []).filter(function (p) { return p.id !== id; });
          const ok = await saveContent(document.getElementById("packageStatus"), "Package deleted");
          if (ok) {
            renderPackages();
            renderArticles();
            document.getElementById("packageFormBox").style.display = "none";
          }
        });
      });
    }

    function renderPackageItemPicker(selectedItems, rootId, withQty) {
      const root = document.getElementById(rootId);
      if (!root) return;

      const selected = {};
      (selectedItems || []).forEach(function (item) {
        selected[item.productId] = Math.max(1, parseInt(item.quantity, 10) || 1);
      });

      let html = "";
      PAGE_ORDER.forEach(function (page) {
        const products = (content.products || [])
          .filter(function (p) { return (p.page || "inflatables") === page; })
          .slice()
          .sort(function (a, b) {
            return (a.position - b.position) ||
              String(a.name || "").localeCompare(String(b.name || ""));
          });
        if (!products.length) return;

        html += '<h4 style="margin:12px 0 2px;font-size:0.85rem;color:var(--color-dark);">' + PAGE_LABELS[page] + "</h4>";
        products.forEach(function (product) {
          const checked = Object.prototype.hasOwnProperty.call(selected, product.id);
          const quantity = selected[product.id] || 1;
          html +=
            '<label class="pkg-item">' +
              '<input type="checkbox" class="pkg-item-check" value="' + escapeAttr(product.id) + '"' + (checked ? " checked" : "") + ">" +
              "<span>" + escapeHtml(product.name) + (product.price == null ? "" : " - $" + product.price) + "</span>" +
              (withQty ? '<input type="number" class="pkg-qty" min="1" max="100" value="' + quantity + '">' : "") +
            "</label>";
        });
      });

      root.innerHTML = html || '<p style="color:var(--color-gray);">No products available.</p>';

      root.querySelectorAll(".pkg-item-check").forEach(function (box) {
        box.addEventListener("change", updatePackageItemState);
      });
      root.querySelectorAll(".pkg-qty").forEach(function (input) {
        input.addEventListener("input", updatePackageItemState);
      });
    }

    function renderPackagePickers(pkg) {
      renderPackageItemPicker(packageChoices(pkg), "pkg-choices", false);
      renderPackageItemPicker(packageIncluded(pkg), "pkg-items", true);
    }

    function updatePackageItemState() {
      const type = document.getElementById("pkg-type").value;
      const choiceBoxes = Array.from(document.querySelectorAll("#pkg-choices .pkg-item-check"));
      const itemBoxes = Array.from(document.querySelectorAll("#pkg-items .pkg-item-check"));
      const choiceCount = choiceBoxes.filter(function (box) { return box.checked; }).length;

      itemBoxes.forEach(function (box) {
        const row = box.closest(".pkg-item");
        const qty = row.querySelector(".pkg-qty");
        if (!qty) return;
        qty.style.display = box.checked && type !== "choice" ? "block" : "none";
        qty.disabled = !box.checked || type === "choice";
      });

      const itemCount = itemBoxes.filter(function (box) { return box.checked; }).length;
      document.getElementById("pkg-choicesStatus").textContent =
        choiceCount + " option" + (choiceCount === 1 ? "" : "s") + " selected";
      document.getElementById("pkg-itemsStatus").textContent =
        itemCount + " item" + (itemCount === 1 ? "" : "s") + " included";
    }

    function updatePackageTypeUI() {
      const type = document.getElementById("pkg-type").value;
      document.getElementById("pkg-price-row").style.display = type === "choice" ? "none" : "block";
      document.getElementById("pkg-choice-section").style.display = type === "bundle" ? "none" : "block";
      document.getElementById("pkg-included-section").style.display = type === "choice" ? "none" : "block";
      updatePackageItemState();
    }

    function openPackageForm(id) {
      const box = document.getElementById("packageFormBox");
      const pkg = id
        ? (content.packages || []).find(function (p) { return p.id === id; })
        : null;

      document.getElementById("packageFormTitle").textContent = pkg ? "Edit package" : "New package";
      document.getElementById("pkg-id").value = pkg ? pkg.id : "";
      document.getElementById("pkg-name").value = pkg ? pkg.name : "";
      document.getElementById("pkg-page").value = pkg
        ? (pkg.page || "inflatables")
        : (packageFilterPage !== "all" ? packageFilterPage : (articleFilterPage === "all" ? "inflatables" : articleFilterPage));
      const type = pkg && (pkg.type === "bundle" || pkg.type === "mixed") ? pkg.type : "choice";
      document.getElementById("pkg-type").value = type;
      document.getElementById("pkg-price").value = pkg && pkg.price != null ? pkg.price : "";
      document.getElementById("pkg-oldprice").value = pkg && pkg.oldPrice != null ? pkg.oldPrice : "";
      document.getElementById("pkg-position").value = pkg
        ? (pkg.position || 1)
        : Math.max(1, (content.packages || []).filter(function (p) { return p.page === document.getElementById("pkg-page").value; }).length + 1);
      document.getElementById("pkg-short").value = pkg ? pkg.shortDesc || "" : "";
      document.getElementById("pkg-long").value = pkg ? pkg.longDesc || "" : "";
      document.getElementById("pkg-features").value = pkg && Array.isArray(pkg.features) ? pkg.features.join("\n") : "";
      document.getElementById("pkg-image").value = pkg ? pkg.image || "images/placeholder.svg" : "images/placeholder.svg";
      document.getElementById("pkg-badge").value = pkg ? pkg.badge || "" : "";
      document.getElementById("pkg-available").checked = pkg ? pkg.available !== false : true;
      document.getElementById("pkg-hideitems").checked = pkg ? pkg.hideItems !== false : true;
      document.getElementById("packageStatus").textContent = "";

      renderPackagePickers(pkg);
      updatePackageTypeUI();
      document.getElementById("articleFormBox").style.display = "none";
      box.style.display = "block";
      if (box.scrollIntoView) box.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function savePackage() {
      const status = document.getElementById("packageStatus");
      const id = document.getElementById("pkg-id").value;
      const name = document.getElementById("pkg-name").value.trim();
      const page = document.getElementById("pkg-page").value;
      const type = document.getElementById("pkg-type").value;
      const priceRaw = document.getElementById("pkg-price").value.trim();
      const price = priceRaw === "" ? null : parseFloat(priceRaw);
      const oldPriceRaw = document.getElementById("pkg-oldprice").value.trim();
      const oldPrice = oldPriceRaw === "" ? null : parseFloat(oldPriceRaw);

      if (!name) {
        status.textContent = "Package name is required";
        status.style.color = "#e63329";
        return;
      }
      if (type !== "choice" && price !== null && (!Number.isFinite(price) || price < 0)) {
        status.textContent = "Invalid package price";
        status.style.color = "#e63329";
        return;
      }
      if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice < 0)) {
        status.textContent = "Invalid old price";
        status.style.color = "#e63329";
        return;
      }

      const choices = Array.from(document.querySelectorAll("#pkg-choices .pkg-item-check:checked"))
        .map(function (box) {
          return { productId: box.value, quantity: 1 };
        });
      const items = Array.from(document.querySelectorAll("#pkg-items .pkg-item-check:checked"))
        .map(function (box) {
          const qty = box.closest(".pkg-item").querySelector(".pkg-qty");
          return {
            productId: box.value,
            quantity: Math.min(100, Math.max(1, parseInt(qty && qty.value, 10) || 1)),
          };
        });

      if ((type === "choice" || type === "mixed") && !choices.length) {
        status.textContent = "Select at least one choice option";
        status.style.color = "#e63329";
        return;
      }
      if ((type === "bundle" || type === "mixed") && !items.length) {
        status.textContent = "Select at least one included item";
        status.style.color = "#e63329";
        return;
      }

      const features = document.getElementById("pkg-features").value
        .split(/\r?\n/)
        .map(function (line) { return line.trim(); })
        .filter(Boolean)
        .slice(0, 12);

      const pkg = {
        id: id || "pkg-" + slugify(name) + "-" + Date.now().toString(36),
        name: name,
        page: page,
        type: type,
        price: type === "choice" ? null : price,
        oldPrice: type === "choice" ? null : (Number.isFinite(oldPrice) ? oldPrice : null),
        badge: document.getElementById("pkg-badge").value.trim(),
        shortDesc: document.getElementById("pkg-short").value.trim(),
        longDesc: document.getElementById("pkg-long").value.trim(),
        features: features,
        image: document.getElementById("pkg-image").value.trim() || "images/placeholder.svg",
        position: parseInt(document.getElementById("pkg-position").value, 10) || 1,
        available: document.getElementById("pkg-available").checked,
        hideItems: document.getElementById("pkg-hideitems").checked,
        choices: type === "bundle" ? [] : choices,
        items: type === "choice" ? [] : items,
      };

      content.packages = (content.packages || []).filter(function (p) { return p.id !== pkg.id; });
      content.packages.push(pkg);
      content.packages.sort(function (a, b) {
        return (PAGE_ORDER.indexOf(a.page) - PAGE_ORDER.indexOf(b.page)) ||
          (Number(a.position) || 0) - (Number(b.position) || 0) ||
          String(a.name || "").localeCompare(String(b.name || ""));
      });

      status.textContent = "Saving...";
      status.style.color = "var(--color-gray)";
      const ok = await saveContent(status, "Package saved");
      if (ok) {
        articleFilterPage = page;
        document.getElementById("articleFilterPage").value = page;
        if (packageFilterPage !== "all") {
          packageFilterPage = page;
          document.getElementById("packageFilterPage").value = page;
        }
        renderPackages();
        renderArticles();
        openPackageForm(pkg.id);
        status.textContent = "Package saved";
        status.style.color = "#27ae60";
      }
    }

    function normalizeAdminPositions(products) {
      const out = [];
      PAGE_ORDER.forEach(function (page) {
        products
          .filter(function (p) { return (p.page || "inflatables") === page; })
          .slice()
          .sort(function (a, b) {
            return (a.position - b.position) ||
              String(a.name || "").localeCompare(String(b.name || ""));
          })
          .forEach(function (p, i) { p.position = i + 1; out.push(p); });
      });
      return out;
    }

    function renderArticles() {
      const root = document.getElementById("articlesTable");
      const countEl = document.getElementById("articleCount");

      const allProducts = (content.products || []).slice().sort(function (a, b) {
        return (PAGE_ORDER.indexOf(a.page || "inflatables") - PAGE_ORDER.indexOf(b.page || "inflatables")) ||
          (a.position - b.position) ||
          String(a.name || "").localeCompare(String(b.name || ""));
      });

      const products = articleFilterPage === "all"
        ? allProducts
        : allProducts.filter(function (p) {
            return (p.page || "inflatables") === articleFilterPage;
          });

      const hiddenIds = getPackagedProductIdsForPage(
        articleFilterPage === "all" ? "" : articleFilterPage
      );
      const visibleProducts = showPackagedProducts
        ? products
        : products.filter(function (p) { return !hiddenIds.has(p.id); });
      const hiddenCount = products.length - visibleProducts.length;

      if (countEl) {
        countEl.textContent = visibleProducts.length + " product" + (visibleProducts.length === 1 ? "" : "s") +
          (hiddenCount ? " + " + hiddenCount + " in package" + (hiddenCount === 1 ? "" : "s") : "");
      }

      if (!visibleProducts.length) {
        root.innerHTML = '<p style="color:var(--color-gray);">' +
          (hiddenCount ? "All products here are inside packages. Enable \"Show products inside packages\" to edit them." : "No products on this page yet.") +
          "</p>";
        return;
      }

      let rows = visibleProducts.map(function (p, i) {
        return (
          "<tr>" +
            "<td>" + p.position + "</td>" +
            "<td><strong>" + escapeHtml(p.name) + "</strong></td>" +
            "<td>" + (PAGE_LABELS[p.page] || PAGE_LABELS.inflatables) + "</td>" +
            "<td>" + (p.price == null ? "Call for price" : "$" + p.price) + "</td>" +
            "<td>" + (p.available ? '<span class="tag">Available</span>' : '<span class="tag off">Unavailable</span>') + "</td>" +
            '<td style="white-space:nowrap;">' +
              '<button class="row-btn edit" data-edit="' + escapeAttr(p.id) + '">Edit</button>' +
              '<button class="row-btn del" data-del="' + escapeAttr(p.id) + '">Delete</button>' +
            "</td>" +
          "</tr>"
        );
      }).join("");

      root.innerHTML =
        '<table class="articles-table">' +
          "<thead><tr><th>Pos.</th><th>Name</th><th>Page</th><th>Price</th><th>Status</th><th></th></tr></thead>" +
          "<tbody>" + rows + "</tbody>" +
        "</table>";

      root.querySelectorAll("[data-edit]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          openArticleForm(btn.getAttribute("data-edit"));
        });
      });

      root.querySelectorAll("[data-del]").forEach(function (btn) {
        btn.addEventListener("click", async function () {
          const id = btn.getAttribute("data-del");
          const product = content.products.find(function (p) { return p.id === id; });
          if (!product) return;
          if (!confirm('Delete product "' + product.name + '"?')) return;

          const remaining = content.products.filter(function (p) { return p.id !== id; });
          content.products = normalizeAdminPositions(remaining);

          const ok = await saveContent(document.getElementById("articleStatus"), "Product deleted");
          if (ok) {
            renderArticles();
            renderPackages();
            renderItemOptions();
            loadBlocked();
            document.getElementById("articleFormBox").style.display = "none";
          }
        });
      });
    }

    function renderAddonCheckboxes(selected) {
      const root = document.getElementById("a-addons");
      const chosen = Array.isArray(selected) ? selected.slice(0, 6) : [];

      const addonProducts = (content.products || [])
        .filter(function (a) { return (a.page || "inflatables") === "addons"; })
        .slice()
        .sort(function (a, b) {
          return (a.position - b.position) ||
            String(a.name || "").localeCompare(String(b.name || ""));
        });

      root.innerHTML = addonProducts.map(function (a) {
        const checked = chosen.indexOf(a.id) !== -1;
        return (
          '<label class="addon-check">' +
            '<input type="checkbox" value="' + escapeAttr(a.id) + '"' + (checked ? " checked" : "") + ">" +
            "<span>" + escapeHtml(a.name) + (a.price == null ? "" : " - $" + a.price) + "</span>" +
          "</label>"
        );
      }).join("");

      root.querySelectorAll('input[type="checkbox"]').forEach(function (box) {
        box.addEventListener("change", refreshAddonLocks);
      });

      refreshAddonLocks();
    }

    function refreshAddonLocks() {
      const boxes = Array.from(document.querySelectorAll('#a-addons input[type="checkbox"]'));
      const checked = boxes.filter(function (b) { return b.checked; });

      if (checked.length > 6) {
        checked[checked.length - 1].checked = false;
      }

      const count = boxes.filter(function (b) { return b.checked; }).length;
      boxes.forEach(function (b) {
        b.disabled = !b.checked && count >= 6;
        b.closest(".addon-check").classList.toggle("disabled", b.disabled);
      });

      document.getElementById("addonsCount").textContent = count + " / 6 selected";
      document.getElementById("addonsCount").style.color = "var(--color-gray)";
    }

    function openArticleForm(id) {
      const box = document.getElementById("articleFormBox");
      box.style.display = "block";
      document.getElementById("packageFormBox").style.display = "none";

      const product = id
        ? content.products.find(function (p) { return p.id === id; })
        : null;

      document.getElementById("articleFormTitle").textContent = product ? "Edit product" : "New product";
      document.getElementById("a-id").value = product ? product.id : "";
      const page = product
        ? (product.page || "inflatables")
        : (articleFilterPage === "all" ? "inflatables" : articleFilterPage);
      document.getElementById("a-page").value = page;
      document.getElementById("a-name").value = product ? product.name : "";
      document.getElementById("a-price").value = product && product.price != null ? product.price : "";
      document.getElementById("a-oldprice").value = product && product.oldPrice != null ? product.oldPrice : "";

      const pageProducts = (content.products || [])
        .filter(function (p) { return (p.page || "inflatables") === page; })
        .slice()
        .sort(function (a, b) {
          return (a.position - b.position) ||
            String(a.name || "").localeCompare(String(b.name || ""));
        });

      let effectivePosition = pageProducts.length + 1;
      if (product) {
        const idx = pageProducts.findIndex(function (p) { return p.id === product.id; });
        effectivePosition = idx >= 0 ? idx + 1 : 1;
      }
      document.getElementById("a-position").value = effectivePosition;
      document.getElementById("a-dimension").value = product ? product.dimension : "";
      document.getElementById("a-short").value = product ? product.shortDesc : "";
      document.getElementById("a-long").value = product ? product.longDesc : "";
      document.getElementById("a-image").value = product ? product.image : "images/placeholder.svg";

      articleImages = product && Array.isArray(product.images) ? product.images.slice() : [];
      if (!articleImages.length && product && product.image && product.image !== "images/placeholder.svg") {
        articleImages = [product.image];
      }
      renderArticleThumbs();
      document.getElementById("a-badge").value = product ? product.badge : "";
      document.getElementById("a-url").value = product ? product.url : "";
      document.getElementById("a-available").checked = product ? product.available : true;
      document.getElementById("articleStatus").textContent = "";

      renderAddonCheckboxes(product ? product.addons : []);
      if (box.scrollIntoView) box.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function saveArticle() {
      const status = document.getElementById("articleStatus");
      const name = document.getElementById("a-name").value.trim();
      const priceRaw = document.getElementById("a-price").value.trim();
      const price = priceRaw === "" ? null : parseFloat(priceRaw);

      if (!name) {
        status.textContent = "❌ Name is required";
        status.style.color = "#e63329";
        return;
      }
      if (price !== null && (!Number.isFinite(price) || price < 0)) {
        status.textContent = "❌ Invalid price";
        status.style.color = "#e63329";
        return;
      }

      const oldPriceRaw = document.getElementById("a-oldprice").value;
      const oldPrice = oldPriceRaw === "" ? null : parseFloat(oldPriceRaw);

      const addons = Array.from(document.querySelectorAll('#a-addons input[type="checkbox"]:checked'))
        .map(function (b) { return b.value; })
        .slice(0, 6);

      const existingId = document.getElementById("a-id").value;
      const id = existingId || slugify(name) + "-" + Date.now().toString(36);
      const existing = content.products.find(function (p) { return p.id === id; });
      const page = document.getElementById("a-page").value;

      const product = {
        id: id,
        name: name,
        page: page,
        category: existing ? existing.category : "kids",
        price: price,
        oldPrice: Number.isFinite(oldPrice) ? oldPrice : null,
        badge: document.getElementById("a-badge").value.trim(),
        shortDesc: document.getElementById("a-short").value.trim(),
        longDesc: document.getElementById("a-long").value.trim(),
        dimension: document.getElementById("a-dimension").value.trim(),
        image: articleImages[0] || document.getElementById("a-image").value.trim() || "images/placeholder.svg",
        images: articleImages.slice(0, 8),
        position: parseInt(document.getElementById("a-position").value, 10) || 1,
        available: document.getElementById("a-available").checked,
        url: document.getElementById("a-url").value.trim(),
        addons: addons
      };

      // Insère à la position choisie (slot) dans SA page, puis renumérote par page
      const others = content.products.filter(function (p) { return p.id !== id; });
      const samePage = others
        .filter(function (p) { return (p.page || "inflatables") === page; })
        .sort(function (a, b) {
          return (a.position - b.position) ||
            String(a.name || "").localeCompare(String(b.name || ""));
        });
      const otherPages = others.filter(function (p) {
        return (p.page || "inflatables") !== page;
      });

      const target = Math.max(0, Math.min((product.position || 1) - 1, samePage.length));
      samePage.splice(target, 0, product);
      samePage.forEach(function (p, i) { p.position = i + 1; });

      content.products = normalizeAdminPositions(otherPages.concat(samePage));

      const ok = await saveContent(status, "Product saved");
      if (ok) {
        if (!existingId) {
          articleFilterPage = product.page || "inflatables";
          document.getElementById("articleFilterPage").value = articleFilterPage;
        }
        renderArticles();
        renderPackages();
        renderItemOptions();
        loadBlocked();
        openArticleForm(product.id);
        status.textContent = "✅ Product saved";
        status.style.color = "#27ae60";
      }
    }

    /* ============================================
       BLOG
       ============================================ */
    let blogImages = [];
    let blogVideo = "";

    function renderBlogAdmin() {
      const root = document.getElementById("blogTable");
      if (!root) return;

      const posts = (content.blog || []).slice().sort(function (a, b) {
        if (String(a.date || "") !== String(b.date || "")) {
          return String(b.date || "").localeCompare(String(a.date || ""));
        }
        return (Number(a.position) || 0) - (Number(b.position) || 0);
      });

      if (!posts.length) {
        root.innerHTML = '<p style="color:var(--color-gray);">No articles yet. Click "New article".</p>';
        return;
      }

      root.innerHTML =
        '<table class="articles-table">' +
          "<thead><tr><th>Date</th><th>Title</th><th>Status</th><th></th></tr></thead>" +
          "<tbody>" +
            posts.map(function (post) {
              return (
                "<tr>" +
                  "<td>" + escapeHtml(post.date || "—") + "</td>" +
                  "<td><strong>" + escapeHtml(post.title) + "</strong></td>" +
                  "<td>" + (post.published === false
                    ? '<span class="tag off">Draft</span>'
                    : '<span class="tag">Published</span>') + "</td>" +
                  '<td style="white-space:nowrap;">' +
                    '<button class="row-btn edit" data-blog-edit="' + escapeAttr(post.id) + '">Edit</button>' +
                    '<button class="row-btn del" data-blog-del="' + escapeAttr(post.id) + '">Delete</button>' +
                  "</td>" +
                "</tr>"
              );
            }).join("") +
          "</tbody>" +
        "</table>";

      root.querySelectorAll("[data-blog-edit]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          openBlogForm(btn.getAttribute("data-blog-edit"));
        });
      });

      root.querySelectorAll("[data-blog-del]").forEach(function (btn) {
        btn.addEventListener("click", async function () {
          if (!confirm("Delete this article?")) return;
          const id = btn.getAttribute("data-blog-del");
          content.blog = (content.blog || []).filter(function (post) { return post.id !== id; });
          const ok = await saveContent(document.getElementById("blogStatus"), "Article deleted");
          if (ok) {
            renderBlogAdmin();
            document.getElementById("blogFormBox").style.display = "none";
          }
        });
      });
    }

    function renderBlogMedia() {
      const root = document.getElementById("bl-media");
      if (!root) return;

      let html = blogImages.map(function (url, i) {
        return mediaThumbHTML(url, "image", i, i === 0, true);
      }).join("");

      if (blogVideo) {
        html += mediaThumbHTML(blogVideo, "video", -1, false, true);
      }

      root.innerHTML = html;

      root.querySelectorAll("[data-media-remove]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const index = parseInt(btn.getAttribute("data-media-remove"), 10);
          if (index === -1) {
            blogVideo = "";
            document.getElementById("bl-video").value = "";
          } else {
            blogImages.splice(index, 1);
          }
          renderBlogMedia();
        });
      });
    }

    function openBlogForm(id) {
      const box = document.getElementById("blogFormBox");
      box.style.display = "block";

      const post = id
        ? (content.blog || []).find(function (p) { return p.id === id; })
        : null;

      document.getElementById("blogFormTitle").textContent = post ? "Edit article" : "New article";
      document.getElementById("bl-id").value = post ? post.id : "";
      document.getElementById("bl-title").value = post ? post.title : "";
      document.getElementById("bl-date").value = post && post.date
        ? post.date
        : new Date().toISOString().slice(0, 10);
      document.getElementById("bl-short").value = post ? post.shortDesc : "";
      document.getElementById("bl-long").value = post ? post.longDesc : "";
      document.getElementById("bl-video").value = post && post.video ? post.video : "";
      document.getElementById("bl-position").value = post ? post.position : 1;
      document.getElementById("bl-published").checked = post ? post.published !== false : true;
      document.getElementById("blogStatus").textContent = "";

      blogImages = post && Array.isArray(post.images) ? post.images.slice() : [];
      blogVideo = post && post.video ? post.video : "";
      renderBlogMedia();

      if (box.scrollIntoView) box.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function handleBlogUploads(files) {
      if (!files || !files.length) return;
      const status = document.getElementById("blogStatus");
      status.textContent = "⏳ Uploading…";
      status.style.color = "var(--color-gray)";

      try {
        for (let i = 0; i < files.length; i++) {
          const isVideo = /^video\//.test(files[i].type);
          const result = await uploadMediaFile(files[i]);
          if (isVideo) {
            blogVideo = result.url;
            document.getElementById("bl-video").value = result.url;
          } else if (blogImages.length < 10) {
            blogImages.push(result.url);
          }
        }
        renderBlogMedia();
        status.textContent = "✅ Uploaded — remember to save.";
        status.style.color = "#27ae60";
      } catch (error) {
        status.textContent = "❌ " + error.message;
        status.style.color = "#e63329";
      }

      document.getElementById("bl-files").value = "";
    }

    async function saveBlog() {
      const status = document.getElementById("blogStatus");
      const title = document.getElementById("bl-title").value.trim();

      if (!title) {
        status.textContent = "❌ Title is required";
        status.style.color = "#e63329";
        return;
      }

      const existingId = document.getElementById("bl-id").value;
      const id = existingId || "post-" + slugify(title) + "-" + Date.now().toString(36);

      const post = {
        id: id,
        title: title,
        date: document.getElementById("bl-date").value || "",
        shortDesc: document.getElementById("bl-short").value.trim(),
        longDesc: document.getElementById("bl-long").value.trim(),
        images: blogImages.slice(0, 10),
        video: document.getElementById("bl-video").value.trim(),
        position: parseInt(document.getElementById("bl-position").value, 10) || 1,
        published: document.getElementById("bl-published").checked
      };

      if (!Array.isArray(content.blog)) content.blog = [];
      const index = content.blog.findIndex(function (p) { return p.id === id; });
      if (index >= 0) content.blog[index] = post;
      else content.blog.push(post);

      const ok = await saveContent(status, "Article saved");
      if (ok) {
        renderBlogAdmin();
        openBlogForm(post.id);
        status.textContent = "✅ Article saved";
        status.style.color = "#27ae60";
      }
    }

    /* ============================================
       BLOCKED DATES (existing feature)
       ============================================ */
    function renderItemOptions() {
      const select = document.getElementById("item");
      if (!select || !content) return;

      const current = select.value || "ALL";
      const names = { "ALL": "🌐 All inflatables" };

      const items = (content.products || []).slice().sort(function (a, b) {
        return (PAGE_ORDER.indexOf(a.page || "inflatables") - PAGE_ORDER.indexOf(b.page || "inflatables")) ||
          (a.position - b.position) ||
          String(a.name || "").localeCompare(String(b.name || ""));
      });

      items.forEach(function (p) { names[p.id] = p.name; });
      ITEM_NAMES = names;

      let html = '<option value="ALL">🌐 ALL inflatables (global block)</option>';

      PAGE_ORDER.forEach(function (page) {
        const group = items.filter(function (p) {
          return (p.page || "inflatables") === page;
        });

        if (!group.length) return;

        html += '<optgroup label="' + PAGE_LABELS[page] + '">' +
          group.map(function (p) {
            return '<option value="' + escapeAttr(p.id) + '">' +
              escapeHtml(p.name) + (p.available === false ? " (unavailable)" : "") +
              "</option>";
          }).join("") +
          "</optgroup>";
      });

      select.innerHTML = html;
      select.value = names[current] ? current : "ALL";
    }

    async function sendAction(action) {
      const status = document.getElementById("status");
      const date = document.getElementById("date").value;
      const item = document.getElementById("item").value;

      if (!item) { status.textContent = "❌ Choose an inflatable"; status.style.color = "#e63329"; return; }
      if (!date) { status.textContent = "❌ Choose a date"; status.style.color = "#e63329"; return; }

      status.textContent = "⏳ Working...";
      status.style.color = "var(--color-gray)";

      try {
        const res = await fetch(API_DATES, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ item: item, date: date, action: action })
        });

        if (res.status === 401) {
          logout();
          status.textContent = "❌ Session expired — please log in again";
          status.style.color = "#e63329";
          return;
        }

        if (res.ok) {
          const label = ITEM_NAMES[item] || item;
          status.textContent = action === "block"
            ? "✅ Date blocked (" + label + "): " + date
            : "✅ Date unblocked (" + label + "): " + date;
          status.style.color = "#27ae60";
          loadBlocked();
        } else {
          status.textContent = "❌ Server error";
          status.style.color = "#e63329";
        }
      } catch (e) {
        status.textContent = "❌ Network error";
        status.style.color = "#e63329";
      }
    }

    async function loadBlocked() {
      const list = document.getElementById("blockedList");
      try {
        const res = await fetch(API_DATES);
        const data = await res.json();

        const keys = Object.keys(data).filter(function (k) { return (data[k] || []).length > 0; });
        if (keys.length === 0) {
          list.textContent = "No blocked dates.";
          return;
        }

        let html = "";
        const ordered = keys.sort(function (a, b) {
          return a === "ALL" ? -1 : b === "ALL" ? 1 : a.localeCompare(b);
        });

        for (const key of ordered) {
          const dates = (data[key] || []).sort();
          if (dates.length === 0) continue;
          const label = ITEM_NAMES[key] || key;
          html += "<h4>" + escapeHtml(label) + "</h4><ul>";
          for (const d of dates) html += "<li>" + escapeHtml(d) + "</li>";
          html += "</ul>";
        }
        list.innerHTML = html;
      } catch (e) {
        list.textContent = "Failed to load.";
      }
    }

    /* ============================================
       BOOKINGS
       ============================================ */
    const API_BOOKINGS = "/.netlify/functions/bookings";

    let bookings = [];
    let bookingsLoaded = false;
    let bookingSort = { key: "createdAt", dir: -1 };
    let bookingSearch = "";
    let bookingFilterPayment = "all";
    let bookingSelection = new Set();

    const BOOKING_COLUMNS = [
      { key: "createdAt", label: "Booked" },
      { key: "eventDate", label: "Event date" },
      { key: "name", label: "Customer" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "location", label: "Location" },
      { key: "guests", label: "Guests" },
      { key: "items", label: "Items" },
      { key: "total", label: "Total" },
      { key: "payment", label: "Payment" }
    ];

    async function loadBookings(force) {
      if (bookingsLoaded && !force) return;

      const status = document.getElementById("bookingsStatus");
      status.textContent = "⏳ Loading...";
      status.style.color = "var(--color-gray)";

      try {
        const res = await fetch(API_BOOKINGS, {
          cache: "no-store",
          credentials: "same-origin"
        });

        if (res.status === 401) { logout(); return; }
        if (!res.ok) throw new Error("HTTP " + res.status);

        const data = await res.json();
        bookings = data.bookings || [];
        bookingsLoaded = true;

        const validIds = new Set(bookings.map(function (b) { return b.id; }));
        Array.from(bookingSelection).forEach(function (id) {
          if (!validIds.has(id)) bookingSelection.delete(id);
        });

        status.textContent = "";
        renderBookings();
      } catch (e) {
        status.textContent = "❌ Failed to load bookings";
        status.style.color = "#e63329";
      }
    }

    function getFilteredBookings() {
      const q = bookingSearch.trim().toLowerCase();
      let list = bookings.slice();

      if (bookingFilterPayment !== "all") {
        list = list.filter(function (b) {
          return bookingFilterPayment === "paid"
            ? b.payment === "paid"
            : b.payment !== "paid";
        });
      }

      if (q) {
        list = list.filter(function (b) {
          return [b.name, b.email, b.phone, b.location, b.items, b.address]
            .some(function (v) { return String(v || "").toLowerCase().indexOf(q) !== -1; });
        });
      }

      list.sort(compareBookings);

      return list;
    }

    function compareBookings(a, b) {
      const key = bookingSort.key;
      const dir = bookingSort.dir;

      let va = a[key];
      let vb = b[key];

      if (key === "total") {
        va = Number(va) || 0;
        vb = Number(vb) || 0;
      } else {
        va = String(va || "").toLowerCase();
        vb = String(vb || "").toLowerCase();
      }

      if (va < vb) return -dir;
      if (va > vb) return dir;
      return 0;
    }

    function renderBookings() {
      const tableRoot = document.getElementById("bookingsTable");
      const summary = document.getElementById("bookingsSummary");
      const list = getFilteredBookings();

      const paidTotal = list
        .filter(function (b) { return b.payment === "paid"; })
        .reduce(function (s, b) { return s + (Number(b.total) || 0); }, 0);
      const onsiteTotal = list
        .filter(function (b) { return b.payment !== "paid"; })
        .reduce(function (s, b) { return s + (Number(b.total) || 0); }, 0);

      summary.textContent =
        list.length + " booking" + (list.length === 1 ? "" : "s") +
        " • " + money(paidTotal) + " paid online" +
        " • " + money(onsiteTotal) + " pay on site";

      if (!list.length) {
        tableRoot.innerHTML = '<p style="color:var(--color-gray);">No bookings yet.</p>';
        return;
      }

      const head = BOOKING_COLUMNS.map(function (c) {
        const arrow = bookingSort.key === c.key ? (bookingSort.dir === 1 ? " ▲" : " ▼") : "";
        return '<th class="sortable" data-sort="' + c.key + '">' + c.label + arrow + "</th>";
      }).join("");

      const rows = list.map(function (b) {
        const payLabel = b.payment === "paid" ? "Paid online" : "Pay on site";
        const payClass = b.payment === "paid" ? "pay-tag" : "pay-tag onsite";

        return (
          "<tr>" +
            '<td><input type="checkbox" class="booking-row-check" data-booking-id="' + escapeAttr(b.id) + '"></td>' +
            "<td>" + escapeHtml(formatDateTime(b.createdAt)) + "</td>" +
            "<td>" + escapeHtml(b.eventDate || "—") + "</td>" +
            "<td><strong>" + escapeHtml(b.name || "—") + "</strong></td>" +
            "<td>" + escapeHtml(b.phone || "—") + "</td>" +
            "<td>" + escapeHtml(b.email || "—") + "</td>" +
            "<td>" + escapeHtml(b.location || "—") + "</td>" +
            "<td>" + escapeHtml(b.guests || "—") + "</td>" +
            '<td style="max-width:260px;">' + escapeHtml(String(b.items || "").replace(/\n/g, " · ")) + "</td>" +
            "<td><strong>" + money(Number(b.total) || 0) + "</strong></td>" +
            '<td><span class="' + payClass + '">' + payLabel + "</span></td>" +
            '<td style="white-space:nowrap;">' +
              '<button class="row-btn edit" data-booking-edit="' + escapeAttr(b.id) + '">Edit</button>' +
              '<button class="row-btn del" data-booking-del="' + escapeAttr(b.id) + '">Delete</button>' +
            "</td>" +
          "</tr>"
        );
      }).join("");

      tableRoot.innerHTML =
        '<table class="articles-table bookings-table">' +
          '<thead><tr><th style="width:28px;"><input type="checkbox" id="bookingSelectAll" title="Select all"></th>' +
          head + "<th></th></tr></thead>" +
          "<tbody>" + rows + "</tbody>" +
        "</table>";

      tableRoot.querySelectorAll("[data-sort]").forEach(function (th) {
        th.addEventListener("click", function () {
          const key = th.getAttribute("data-sort");
          if (bookingSort.key === key) {
            bookingSort.dir *= -1;
          } else {
            bookingSort.key = key;
            bookingSort.dir = 1;
          }
          renderBookings();
        });
      });

      tableRoot.querySelectorAll("[data-booking-edit]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          openBookingForm(btn.getAttribute("data-booking-edit"));
        });
      });

      tableRoot.querySelectorAll("[data-booking-del]").forEach(function (btn) {
        btn.addEventListener("click", async function () {
          if (!confirm("Delete this booking? This cannot be undone.")) return;

          const id = btn.getAttribute("data-booking-del");
          try {
            const res = await fetch(API_BOOKINGS, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({ action: "delete", id: id })
            });

            if (res.status === 401) { logout(); return; }
            if (!res.ok) throw new Error("HTTP " + res.status);

            bookings = bookings.filter(function (b) { return b.id !== id; });
            bookingSelection.delete(id);
            renderBookings();
          } catch (e) {
            const status = document.getElementById("bookingsStatus");
            status.textContent = "❌ Delete failed";
            status.style.color = "#e63329";
          }
        });
      });

      tableRoot.querySelectorAll(".booking-row-check").forEach(function (box) {
        box.addEventListener("change", function () {
          const id = box.getAttribute("data-booking-id");
          if (box.checked) bookingSelection.add(id);
          else bookingSelection.delete(id);
          updateSelectionUI();
        });
      });

      const selectAll = document.getElementById("bookingSelectAll");
      if (selectAll) {
        selectAll.addEventListener("change", function () {
          const visibleIds = getFilteredBookings().map(function (b) { return b.id; });
          if (selectAll.checked) {
            visibleIds.forEach(function (id) { bookingSelection.add(id); });
          } else {
            visibleIds.forEach(function (id) { bookingSelection.delete(id); });
          }
          updateSelectionUI();
        });
      }

      updateSelectionUI();
    }

    function updateSelectionUI() {
      const list = getFilteredBookings();
      const visibleIds = list.map(function (b) { return b.id; });

      document.querySelectorAll("#bookingsTable .booking-row-check").forEach(function (box) {
        box.checked = bookingSelection.has(box.getAttribute("data-booking-id"));
      });

      const selectAll = document.getElementById("bookingSelectAll");
      if (selectAll) {
        const selectedVisible = visibleIds.filter(function (id) {
          return bookingSelection.has(id);
        }).length;
        selectAll.checked = visibleIds.length > 0 && selectedVisible === visibleIds.length;
        selectAll.indeterminate = selectedVisible > 0 && selectedVisible < visibleIds.length;
      }

      const exportBtn = document.getElementById("exportBookingsBtn");
      if (exportBtn) {
        exportBtn.textContent = bookingSelection.size
          ? "⬇ Export Excel (" + bookingSelection.size + ")"
          : "⬇ Export Excel";
      }

      const summary = document.getElementById("bookingsSummary");
      if (summary) {
        const paidTotal = list
          .filter(function (b) { return b.payment === "paid"; })
          .reduce(function (s, b) { return s + (Number(b.total) || 0); }, 0);
        const onsiteTotal = list
          .filter(function (b) { return b.payment !== "paid"; })
          .reduce(function (s, b) { return s + (Number(b.total) || 0); }, 0);

        summary.textContent =
          list.length + " booking" + (list.length === 1 ? "" : "s") +
          " • " + money(paidTotal) + " paid online" +
          " • " + money(onsiteTotal) + " pay on site" +
          (bookingSelection.size ? " • " + bookingSelection.size + " selected" : "");
      }
    }

    function openBookingForm(id) {
      const booking = id
        ? bookings.find(function (b) { return b.id === id; })
        : null;

      if (id && !booking) return;

      const box = document.getElementById("bookingFormBox");
      box.style.display = "block";

      document.getElementById("bookingFormTitle").textContent = booking
        ? "Edit booking - " + (booking.name || "")
        : "New booking";
      document.getElementById("bk-id").value = booking ? booking.id : "";
      document.getElementById("bk-created").value = booking
        ? toDatetimeLocal(booking.createdAt)
        : toDatetimeLocal(new Date().toISOString());
      document.getElementById("bk-name").value = booking ? booking.name || "" : "";
      document.getElementById("bk-phone").value = booking ? booking.phone || "" : "";
      document.getElementById("bk-email").value = booking ? booking.email || "" : "";
      document.getElementById("bk-eventdate").value = booking ? booking.eventDate || "" : "";
      document.getElementById("bk-address").value = booking ? booking.address || "" : "";
      document.getElementById("bk-location").value = booking ? booking.location || "" : "";
      document.getElementById("bk-guests").value = booking ? booking.guests || "" : "";
      document.getElementById("bk-items").value = booking ? booking.items || "" : "";
      document.getElementById("bk-total").value = booking && booking.total != null ? booking.total : "";
      document.getElementById("bk-payment").value = booking && booking.payment === "pay_on_site" ? "pay_on_site" : "paid";
      document.getElementById("bk-comments").value = booking ? booking.comments || "" : "";
      document.getElementById("bookingFormStatus").textContent = "";

      if (box.scrollIntoView) box.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function toDatetimeLocal(value) {
      if (!value) return "";
      const d = new Date(value);
      if (isNaN(d.getTime())) return "";
      const pad = function (n) { return String(n).padStart(2, "0"); };
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
        "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
    }

    async function saveBooking() {
      const status = document.getElementById("bookingFormStatus");
      const id = document.getElementById("bk-id").value;
      const name = document.getElementById("bk-name").value.trim();
      const total = parseFloat(document.getElementById("bk-total").value);

      if (!name) {
        status.textContent = "❌ Customer name is required";
        status.style.color = "#e63329";
        return;
      }
      if (!Number.isFinite(total) || total < 0) {
        status.textContent = "❌ Invalid total";
        status.style.color = "#e63329";
        return;
      }

      const booking = {
        id: id,
        name: name,
        phone: document.getElementById("bk-phone").value.trim(),
        email: document.getElementById("bk-email").value.trim(),
        eventDate: document.getElementById("bk-eventdate").value,
        address: document.getElementById("bk-address").value.trim(),
        location: document.getElementById("bk-location").value.trim(),
        guests: document.getElementById("bk-guests").value.trim(),
        items: document.getElementById("bk-items").value.trim(),
        total: total,
        payment: document.getElementById("bk-payment").value,
        comments: document.getElementById("bk-comments").value.trim()
      };

      const createdValue = document.getElementById("bk-created").value;
      if (createdValue) {
        booking.createdAt = new Date(createdValue).toISOString();
      }

      const action = id ? "update" : "create";

      status.textContent = "⏳ Saving...";
      status.style.color = "var(--color-gray)";

      try {
        const res = await fetch(API_BOOKINGS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ action: action, booking: booking })
        });

        if (res.status === 401) { logout(); return; }

        if (!res.ok) {
          let message = "Save failed";
          try {
            const data = await res.json();
            message = data.error || message;
          } catch (e) {}
          throw new Error(message);
        }

        const data = await res.json();
        if (id) {
          bookings = bookings.map(function (b) {
            return b.id === data.booking.id ? data.booking : b;
          });
        } else {
          bookings.push(data.booking);
        }

        renderBookings();
        openBookingForm(data.booking.id);

        status.textContent = id ? "✅ Booking updated" : "✅ Booking added";
        status.style.color = "#27ae60";
      } catch (e) {
        status.textContent = "❌ " + (e.message || "Save failed");
        status.style.color = "#e63329";
      }
    }

    function formatDateTime(value) {
      if (!value) return "—";
      const d = new Date(value);
      if (isNaN(d.getTime())) return String(value);
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    function exportBookingsExcel() {
      const status = document.getElementById("bookingsStatus");

      if (typeof XLSX === "undefined") {
        status.textContent = "❌ Excel library not loaded — check your internet connection";
        status.style.color = "#e63329";
        return;
      }

      let list;
      if (bookingSelection.size) {
        list = bookings.filter(function (b) { return bookingSelection.has(b.id); });
        list.sort(compareBookings);
      } else {
        list = getFilteredBookings();
      }
      if (!list.length) {
        status.textContent = "❌ No bookings to export";
        status.style.color = "#e63329";
        return;
      }

      const rows = list.map(function (b) {
        return {
          "Booking ID": excelSafe(b.id),
          "Booked at": excelSafe(formatDateTime(b.createdAt)),
          "Event date": excelSafe(b.eventDate || ""),
          "Customer": excelSafe(b.name || ""),
          "Phone": excelSafe(b.phone || ""),
          "Email": excelSafe(b.email || ""),
          "Address": excelSafe(b.address || ""),
          "Location": excelSafe(b.location || ""),
          "Guests": excelSafe(b.guests || ""),
          "Items": excelSafe(String(b.items || "").replace(/\n/g, " | ")),
          "Total": Number(b.total) || 0,
          "Payment": b.payment === "paid" ? "Paid online" : "Pay on site",
          "Comments": excelSafe(b.comments || "")
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 26 },
        { wch: 28 }, { wch: 20 }, { wch: 8 }, { wch: 50 }, { wch: 10 }, { wch: 14 }, { wch: 40 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bookings");
      XLSX.writeFile(wb, "mainlinebounce-bookings-" + new Date().toISOString().slice(0, 10) + ".xlsx");

      status.textContent = "✅ Excel file downloaded (" + rows.length + " bookings)";
      status.style.color = "#27ae60";
    }

    /* ============================================
       HELPERS
       ============================================ */
    function escapeHtml(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function escapeAttr(value) {
      return escapeHtml(value);
    }

    function excelSafe(value) {
      const s = String(value == null ? "" : value);
      return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
    }

    function money(value) {
      const n = Number(value) || 0;
      return "$" + (Math.round(n * 100) / 100).toString().replace(/\.00$/, "");
    }

    function slugify(value) {
      return String(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "product";
    }

    /* ============================================
       INIT
       ============================================ */
    document.getElementById("loginBtn").addEventListener("click", login);
    document.getElementById("adminKey").addEventListener("keydown", function (e) {
      if (e.key === "Enter") login();
    });
    document.getElementById("logoutBtn").addEventListener("click", logout);
    document.getElementById("saveBannersBtn").addEventListener("click", saveBanners);
    document.getElementById("saveArticleBtn").addEventListener("click", saveArticle);
    document.getElementById("cancelArticleBtn").addEventListener("click", function () {
      document.getElementById("articleFormBox").style.display = "none";
    });
    document.getElementById("newArticleBtn").addEventListener("click", function () {
      openArticleForm(null);
    });
    document.getElementById("savePackageBtn").addEventListener("click", savePackage);
    document.getElementById("cancelPackageBtn").addEventListener("click", function () {
      document.getElementById("packageFormBox").style.display = "none";
    });
    document.getElementById("newPackageBtn").addEventListener("click", function () {
      openPackageForm(null);
    });
    document.getElementById("pkg-type").addEventListener("change", updatePackageTypeUI);
    document.getElementById("showPackagedProducts").addEventListener("change", function (e) {
      showPackagedProducts = e.target.checked;
      renderArticles();
    });
    document.getElementById("articleFilterPage").addEventListener("change", function (e) {
      articleFilterPage = e.target.value;
      renderArticles();
    });
    document.getElementById("packageFilterPage").addEventListener("change", function (e) {
      packageFilterPage = e.target.value;
      renderPackages();
    });

    document.getElementById("saveFaqBtn").addEventListener("click", saveFaq);
    document.getElementById("cancelFaqBtn").addEventListener("click", function () {
      document.getElementById("faqFormBox").style.display = "none";
    });
    document.getElementById("newFaqBtn").addEventListener("click", function () {
      openFaqForm(null);
    });

    document.getElementById("newBlogBtn").addEventListener("click", function () {
      openBlogForm(null);
    });
    document.getElementById("saveBlogBtn").addEventListener("click", saveBlog);
    document.getElementById("cancelBlogBtn").addEventListener("click", function () {
      document.getElementById("blogFormBox").style.display = "none";
    });
    document.getElementById("bl-files").addEventListener("change", function (e) {
      handleBlogUploads(e.target.files);
    });
    document.getElementById("a-files").addEventListener("change", function (e) {
      handleArticleUploads(e.target.files);
    });
    document.getElementById("pkg-file").addEventListener("change", function (e) {
      handlePackageUpload(e.target.files[0]);
    });

    document.getElementById("refreshBookingsBtn").addEventListener("click", function () {
      loadBookings(true);
    });
    document.getElementById("newBookingBtn").addEventListener("click", function () {
      openBookingForm(null);
    });
    document.getElementById("exportBookingsBtn").addEventListener("click", exportBookingsExcel);
    document.getElementById("bookingsSearch").addEventListener("input", function (e) {
      bookingSearch = e.target.value;
      renderBookings();
    });
    document.getElementById("bookingsPayment").addEventListener("change", function (e) {
      bookingFilterPayment = e.target.value;
      renderBookings();
    });
    document.getElementById("saveBookingBtn").addEventListener("click", saveBooking);
    document.getElementById("cancelBookingBtn").addEventListener("click", function () {
      document.getElementById("bookingFormBox").style.display = "none";
    });

    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
        document.querySelectorAll(".tab-panel").forEach(function (p) { p.style.display = "none"; });
        tab.classList.add("active");
        document.getElementById("tab-" + tab.getAttribute("data-tab")).style.display = "block";
      });
    });

    (async function init() {
      try {
        const res = await fetch(API_SESSION, {
          cache: "no-store",
          credentials: "same-origin"
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.authenticated) {
            await enterPanel();
          }
        }
      } catch (e) {}
    })();
  
/* Blocked dates buttons (CSP-safe: no inline onclick) */
document.querySelectorAll("[data-date-action]").forEach(function (btn) {
  btn.addEventListener("click", function () {
    sendAction(btn.getAttribute("data-date-action"));
  });
});
