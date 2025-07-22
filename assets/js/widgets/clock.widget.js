const tpl = document.createElement("template");
tpl.innerHTML = `
  <style>
    .body   { padding:16px; font-size:2.5rem; text-align:center; }
  </style>
  <div class="grid-stack-item-content card">
    <div class="body clock-time">00:00</div>
  </div>
`;

export default {
  id: "clock",
  w: 3,
  h: 1,
  template: tpl,
  init() {
    requestAnimationFrame(() => {
      const el = document.querySelector('[data-gs-id="clock"]');
      if (!el) return;

      const disp = el.querySelector(".clock-time");
      if (!disp) return;

      function upd() {
        const now = new Date();
        disp.textContent = now.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }

      upd();
      setInterval(upd, 1000);
    });
  },
};
