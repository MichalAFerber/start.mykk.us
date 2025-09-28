// function loadWeatherWidget(city, slug) {
//   const html = `<a class="weatherwidget-io"
//     href="https://forecast7.com/en/${slug}/${city}/?unit=us"
//     data-label_1="Lake City, SC"
//     data-label_2="Weather"
//     data-theme="weather_one"
//     >${city.toUpperCase()} WEATHER</a>`;
//   document.getElementById("weather-container").innerHTML = html;

//   // Always re-init the widget after injection
//   if (window.__weatherwidget_init) {
//     window.__weatherwidget_init();
//   }
// }

// loadWeatherWidget("lake-city", "33d87n79d76");


// WeatherWidget.io integration with optional user prefs toggle
// Expects a container: <div id="weather-container"></div>
// And loader script included in HTML: <script id="weatherwidget-io-js" src="https://weatherwidget.io/js/widget.min.js"></script>

(function () {
  const container = document.getElementById('weather-container');

  function render(city, slug, unit = 'us', theme = 'dark', label1 = '', label2 = 'WEATHER') {
    if (!container) return;

    // Build the anchor WeatherWidget.io expects
    const labelText = (label1 || city).toUpperCase();
    container.innerHTML = `
      <a class="weatherwidget-io"
         href="https://forecast7.com/en/${slug}/${city}/?unit=${unit}"
         data-label_1="${labelText}"
         data-label_2="${label2}"
         data-theme="${theme}">
         ${labelText} ${label2}
      </a>
    `;

    // Initialize/re-initialize the widget
    if (window.__weatherwidget_init) {
      window.__weatherwidget_init();
    }
  }

  // Toggle visibility via prefs.weatherOn if available (your app should set this)
  function applyVisibilityFromPrefs() {
    if (!container) return;
    try {
      // Assumes your app.js exposes prefs globally or attaches to window.__PREFS
      const prefs = window.__PREFS || {};
      container.style.display = (String(prefs.weatherOn) === 'false') ? 'none' : 'block';
    } catch { /* no-op */ }
  }

  // Basic: render NYC as default (you can swap to user’s saved city)
  document.addEventListener('DOMContentLoaded', () => {
    applyVisibilityFromPrefs();
    // Default: NYC; replace with saved user city if you have one
    render('new-york', '40d71n74d01', 'us', 'dark');
  });

  // Optionally expose a way for app.js to update the widget dynamically:
  window.updateWeatherWidget = function ({ city, slug, unit = 'us', theme = 'dark', label1 = '', label2 = 'WEATHER' }) {
    render(city, slug, unit, theme, label1, label2);
  };

  window.setWeatherVisibility = function (on) {
    if (!container) return;
    container.style.display = on ? 'block' : 'none';
  };
})();
