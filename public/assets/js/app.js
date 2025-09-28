// public/assets/js/app.js

// ─── ICON CONSTANTS ───────────────────────────────────────────────────────────
const ICON_SEARCH = "material-symbols:search";
const ICON_LOGIN = "material-symbols:login";
const ICON_ADD = "material-symbols:add-circle-outline";

// ─── STATE & MODAL INSTANCES ─────────────────────────────────────────────────
let shortcuts = [];
let currentMenuIndex = null;
let addModal, renameModal, prefsModal;

// ─── GLOBAL REFS ──────────────────────────────────────────────────────────────
let loginBtn,
  profileBtn,
  profilePic,
  profileMenu,
  settingsBtn,
  logoutBtn,
  shortcutsC,
  searchForm,
  searchInput,
  addShortcutForm,
  renameShortcutForm;

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
async function checkAuth() {
  const res = await fetch("/api/user", { credentials: "same-origin" });
  return res.ok;
}
async function loadUser() {
  const res = await fetch("/api/user", { credentials: "same-origin" });
  return res.ok ? await res.json() : null;
}
async function loadPrefs() {
  const res = await fetch("/api/prefs", { credentials: "same-origin" });
  return res.ok ? await res.json() : {};
}

// ─── PROFILE UI (pointer-friendly, accessible) ───────────────────────────────
function initProfile(user) {
  profilePic.src = user.photo || "";
  profileBtn.style.display = "block";

  const openMenu = () => {
    profileMenu.hidden = false;
    settingsBtn.setAttribute("aria-expanded", "true");
    // focus first item
    profileMenu.querySelector('[role="menuitem"]')?.focus();
  };
  const closeMenu = () => {
    profileMenu.hidden = true;
    settingsBtn.setAttribute("aria-expanded", "false");
  };
  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    profileMenu.hidden ? openMenu() : closeMenu();
  };

  // Use pointer events for universal input
  settingsBtn.addEventListener("pointerdown", toggleMenu);

  // Keyboard toggle
  settingsBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleMenu(e);
    }
    if (e.key === "ArrowDown" && profileMenu.hidden) {
      e.preventDefault();
      openMenu();
    }
  });

  // Close on outside pointer
  document.addEventListener("pointerdown", (e) => {
    if (
      !profileMenu.hidden &&
      !profileMenu.contains(e.target) &&
      e.target !== settingsBtn
    ) {
      closeMenu();
    }
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !profileMenu.hidden) {
      e.preventDefault();
      closeMenu();
      settingsBtn.focus();
    }
  });

  // Button actions
  document
    .getElementById("settings-open-btn")
    ?.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      closeMenu();
      showPrefsModal();
    });
  logoutBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    location.href = "/logout";
  });
}

// ─── SEARCH OVERRIDE ──────────────────────────────────────────────────────────
function overrideSearch(engine) {
  // ensure only 1 handler
  const submitHandler = (e) => {
    e.preventDefault();
    const q = encodeURIComponent(searchInput.value.trim());
    if (!q) return;
    const urls = {
      google: `https://www.google.com/search?q=${q}`,
      ddg: `https://duckduckgo.com/?q=${q}`,
      bing: `https://www.bing.com/search?q=${q}`,
    };
    window.open(urls[engine] || urls.google, "_blank", "noopener,noreferrer");
    searchInput.value = "";
    searchInput.focus();
  };
  searchForm.addEventListener("submit", submitHandler, { once: true });
  searchInput.focus();
}

// ─── SHORTCUTS: load & render (with drag handle) ─────────────────────────────
async function loadShortcuts() {
  const r = await fetch("/api/shortcuts", { credentials: "same-origin" });
  return r.ok ? await r.json() : [];
}

