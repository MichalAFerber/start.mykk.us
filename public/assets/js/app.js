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
  const res = await fetch("/api/user");
  return res.ok;
}
async function loadUser() {
  const res = await fetch("/api/user");
  return res.ok ? await res.json() : null;
}
async function loadPrefs() {
  const res = await fetch("/api/prefs");
  return res.ok ? await res.json() : {};
}

// ─── PROFILE UI ───────────────────────────────────────────────────────────────
function initProfile(user) {
  profilePic.src = user.photo;
  profileBtn.style.display = "block";

  settingsBtn.onclick = () => showPrefsModal();
  logoutBtn.onclick = () => (location.href = "/logout");

  // simple popover menu
  const toggleMenu = () => {
    const open = profileMenu.hasAttribute("hidden");
    if (open) profileMenu.removeAttribute("hidden");
    else profileMenu.setAttribute("hidden", "");
  };
  document.getElementById("settings-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });
  document.addEventListener("click", () =>
    profileMenu.setAttribute("hidden", "")
  );
}

// ─── SEARCH OVERRIDE ──────────────────────────────────────────────────────────
function overrideSearch(engine) {
  searchInput.focus();
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = encodeURIComponent(searchInput.value.trim());
    if (!q) return;
    const urls = {
      google: `https://www.google.com/search?q=${q}`,
      ddg: `https://duckduckgo.com/?q=${q}`,
      bing: `https://www.bing.com/search?q=${q}`,
    };
    window.open(urls[engine] || urls.google, "_blank", "noopener");
    searchInput.value = "";
    searchInput.focus();
  });
}

// ─── SHORTCUTS ────────────────────────────────────────────────────────────────
async function loadShortcuts() {
  const r = await fetch("/api/shortcuts");
  return r.ok ? await r.json() : [];
}

function renderShortcuts(list) {
  shortcuts = list;
  shortcutsC.innerHTML = "";

  list.forEach((sc, idx) => {
    const d = document.createElement("div");
    d.className = "shortcut";
    d.dataset.index = idx;

    d.innerHTML = `
      <a href="${sc.url}" target="_blank" rel="noopener">
        <span class="shortcut-circle">
          <img src="${sc.icon}" alt="${sc.name}" class="shortcut-img"/>
        </span>
        <span class="shortcut-label">${sc.name}</span>
      </a>
      <button class="shortcut-dots" aria-label="Open menu" title="More">⋮</button>
    `;

    d.querySelector(".shortcut-dots").onclick = (e) => {
      e.stopPropagation();
      showShortcutMenu(idx, e.currentTarget);
    };

    shortcutsC.appendChild(d);
  });

  // Add tile
  const add = document.createElement("div");
  add.className = "shortcut add-tile";
  add.innerHTML = `
    <button type="button" id="addShortcutBtn" class="btn-reset" aria-label="Add shortcut" title="Add">
      <span class="shortcut-circle">
        <svg xmlns="http://www.w3.org/2000/svg" class="shortcut-img" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"/>
        </svg>
      </span>
      <span class="shortcut-label">Add</span>
    </button>
  `;
  add.querySelector("#addShortcutBtn").onclick = () => addModal.show();
  shortcutsC.appendChild(add);

  // Sortable over a flex grid
  Sortable.create(shortcutsC, {
    animation: 150,
    filter: ".add-tile",
    preventOnFilter: false,
    ghostClass: "drag-ghost",
    onEnd: async () => {
      const newOrder = Array.from(shortcutsC.children)
        .filter((el) => el.dataset.index != null)
        .map((el) => shortcuts[+el.dataset.index]);
      shortcuts = newOrder;
      await fetch("/api/shortcuts/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortcuts }),
      });
      renderShortcuts(newOrder);
    },
  });
}

// ─── CONTEXT MENU ─────────────────────────────────────────────────────────────
function showShortcutMenu(idx, btn) {
  currentMenuIndex = idx;
  const m = document.getElementById("shortcutMenu");
  m.removeAttribute("hidden");

  const r = btn.getBoundingClientRect();
  const menuWidth = m.offsetWidth || 150;
  let left = r.right - menuWidth;
  if (left < 8) left = 8;
  let top = r.bottom + 4 + window.scrollY;

  m.style.left = `${left + window.scrollX}px`;
  m.style.top = `${top}px`;

  setTimeout(
    () => document.addEventListener("mousedown", outsideClickForShortcutMenu),
    0
  );
}
function outsideClickForShortcutMenu(e) {
  const m = document.getElementById("shortcutMenu");
  if (!m.contains(e.target)) hideShortcutMenu();
}
function hideShortcutMenu() {
  const m = document.getElementById("shortcutMenu");
  m.setAttribute("hidden", "");
  document.removeEventListener("mousedown", outsideClickForShortcutMenu);
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
    body: JSON.stringify({ name, url }),
  });
  const j = await res.json();
  if (j.success) {
    renderShortcuts(j.shortcuts);
    addModal.hide();
    document.getElementById("addShortcutName").value = "";
    document.getElementById("addShortcutURL").value = "";
  } else alert(j.error);
}
async function handleRenameSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("renameShortcutName").value.trim();
  const url = document.getElementById("renameShortcutURL").value.trim();
  if (!name || !url) return;
  const res = await fetch("/rename-shortcut", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index: currentMenuIndex, name, url }),
  });
  const j = await res.json();
  if (j.success) {
    renderShortcuts(j.shortcuts);
    renameModal.hide();
  } else alert(j.error);
}

