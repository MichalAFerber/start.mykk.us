// public/app.js

// ─── ICON CONSTANTS ───────────────────────────────────────────────────────────
const ICON_SEARCH = "material-symbols:search";
const ICON_LOGIN = "material-symbols:login";
const ICON_ADD = "material-symbols:add-circle-outline";

// ─── STATE & MODAL INSTANCES ─────────────────────────────────────────────────
let shortcuts = [];
let currentMenuIndex = null;
let addModal, renameModal;

// ─── GLOBAL REFS ──────────────────────────────────────────────────────────────
let loginBtn,
  profileBtn,
  profilePic,
  profileMenu,
  settingsBtn,
  prefsModal,
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
  profilePic.addEventListener("click", (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle("open");
  });
  document.addEventListener("click", () => {
    profileMenu.classList.remove("open");
  });
  settingsBtn.onclick = () => {
    showPrefsModal();
  };
  logoutBtn.onclick = () => (location.href = "/logout");
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
    window.open(urls[engine] || urls.google, "_blank");
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
    d.className = "col shortcut";
    d.dataset.index = idx;
    d.innerHTML = `
      <a href="${sc.url}" target="_blank">
        <span class="shortcut-circle">
          <img src="${sc.icon}" alt="${sc.name}" class="shortcut-img"/>
        </span>
        <span class="shortcut-label">${
          sc.name.length > 18 ? sc.name.substring(0, 10) + "..." : sc.name
        }</span>
      </a>
      <button class="shortcut-dots">⋮</button>`;
    d.querySelector(".shortcut-dots").onclick = (e) => {
      e.stopPropagation();
      showShortcutMenu(idx, e.target);
    };
    shortcutsC.appendChild(d);
  });

  // add‐button
  const add = document.createElement("div");
  add.className = "col shortcut";
  add.innerHTML = `<span class="shortcut-circle">
  <svg xmlns="http://www.w3.org/2000/svg" class="shortcut-img" viewBox="0 0 24 24"><path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"/></svg>
  <span>`;
  add.onclick = () => addModal.show();
  shortcutsC.appendChild(add);

  Sortable.create(shortcutsC, {
    animation: 150,
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
  // Remove .open from menu so we can measure offsetWidth/offsetHeight (if needed)
  m.classList.remove("open");

  // Get button position in viewport
  const r = btn.getBoundingClientRect();
  // m.style.left = `${r.left}px`;
  // m.style.top = `${r.bottom + 4}px`;
  // Prefer right-align, but keep on screen if near right edge
  const menuWidth = m.offsetWidth || 150; // fallback if not rendered yet
  let left = r.right - menuWidth;
  if (left < 8) left = 8; // minimum left padding
  let top = r.bottom + 4 + window.scrollY;

  // Set position
  m.style.left = `${left + window.scrollX}px`;
  m.style.top = `${top}px`;

  // Now show for real
  m.classList.add("open");

  setTimeout(() => {
    document.addEventListener("mousedown", outsideClickForShortcutMenu);
  }, 0);
}

function outsideClickForShortcutMenu(e) {
  if (!document.getElementById("shortcutMenu").contains(e.target)) {
    hideShortcutMenu();
  }
}
function hideShortcutMenu() {
  const m = document.getElementById("shortcutMenu");
  m.classList.remove("open");
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
  // Load prefs
  const res = await fetch("/api/prefs");
  const p = await res.json();
  const f = document.getElementById("prefsForm");
  f.weatherOn.value = "" + p.weatherOn === "true" ? "true" : "false";
  f.searchEngine.value = p.searchEngine || "google";
  // Wallpaper preview
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
  // Handle Delete button click
  deleteWallBtn.onclick = function () {
    currentWall.innerHTML = "";
    deleteWallpaperField.value = "true";
    deleteWallBtn.style.display = "none";
  };
  prefsModal.show();
}

// ─── BOOTSTRAP INITIALIZATION ────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  // grab DOM refs
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

  // instantiate the Bootstrap modals
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
      const res = await fetch("/api/prefs", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        prefsModal.hide();
        // Optional: reload UI or show success message
        location.reload();
      } else {
        alert("Failed to save preferences.");
      }
    });

  // Strip any lingering aria-hidden on show
  ["addShortcutModal", "renameShortcutModal", "prefsModal"].forEach((id) => {
    const el = document.getElementById(id);
    el.removeAttribute("aria-hidden");
    el.addEventListener("show.bs.modal", () =>
      el.removeAttribute("aria-hidden")
    );

    // *** NEW: blur focused descendants on hide so no focused node remains under aria-hidden ***
    el.addEventListener("hide.bs.modal", () => {
      const active = document.activeElement;
      if (el.contains(active)) active.blur();
    });
  });

  // Auth
  if (!(await checkAuth())) {
    window.location.href = "/auth/google";
    return;
  }
  loginBtn.style.display = "none";
  const [user, prefs] = await Promise.all([loadUser(), loadPrefs()]);
  if (user) initProfile(user);

  // Background
  if (prefs.wallpaper) {
    document.body.style.background = `url('${prefs.wallpaper}') center/cover no-repeat`;
  }

  //Weather Widget
const weatherDiv = document.getElementById("weather-container");
if (prefs.weatherOn) {
  weatherDiv.style.display = "block";
} else {
  weatherDiv.style.display = "none";
}

  overrideSearch(prefs.searchEngine);
  renderShortcuts(await loadShortcuts());

  // context‐menu actions
  document.getElementById("menuEdit").onclick = () => {
    hideShortcutMenu();
    // pre-fill rename form
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

  // wire up form submissions
  addShortcutForm.onsubmit = handleAddSubmit;
  renameShortcutForm.onsubmit = handleRenameSubmit;
});
