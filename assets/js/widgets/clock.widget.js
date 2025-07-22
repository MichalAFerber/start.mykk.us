// assets/js/widgets/clock.widget.js
const tpl = document.createElement("template");
tpl.innerHTML = `
  <style>
    .clock-card { background: #343a40; color: #fff; border-radius: 5px; }
    .clock-header { padding:8px; text-align:center; cursor:move; font-weight:bold; }
    .clock-body   { padding:16px; font-size:2rem; text-align:center; }
  </style>
  <div class="clock-card">
    <div class="clock-header">Clock</div>
    <div class="clock-body" id="widget-clock">00:00:00</div>
  </div>
`;

export default {
  id: "clock",
  w: 4,
  h: 2,
  template: tpl,
  init() {
    const disp = document.getElementById("widget-clock");
    function upd() {
      const now = new Date();
      disp.textContent = now.toLocaleTimeString();
    }
    upd();
    setInterval(upd, 1000);
  },
};
