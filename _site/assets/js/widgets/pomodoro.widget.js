const tpl = document.createElement("template");
tpl.innerHTML = `
  <div class="grid-stack-item-content card">
    <div class="body d-flex flex-row align-items-center justify-content-center" style="gap: 0.5rem;">
      <div id="widget-pomo-display" style="font-size:2rem;">25:00</div>
      <iconify-icon id="pomo-start" class="iconify icon-btn start-icon" style="color: #28a745;" icon="mdi:play-circle-outline" width="32" height="32"></iconify-icon>
      <iconify-icon id="pomo-reset" class="iconify icon-btn reset-icon" style="color: #6c757d;" icon="mdi:restart" width="32" height="32"></iconify-icon>
    </div>
  </div>
`;

export default {
  id: "pomodoro",
  w: 3,
  h: 1,
  template: tpl,
  init() {
    let secs = 25 * 60;
    let timer = null;
    const el = document.querySelector('[data-gs-id="pomodoro"]');
    if (!el) return;

    const disp = el.querySelector("#widget-pomo-display");
    const startBtn = el.querySelector("#pomo-start");
    const resetBtn = el.querySelector("#pomo-reset");

    const fmt = (s) => {
      const m = String(Math.floor(s / 60)).padStart(2, "0");
      const sec = String(s % 60).padStart(2, "0");
      return `${m}:${sec}`;
    };

    startBtn.onclick = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (secs-- > 0) {
          disp.textContent = fmt(secs);
        } else {
          clearInterval(timer);
          timer = null;
          alert("⏰ Done!");
        }
      }, 1000);
    };

    resetBtn.onclick = () => {
      clearInterval(timer);
      timer = null;
      secs = 25 * 60;
      disp.textContent = fmt(secs);
    };

    disp.textContent = fmt(secs);
  },
};
