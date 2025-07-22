import clockWidget from "./widgets/clock.widget.js";
import pomodoroWidget from "./widgets/pomodoro.widget.js";
import weatherMapWidget from "./widgets/weatherMap.widget.js";
import visitCounterWidget from "./widgets/visitcounter.widget.js";

document.addEventListener("DOMContentLoaded", () => {
  const grid = GridStack.init({
    float: true,
    cellHeight: 100,
    draggable: {},
    resizable: { handles: "e,se,s,sw,w" },
  });

  // 👇 Collapse to 1-column on mobile
  function updateGridColumns() {
    const isMobile = window.innerWidth < 768;
    grid.column(isMobile ? 1 : 12); // Adjust 12 to match your desktop layout
  }

  window.addEventListener("resize", updateGridColumns);
  updateGridColumns(); // Run on initial load

  const KEY = "landingLayout";

  // 1. Define base widgets
  const widgets = [
    { id: "clock", ...clockWidget, x: 1, y: 0, w: 3, h: 1 },
    { id: "pomodoro", ...pomodoroWidget, x: 4, y: 0, w: 3, h: 1 },
    { id: "weatherMap", ...weatherMapWidget, x: 4, y: 1, w: 3, h: 4 },
    { id: "visitCounter", ...visitCounterWidget, x: 1, y: 1, w: 3, h: 4 },
  ];

  // 2. Load saved layout and merge
  const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
  console.log("Restoring layout:", saved);

  saved.forEach((s) => {
    const w = widgets.find((w) => w.id === s.id);
    if (w) Object.assign(w, s);
  });

  console.log("Merged widget states:");
  widgets.forEach((w) =>
    console.log(`${w.id} → x:${w.x}, y:${w.y}, w:${w.w}, h:${w.h}`)
  );

  // 3. Clear and render widgets
  grid.removeAll();
  widgets.forEach((w) => {
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-gs-id", w.id);

    // 🟢 Inject HTML from template
    wrapper.innerHTML = w.template.innerHTML;

    grid.addWidget(wrapper, {
      x: w.x,
      y: w.y,
      w: w.w,
      h: w.h,
      autoPosition: false,
    });
  });

  // 4. Save layout on any change
  let saveTimeout;
  grid.on("change", () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      const layout = [];

      document.querySelectorAll(".grid-stack-item").forEach((el) => {
        const node = el.gridstackNode;
        if (!node) return;

        layout.push({
          id: el.getAttribute("data-gs-id"),
          x: node.x,
          y: node.y,
          w: node.w,
          h: node.h,
        });
      });

      console.log("Saving layout:", layout);
      localStorage.setItem(KEY, JSON.stringify(layout));
    }, 200);
  });

  // 5. Initialize widgets after DOM is ready
  setTimeout(() => {
    widgets.forEach((w) => w.init());
  }, 0);
});
