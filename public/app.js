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
  settingsBtn.onclick = () => (location.href = "/prefs");
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
  const r = await fetch("/shortcuts.json");
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
      <a href="${sc.url}" target="_blank">
        <img src="${sc.icon}" width="48" height="48"/>
        <span class="shortcut-label">${
          sc.name.length > 13 ? sc.name.substring(0, 13) + "..." : sc.name
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
  add.className = "shortcut add";
  add.innerHTML = `<span class="iconify" data-icon="${ICON_ADD}"></span>`;
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
  const r = btn.getBoundingClientRect();
  m.style.left = `${r.left}px`;
  m.style.top = `${r.bottom + 4}px`;
  m.style.display = "flex";
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
  m.style.display = "none";
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

  // Strip any lingering aria-hidden on show
  ["addShortcutModal", "renameShortcutModal"].forEach((id) => {
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
  } else if (prefs.bgColor) {
    document.body.style.background = prefs.bgColor;
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