async function showPrefsModal() {
  const res = await fetch("/api/prefs");
  const p = await res.json();
  const f = document.getElementById("prefsForm");
  f.weatherOn.value = "" + p.weatherOn === "true" ? "true" : "false";
  f.searchEngine.value = p.searchEngine || "google";

  const currentWall = document.getElementById("currentWall");
  const deleteWallBtn = document.getElementById("deleteWallBtn");
  const deleteWallpaperField = document.getElementById("deleteWallpaperField");
  currentWall.innerHTML = "";
  if (p.wallpaper) {
    const img = document.createElement("img");
    img.src = p.wallpaper;
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

// ─── WEATHER RIBBON (weatherwidget.io) ───────────────────────────────────────
function mountWeatherRibbon(prefs) {
  const container = document.getElementById("weather-container");
  container.innerHTML = "";

  if (!prefs.weatherOn) {
    container.style.display = "none";
    return;
  }

  // build anchor
  const a = document.createElement("a");
  a.className = "weatherwidget-io";
  a.href = "https://forecast7.com/en/40d71n74d01/new-york/?unit=us"; // default; can be swapped by geolocation
  a.setAttribute("data-label_1", "Lake City, SC");
  a.setAttribute("data-label_2", "Weather");
  a.setAttribute("data-theme", "dark");
  a.textContent = "WEATHER";
  a.style.cssText = "display:block;width:100%;height:120px;";
  container.appendChild(a);

  container.style.display = "flex";

  // load or re-init script
  const loader = document.getElementById("weatherwidget-io-js");
  if (window.__weatherwidget_init) {
    window.__weatherwidget_init();
  } else if (!loader) {
    const js = document.createElement("script");
    js.id = "weatherwidget-io-js";
    js.src = "https://weatherwidget.io/js/widget.min.js";
    document.body.appendChild(js);
  }
}

// ─── BOOTSTRAP INITIALIZATION ────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
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

  addModal = new bootstrap.Modal(document.getElementById("addShortcutModal"));
  renameModal = new bootstrap.Modal(
    document.getElementById("renameShortcutModal")
  );
  prefsModal = new bootstrap.Modal(document.getElementById("prefsModal"));

  document
    .getElementById("prefsForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const formData = new FormData(this);
      const res = await fetch("/api/prefs", { method: "POST", body: formData });
      if (res.ok) {
        prefsModal.hide();
        location.reload();
      } else {
        alert("Failed to save preferences.");
      }
    });

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

  if (!(await checkAuth())) {
    window.location.href = "/auth/google";
    return;
  }
  loginBtn.style.display = "none";

  const [user, prefs] = await Promise.all([loadUser(), loadPrefs()]);
  if (user) initProfile(user);

  if (prefs.wallpaper) {
    document.body.style.background = `url('${prefs.wallpaper}') center/cover no-repeat`;
  }

  overrideSearch(prefs.searchEngine || "google");
  renderShortcuts(await loadShortcuts());

  // context menu actions
  document.getElementById("menuEdit").onclick = () => {
    hideShortcutMenu();
    const sc = shortcuts[currentMenuIndex];
    document.getElementById("renameShortcutName").value = sc.name;
    document.getElementById("renameShortcutURL").value = sc.url;
    renameModal.show();
  };
  document.getElementById("menuRemove").onclick = async () => {
    hideShortcutMenu();
    if (!confirm("Remove this shortcut?")) return;
    const res = await fetch("/remove-shortcut", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index: currentMenuIndex }),
    });
    const j = await res.json();
    if (j.success) renderShortcuts(j.shortcuts);
  };

  addShortcutForm.onsubmit = handleAddSubmit;
  renameShortcutForm.onsubmit = handleRenameSubmit;

  // Weather ribbon
  mountWeatherRibbon(prefs);
});
