function loadWeatherWidget(city, slug) {
  const html = `<a class="weatherwidget-io"
    href="https://forecast7.com/en/${slug}/${city}/?unit=us"
    data-label_1="Lake City, SC"
    data-label_2="Weather"
    data-theme="weather_one"
    >${city.toUpperCase()} WEATHER</a>`;
  document.getElementById("weather-container").innerHTML = html;

  // Always re-init the widget after injection
  if (window.__weatherwidget_init) {
    window.__weatherwidget_init();
  }
}

loadWeatherWidget("lake-city", "33d87n79d76");