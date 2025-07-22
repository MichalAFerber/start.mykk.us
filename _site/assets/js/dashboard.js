// assets/js/dashboard.js
window.onload = function () {
  const grid = GridStack.init(
    {
      cellHeight: 100,
      draggable: { handle: ".card-header" },
      resizable: { handles: "e, se, s, sw, w" },
    },
    ".landing-grid"
  );

  const widgets = [
    {
      id: "clock",
      x: 0,
      y: 0,
      w: 4,
      h: 2,
      content: `
        <div class="card bg-dark text-white">
          <div class="card-header text-center">Clock</div>
          <div class="card-body d-flex justify-content-center align-items-center">
            <span id="widget-clock" style="font-size:2rem;"></span>
          </div>
        </div>`,
    },
    {
      id: "pomodoro",
      x: 4,
      y: 0,
      w: 4,
      h: 2,
      content: `
        <div class="card bg-dark text-white">
          <div class="card-header text-center">Pomodoro</div>
          <div class="card-body d-flex flex-column justify-content-center align-items-center">
            <span id="widget-pomo-display" style="font-size:2rem;">25:00</span>
            <div class="mt-2">
              <button id="pomo-start" class="btn btn-sm btn-success">Start</button>
              <button id="pomo-reset" class="btn btn-sm btn-secondary">Reset</button>
            </div>
          </div>
        </div>`,
    },
  ];

  grid.removeAll();
  widgets.forEach((w) => {
    const el = document.createElement("div");
    el.className = "grid-stack-item";
    el.id = w.id;
    el.setAttribute("gs-x", w.x);
    el.setAttribute("gs-y", w.y);
    el.setAttribute("gs-w", w.w);
    el.setAttribute("gs-h", w.h);
    el.innerHTML = `<div class="grid-stack-item-content">${w.content}</div>`;
    grid.el.appendChild(el);
  });
  grid.compact();

  // Clock
  function updateClock() {
    const now = new Date();
    document.getElementById("widget-clock").textContent =
      now.toLocaleTimeString();
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Pomodoro
  let seconds = 25 * 60,
    timer = null;
  const disp = document.getElementById("widget-pomo-display");
  document.getElementById("pomo-start").onclick = () => {
    if (timer) return;
    timer = setInterval(() => {
      if (seconds-- > 0) {
        const m = String(Math.floor(seconds / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");
        disp.textContent = `${m}:${s}`;
      } else {
        clearInterval(timer);
        timer = null;
        alert("⏰ Time's up!");
      }
    }, 1000);
  };
  document.getElementById("pomo-reset").onclick = () => {
    clearInterval(timer);
    timer = null;
    seconds = 25 * 60;
    disp.textContent = "25:00";
  };

  // Persist layout
  grid.on("change", (_, items) => {
    localStorage.setItem(
      "landingLayout",
      JSON.stringify(
        items.map((i) => ({
          id: i.el.id,
          x: i.x,
          y: i.y,
          w: i.w,
          h: i.h,
        }))
      )
    );
  });

  // Restore layout
  const saved = localStorage.getItem("landingLayout");
  if (saved) grid.load(JSON.parse(saved));
};
