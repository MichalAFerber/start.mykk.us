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