function renderShortcuts(list) {
  shortcuts = list;
  shortcutsC.innerHTML = "";

  list.forEach((sc, idx) => {
    const col = document.createElement("div");
    col.className = "col shortcut";
    col.dataset.index = String(idx);

    col.innerHTML = `
      <div class="d-flex flex-column align-items-center">
        <a class="text-decoration-none" href="${
          sc.url
        }" target="_blank" rel="noopener noreferrer">
          <span class="shortcut-circle">
            <img src="${sc.icon}" alt="${sc.name}" class="shortcut-img"/>
          </span>
          <span class="shortcut-label">${
            sc.name.length > 18 ? sc.name.substring(0, 10) + "..." : sc.name
          }</span>
        </a>

        <div class="mt-1 d-flex gap-1">
          <button class="drag-handle btn btn-sm btn-outline-secondary" type="button" aria-label="Reorder">⋮⋮</button>
          <button class="shortcut-dots btn btn-sm btn-outline-secondary" type="button" aria-haspopup="menu" aria-controls="shortcutMenu" aria-expanded="false">⋯</button>
        </div>
      </div>
    `;

    // Open context menu
    const dots = col.querySelector(".shortcut-dots");
    dots.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      showShortcutMenu(idx, dots);
    });
    dots.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showShortcutMenu(idx, dots);
      }
    });

    shortcutsC.appendChild(col);
  });

  // Add shortcut button (true button for accessibility)
  const add = document.createElement("div");
  add.className = "col shortcut";
  add.innerHTML = `
    <div class="d-flex flex-column align-items-center">
      <button class="btn btn-outline-primary" type="button" id="addShortcutBtn" aria-label="Add shortcut">
        <svg xmlns="http://www.w3.org/2000/svg" class="shortcut-img" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"/>
        </svg>
      </button>
      <span class="shortcut-label">Add</span>
    </div>`;
  add.querySelector("#addShortcutBtn").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    addModal.show();
  });
  shortcutsC.appendChild(add);

  // Sortable with handle (touch-friendly)
  if (window.Sortable) {
    new Sortable(shortcutsC, {
      animation: 150,
      handle: ".drag-handle",
      ghostClass: "drag-ghost",
      // prevent the "Add" tile from being draggable: ignore elements without data-index
      filter: ":not([data-index])",
      onEnd: async () => {
        // Build new order only from draggable tiles
        const tiles = Array.from(shortcutsC.children).filter(
          (el) => el.dataset.index != null
        );
        const newOrder = tiles.map((el) => list[Number(el.dataset.index)]);
        shortcuts = newOrder;

        await fetch("/api/shortcuts/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ shortcuts }),
        });

        // re-render to refresh dataset indices and UI
        renderShortcuts(newOrder);
      },
    });
  }
}

// ─── CONTEXT MENU (pointer + kbd, accessible) ────────────────────────────────
function showShortcutMenu(idx, btn) {
  currentMenuIndex = idx;
  const m = document.getElementById("shortcutMenu");
  m.hidden = false;

  // position near trigger (right aligned)
  const r = btn.getBoundingClientRect();
  const menuWidth = m.offsetWidth || 160;
  let left = r.right - menuWidth + window.scrollX;
  if (left < 8) left = 8;
  const top = r.bottom + 4 + window.scrollY;

  m.style.position = "absolute";
  m.style.left = `${left}px`;
  m.style.top = `${top}px`;

  // ARIA on trigger
  btn.setAttribute("aria-expanded", "true");

  // Close handlers
  const outside = (e) => {
    if (!m.contains(e.target) && e.target !== btn) hideShortcutMenu(btn);
  };
  const onEsc = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      hideShortcutMenu(btn);
      btn.focus();
    }
  };
  // store so we can remove later
  m._outsidePtr = outside;
  m._escKey = onEsc;

  document.addEventListener("pointerdown", outside);
  document.addEventListener("keydown", onEsc);
}

function hideShortcutMenu(triggerBtn) {
  const m = document.getElementById("shortcutMenu");
  m.hidden = true;
  triggerBtn?.setAttribute("aria-expanded", "false");

  if (m._outsidePtr) document.removeEventListener("pointerdown", m._outsidePtr);
  if (m._escKey) document.removeEventListener("keydown", m._escKey);
  m._outsidePtr = null;
  m._escKey = null;
}

// ─── FORM SUBMIT HELPERS ─────────────────────────────────────────────────────
async function handleAddSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("addShortcutName").value.trim();
  const url = document.getElementById("addShortcutURL").value.trim();
  if (!name || !url) return;

  const res = await fetch("/add-shortcut", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ name, url }),
  });
  const j = await res.json();
  if (j.success) {
    renderShortcuts(j.shortcuts);
    addModal.hide();
    document.getElementById("addShortcutName").value = "";
    document.getElementById("addShortcutURL").value = "";
  } else {
    alert(j.error || "Failed to add shortcut.");
  }
}

async function handleRenameSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("renameShortcutName").value.trim();
  const url = document.getElementById("renameShortcutURL").value.trim();
  if (!name || !url) return;

  const res = await fetch("/rename-shortcut", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ index: currentMenuIndex, name, url }),
  });
  const j = await res.json();
  if (j.success) {
    renderShortcuts(j.shortcuts);
    renameModal.hide();
  } else {
    alert(j.error || "Failed to rename shortcut.");
  }
}

