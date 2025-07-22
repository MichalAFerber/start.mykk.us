// assets/js/widgets/pomodoro.widget.js
const tpl = document.createElement("template");
tpl.innerHTML = `
  <style>
    .pomo-card { background: #343a40; color:#fff; border-radius:5px; }
    .pomo-header { padding:8px; text-align:center; cursor:move; font-weight:bold; }
    .pomo-body   { padding:16px; text-align:center; }
    .pomo-body button { margin:0 4px; }
  </style>
  <div class="pomo-card">
    <div class="pomo-header">Pomodoro</div>
    <div class="pomo-body">
      <div id="widget-pomo-display" style="font-size:2rem">25:00</div>
      <button id="pomo-start" class="btn btn-sm btn-success">Start</button>
      <button id="pomo-reset" class="btn btn-sm btn-secondary">Reset</button>
    </div>
  </div>
`;

export default {
  id: "pomodoro",
  w: 4,
  h: 2,
  template: tpl,
  init() {
    let secs = 25 * 60,
      timer = null;
    const disp = document.getElementById("widget-pomo-display");
    const fmt = (s) => {
      const m = String(Math.floor(s / 60)).padStart(2, "0"),
        sec = String(s % 60).padStart(2, "0");
      return `${m}:${sec}`;
    };
    document.getElementById("pomo-start").onclick = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (secs-- > 0) disp.textContent = fmt(secs);
        else {
          clearInterval(timer);
          timer = null;
          alert("⏰ Done!");
        }
      }, 1000);
    };
    document.getElementById("pomo-reset").onclick = () => {
      clearInterval(timer);
      timer = null;
      secs = 25 * 60;
      disp.textContent = "25:00";
    };
  },
};
