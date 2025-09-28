// Unify pointer interactions (works on mouse, touch, pen)
(function () {
  // Profile menu
  const btn = document.getElementById("settings-btn");
  const menu = document.getElementById("profile-menu");

  if (btn && menu) {
    const openMenu = () => {
      menu.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      // Focus first item for keyboard users
      menu.querySelector('[role="menuitem"]')?.focus();
    };
    const closeMenu = () => {
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    };
    const toggleMenu = (e) => {
      e.preventDefault();
      menu.hidden ? openMenu() : closeMenu();
    };

    btn.addEventListener("pointerdown", toggleMenu);

    document.addEventListener("pointerdown", (e) => {
      if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) {
        closeMenu();
        btn.focus();
      }
    });
  }

  // Shortcuts drag: add a handle and touch-friendly settings if Sortable is present
  const grid = document.getElementById("shortcuts");
  if (grid && window.Sortable) {
    new Sortable(grid, {
      animation: 150,
      handle: ".drag-handle",
      ghostClass: "drag-ghost",
      fallbackOnBody: true,
      swapThreshold: 0.65,
    });
  }

  // Improve tap target size and hover handling is done via CSS (custom.css)
})();
