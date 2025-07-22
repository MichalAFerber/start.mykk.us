const tpl = document.createElement("template");
tpl.innerHTML = `
  <div class="grid-stack-item-content card">
    <div class="body d-flex flex-row align-items-center justify-content-center p-3" style="gap: 0.5rem;">
    <iframe src="https://4db2c970f77446ebad7dc334feb5c2de.elf.site"></iframe>
    </div>
  </div>
`;

export default {
  id: "visitCounter",
  w: 3,
  h: 4,
  template: tpl,
  init() {},
};