async function showPrefsModal() {
  // Load prefs fresh
  const res = await fetch("/api/prefs", { credentials: "same-origin" });
  const p = await res.json();

  const f = document.getElementById("prefsForm");
  // FIX precedence bug: ensure boolean → "true"/"false"
  f.weatherOn.value = String(p.weatherOn) === "true" ? "true" : "false";
  f.searchEngine.value = p.searchEngine || "google";

  // Wallpaper preview
  const currentWall = document.getElementById("currentWall");
  const deleteWallBtn = document.getElementById("deleteWallBtn");
  const deleteWallpaperField = document.getElementById("deleteWallpaperField");
  currentWall.innerHTML = "";
  if (p.wallpaper) {
    const img = document.createElement("img");
    img.src = p.wallpaper;
    img.alt = "Current wallpaper";
    img.style.maxWidth = "150px";
    currentWall.append(img);
    deleteWallBtn.style.display = "";
    deleteWallpaperField.value = "false";
  } else {
    deleteWallBtn.style.display = "none";
    deleteWallpaperField.value = "false";
  }
  deleteWallBtn.onclick = function () {
    currentWall.innerHTML = "";
    deleteWallpaperField.value = "true";
    deleteWallBtn.style.display = "none";
  };

  prefsModal.show();
}

// ─── BOOTSTRAP INITIALIZATION ────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  // grab refs
  loginBtn = document.getElementById("login-btn");
  profileBtn = document.getElementById("profile-btn");
  profilePic = document.getElementById("profile-pic");
  profileMenu = document.getElementById("profile-menu");
  settingsBtn = document.getElementById("settings-btn");
  logoutBtn = document.getElementById("logout-btn");
  shortcutsC = document.getElementById("shortcuts");
  searchForm = document.getElementById("search-form");
  searchInput = document.getElementById("search-input");
  addShortcutForm = document.getElementById("addShortcutForm");
  renameShortcutForm = document.getElementById("renameShortcutForm");

  // modals
  addModal = new bootstrap.Modal(document.getElementById("addShortcutModal"));
  renameModal = new bootstrap.Modal(
    document.getElementById("renameShortcutModal")
  );
  prefsModal = new bootstrap.Modal(document.getElementById("prefsModal"));

  // keep aria-clean when showing/hiding modals
  ["addShortcutModal", "renameShortcutModal", "prefsModal"].forEach((id) => {
    const el = document.getElementById(id);
    el.removeAttribute("aria-hidden");
    el.addEventListener("show.bs.modal", () =>
      el.removeAttribute("aria-hidden")
    );
    el.addEventListener("hide.bs.modal", () => {
      const active = document.activeElement;
      if (el.contains(active)) active.blur();
    });
  });

  // prefs form submit
  document
    .getElementById("prefsForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const formData = new FormData(this);
      const res = await fetch("/api/prefs", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
      if (res.ok) {
        prefsModal.hide();
        // Optional: refresh UI; if you prefer live update, update window.__PREFS and call setters instead
        location.reload();
      } else {
        alert("Failed to save preferences.");
      }
    });

  // auth gate
  if (!(await checkAuth())) {
    window.location.href = "/auth/google";
    return;
  }
  loginBtn.style.display = "none";

  const [user, prefs] = await Promise.all([loadUser(), loadPrefs()]);
  window.__PREFS = prefs || {};

  if (user) initProfile(user);

  // background wallpaper
  if (prefs.wallpaper) {
    document.body.style.background = `url('${prefs.wallpaper}') center/cover no-repeat`;
  }

  // Weather visibility (cooperate with weather-io-widget.js)
  const weatherDiv = document.getElementById("weather-container");
  const on = String(prefs.weatherOn) !== "false";
  if (typeof window.setWeatherVisibility === "function") {
    window.setWeatherVisibility(on);
  } else if (weatherDiv) {
    weatherDiv.style.display = on ? "block" : "none";
  }

  // search engine
  overrideSearch(prefs.searchEngine);

  // shortcuts
  renderShortcuts(await loadShortcuts());

  // context menu actions
  document.getElementById("menuEdit").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    hideShortcutMenu();
    const sc = shortcuts[currentMenuIndex];
    if (!sc) return;
    document.getElementById("renameShortcutName").value = sc.name;
    document.getElementById("renameShortcutURL").value = sc.url;
    renameModal.show();
  });

  document
    .getElementById("menuRemove")
    .addEventListener("pointerdown", async (e) => {
      e.preventDefault();
      hideShortcutMenu();
      if (!confirm("Remove this shortcut?")) return;

      const res = await fetch("/remove-shortcut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ index: currentMenuIndex }),
      });
      const j = await res.json();
      if (j.success) renderShortcuts(j.shortcuts);
      else alert(j.error || "Failed to remove shortcut.");
    });

  // form submits
  addShortcutForm.addEventListener("submit", handleAddSubmit);
  renameShortcutForm.addEventListener("submit", handleRenameSubmit);
});
