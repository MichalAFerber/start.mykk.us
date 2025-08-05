// server.js
import express from "express";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const PUBLIC_DIR = path.join(__dirname, "public");
const ICONS_DIR = path.join(PUBLIC_DIR, "icons");
const SHORTCUTS_PATH = path.join(PUBLIC_DIR, "shortcuts.json");

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

app.use(express.json());
app.use(express.static(PUBLIC_DIR));
app.use("/icons", express.static(ICONS_DIR));

// Add shortcut endpoint
app.post("/add-shortcut", async (req, res) => {
  const { name, url } = req.body;
  if (!name || !url) {
    return res
      .status(400)
      .json({ success: false, error: "Name and URL are required." });
  }

  try {
    const siteUrl = new URL(url);
    const domain = siteUrl.hostname.replace(/\./g, "_");
    const iconFilename = `${domain}.png`;
    const iconPath = path.join(ICONS_DIR, iconFilename);

    // Use Google's favicon service
    const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${siteUrl.hostname}`;
    const response = await fetch(faviconUrl);

    if (!response.ok) {
      throw new Error("Failed to fetch favicon");
    }

    const buffer = await response.buffer();
    fs.writeFileSync(iconPath, buffer);

    // Read and update shortcuts.json
    let shortcuts = [];
    if (fs.existsSync(SHORTCUTS_PATH)) {
      shortcuts = JSON.parse(fs.readFileSync(SHORTCUTS_PATH, "utf8"));
    }
    shortcuts.push({
      name,
      url,
      icon: `icons/${iconFilename}`,
    });
    fs.writeFileSync(SHORTCUTS_PATH, JSON.stringify(shortcuts, null, 2));

    res.json({ success: true, shortcuts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Rename shortcut endpoint
app.post("/rename-shortcut", (req, res) => {
  const { index, name } = req.body;
  if (typeof index !== "number" || !name) {
    return res
      .status(400)
      .json({ success: false, error: "Index and name required." });
  }
  let shortcuts = [];
  if (fs.existsSync(SHORTCUTS_PATH)) {
    shortcuts = JSON.parse(fs.readFileSync(SHORTCUTS_PATH, "utf8"));
  }
  if (!shortcuts[index]) {
    return res
      .status(404)
      .json({ success: false, error: "Shortcut not found." });
  }
  shortcuts[index].name = name;
  fs.writeFileSync(SHORTCUTS_PATH, JSON.stringify(shortcuts, null, 2));
  res.json({ success: true, shortcuts });
});

// Remove shortcut endpoint
app.post("/remove-shortcut", (req, res) => {
  let { index } = req.body;
  index = Number(index); // Ensure index is a number
  if (isNaN(index)) {
    return res.status(400).json({ success: false, error: "Index required." });
  }
  let shortcuts = [];
  if (fs.existsSync(SHORTCUTS_PATH)) {
    shortcuts = JSON.parse(fs.readFileSync(SHORTCUTS_PATH, "utf8"));
  }
  if (!shortcuts[index]) {
    return res
      .status(404)
      .json({ success: false, error: "Shortcut not found." });
  }
  shortcuts.splice(index, 1);
  fs.writeFileSync(SHORTCUTS_PATH, JSON.stringify(shortcuts, null, 2));
  res.json({ success: true, shortcuts });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
