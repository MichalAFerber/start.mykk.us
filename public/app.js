// public/app.js

let shortcuts = [];
let currentRenameIndex = null;
let currentMenuIndex = null;

// --- Shortcuts ---
async function loadShortcuts() {
  const resp = await fetch("shortcuts.json");
  return await resp.json();
}

function renderShortcuts(list) {
  shortcuts = list;
  const container = document.getElementById("shortcuts");
  container.innerHTML = "";
  list.forEach((sc, idx) => {
    const shortcutDiv = document.createElement("div");
    shortcutDiv.className = "shortcut";

    // Shortcut icon and label
    const a = document.createElement("a");
    a.href = sc.url;
    a.target = "_blank";
    a.innerHTML = `<img src="${sc.icon}" alt="${sc.name}"><span class="shortcut-label">${sc.name}</span>`;
    shortcutDiv.appendChild(a);

    // Three-dot menu button
    const dots = document.createElement("button");
    dots.className = "shortcut-dots";
    dots.innerHTML = "&#x22EE;"; // vertical ellipsis
    dots.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      showShortcutMenu(idx, dots);
    };
    shortcutDiv.appendChild(dots);

    container.appendChild(shortcutDiv);
  });

  // Add shortcut button
  const add = document.createElement("div");
  add.className = "shortcut add";
  add.style.position = "relative";
  add.innerHTML = `<span class="iconify" data-icon="ep:circle-plus" data-width="48" data-height="48"></span>
    <span class="shortcut-label">Add shortcut</span>`;
  add.onclick = (e) => {
    e.preventDefault();
    showAddShortcutModal();
  };
  container.appendChild(add);
}

// --- Shortcut Menu ---
function showShortcutMenu(idx, anchorEl) {
  const menu = document.getElementById("shortcutMenu");
  menu.style.display = "block";
  // Position menu below the three-dot button
  const rect = anchorEl.getBoundingClientRect();
  menu.style.left = `${rect.left + window.scrollX}px`;
  menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
  currentMenuIndex = idx;

  // Hide menu on click outside
  setTimeout(() => {
    document.addEventListener("mousedown", handleMenuOutsideClick);
  }, 0);
}
function hideShortcutMenu() {
  document.getElementById("shortcutMenu").style.display = "none";
  document.removeEventListener("mousedown", handleMenuOutsideClick);
  currentMenuIndex = null;
}
function handleMenuOutsideClick(e) {
  const menu = document.getElementById("shortcutMenu");
  if (!menu.contains(e.target)) {
    hideShortcutMenu();
  }
}
document.getElementById("menuRename").onclick = () => {
  hideShortcutMenu();
  showRenameShortcutModal(currentMenuIndex);
};
document.getElementById("menuRemove").onclick = () => {
  hideShortcutMenu();
  removeShortcut(currentMenuIndex);
};

// --- Add Shortcut Modal ---
function showAddShortcutModal() {
  document.getElementById("addShortcutModal").style.display = "flex";
  document.getElementById("addShortcutName").value = "";
  document.getElementById("addShortcutURL").value = "";
  document.getElementById("addShortcutName").focus();
}
function hideAddShortcutModal() {
  document.getElementById("addShortcutModal").style.display = "none";
}
document.getElementById("addShortcutCancel").onclick = hideAddShortcutModal;
document.getElementById("addShortcutForm").onsubmit = function (e) {
  e.preventDefault();
  const name = document.getElementById("addShortcutName").value.trim();
  const url = document.getElementById("addShortcutURL").value.trim();
  if (!name || !url) return;
  fetch("/add-shortcut", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, url }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        renderShortcuts(data.shortcuts);
        hideAddShortcutModal();
      } else {
        alert("Error adding shortcut: " + data.error);
      }
    });
};

