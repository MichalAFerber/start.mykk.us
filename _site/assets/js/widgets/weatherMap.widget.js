const tpl = document.createElement("template");
tpl.innerHTML = `
  <style>
    .card {
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .body {
      flex-grow: 1;
      overflow: hidden;
    }
    .body iframe {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
    }
  </style>
  <div class="grid-stack-item-content card">
    <div class="body">
        <iframe src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&metricWind=default&zoom=7&overlay=radar&product=radar&level=surface&lat=33.138&lon=-80.285" allow="autoplay"></iframe>
    </div>
  </div>
`;

export default {
  id: "weatherMap",
  w: 3,
  h: 9,
  template: tpl,
  init() {},
};
