function getUserLocation(callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => callback(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        // Permission denied or error; fallback to NYC
        callback(40.7128, -74.006);
      }
    );
  } else {
    // Geolocation not supported; fallback to NYC
    callback(40.7128, -74.006);
  }
}

function loadTomorrowSDK(cb) {
  if (window.__TOMORROW__) return cb();
  const js = document.createElement("script");
  js.src = "https://www.tomorrow.io/v1/widget/sdk/sdk.bundle.min.js";
  js.onload = cb;
  document.body.appendChild(js);
}

function renderWeatherWidget(lat, lon) {
  // Remove previous widget if present
  const container = document.getElementById("weather-widget-container");
  container.innerHTML = "";

  window.__TOMORROW__.Widget({
    location: [lat, lon],
    language: "EN",
    unitSystem: "IMPERIAL", // Or "METRIC"
    skin: "dark",
    widgetType: "upcoming", // "upcoming" matches your HTML config
    container: "weather-widget-container",
    // You can add your Tomorrow.io widget key here if required
    // apiKey: "YOUR_TOMORROW_IO_PUBLIC_WIDGET_KEY",
  });
}

// Main
getUserLocation(function (lat, lon) {
  loadTomorrowSDK(function () {
    renderWeatherWidget(lat, lon);
  });
});