// --- Rename Shortcut Modal ---
function showRenameShortcutModal(idx) {
  currentRenameIndex = idx;
  document.getElementById("renameShortcutName").value = shortcuts[idx].name;
  document.getElementById("renameShortcutModal").style.display = "flex";
  document.getElementById("renameShortcutName").focus();
}
function hideRenameShortcutModal() {
  document.getElementById("renameShortcutModal").style.display = "none";
  currentRenameIndex = null;
}
document.getElementById("renameShortcutCancel").onclick =
  hideRenameShortcutModal;
document.getElementById("renameShortcutForm").onsubmit = function (e) {
  e.preventDefault();
  const newName = document.getElementById("renameShortcutName").value.trim();
  if (!newName) return;
  // Update shortcut name and save
  const shortcut = shortcuts[currentRenameIndex];
  fetch("/rename-shortcut", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index: currentRenameIndex, name: newName }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        renderShortcuts(data.shortcuts);
        hideRenameShortcutModal();
      } else {
        alert("Error renaming shortcut: " + data.error);
      }
    });
};

// --- Remove Shortcut ---
function removeShortcut(idx) {
  if (!confirm("Remove this shortcut?")) return;
  fetch("/remove-shortcut", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index: idx }), // idx is a number
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        renderShortcuts(data.shortcuts);
      } else {
        alert("Error removing shortcut: " + data.error);
      }
    });
}


// --- Weather ---
const WEATHER_API_KEY = "33559eb5f9da332aa21f41ffa27a7993"; // Replace with your API key
const WEATHER_CITY_ID = 4584322; // Lake City, SC

async function fetchWeather() {
  const url = `https://api.openweathermap.org/data/2.5/weather?id=${WEATHER_CITY_ID}&units=imperial&appid=${WEATHER_API_KEY}`;
  const resp = await fetch(url);
  return await resp.json();
}

async function fetchForecast() {
  // For 5-day/3-hour forecast (free tier)
  const url = `https://api.openweathermap.org/data/2.5/forecast?id=${WEATHER_CITY_ID}&units=imperial&appid=${WEATHER_API_KEY}`;
  const resp = await fetch(url);
  return await resp.json();
}

function renderWeatherSummary(data) {
  const el = document.getElementById("weather-summary");
  if (!data.weather || !data.weather[0]) {
    el.innerHTML = `<span>Weather unavailable</span>`;
    return;
  }
  const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  el.innerHTML = `<img src="${icon}" width="32" height="32" alt=""><span>${
    data.name
  }</span> <span>${Math.round(data.main.temp)}°F</span>`;
}

function renderForecast(forecast) {
  const el = document.getElementById("weather-forecast");
  // Group by day
  const days = {};
  forecast.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString();
    if (!days[day]) days[day] = [];
    days[day].push(item);
  });
  el.innerHTML = Object.keys(days)
    .slice(0, 5)
    .map((day) => {
      const items = days[day];
      const temps = items.map((i) => i.main.temp);
      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      const icon = `https://openweathermap.org/img/wn/${items[0].weather[0].icon}.png`;
      return `<div class="weather-forecast-day">
      <span>${new Date(items[0].dt * 1000).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })}</span>
      <img src="${icon}" width="24" height="24" alt="">
      <span>${Math.round(avgTemp)}°F</span>
    </div>`;
    })
    .join("");
}

async function setupWeather() {
  const summary = await fetchWeather();
  renderWeatherSummary(summary);

  let forecastData = null;
  const summaryEl = document.getElementById("weather-summary");
  const forecastEl = document.getElementById("weather-forecast");

  summaryEl.onclick = async () => {
    if (!forecastData) {
      forecastData = await fetchForecast();
      renderForecast(forecastData);
    }
    forecastEl.style.display =
      forecastEl.style.display === "none" ? "block" : "none";
  };

  document.addEventListener("click", (e) => {
    if (!document.getElementById("weather-widget").contains(e.target)) {
      forecastEl.style.display = "none";
    }
  });
}

// --- Init ---
(async function () {
  const list = await loadShortcuts();
  renderShortcuts(list);
  setupWeather();
})();
