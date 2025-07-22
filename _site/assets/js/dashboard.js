// assets/js/dashboard.js
import clockWidget from "./widgets/clock.widget.js";
import pomodoroWidget from "./widgets/pomodoro.widget.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1) init GridStack (global from gridstack-all.js)
  const grid = GridStack.init({
    cellHeight: 100,
    draggable: { handle: ".clock-header, .pomo-header" },
    resizable: { handles: "e,se,s,sw,w" },
  });

  // 2) define your two widgets with default x/y
  const widgets = [
    { ...clockWidget, x: 0, y: 0 },
    { ...pomodoroWidget, x: 4, y: 0 },
  ];

  // 3) restore & merge saved layout
  const KEY = "landingLayout";
  const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
  if (saved.length) {
    // saved is array of { id, x, y, w, h }
    for (let w of widgets) {
      const found = saved.find((s) => s.id === w.id);
      if (found) {
        w.x = found.x;
        w.y = found.y;
        w.w = found.w;
        w.h = found.h;
      }
    }
  }

  // 4) clear out any existing items and re‑add from our merged list
  grid.removeAll();
  widgets.forEach((w) => {
    const wrapper = document.createElement("div");
    wrapper.className = "grid-stack-item";
    wrapper.setAttribute("data-gs-id", w.id);
    wrapper.setAttribute("data-gs-x", w.x);
    wrapper.setAttribute("data-gs-y", w.y);
    wrapper.setAttribute("data-gs-w", w.w);
    wrapper.setAttribute("data-gs-h", w.h);
    // inject the widget’s own template
    wrapper.appendChild(w.template.content.cloneNode(true));
    grid.el.appendChild(wrapper);
  });
  grid.compact();

  // 5) whenever anything moves/resizes, re‑serialize to localStorage
  grid.on("change", (_e, items) => {
    const layout = items.map((i) => ({
      id: i.el.getAttribute("data-gs-id"),
      x: i.x,
      y: i.y,
      w: i.w,
      h: i.h,
    }));
    localStorage.setItem(KEY, JSON.stringify(layout));
  });

  // 6) fire each widget’s init (clock ticking, pomodoro handlers)
  widgets.forEach((w) => w.init());
});
