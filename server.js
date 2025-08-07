// server.js
import "dotenv/config";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// --- Auth middleware ---
function ensureHtmlAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/auth/google");
}

function ensureApiAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: "Unauthorized" });
}

// --- Passport & Session setup ---
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      done(null, {
        id: profile.id,
        displayName: profile.displayName,
        photo: profile.photos?.[0]?.value || null,
      });
    }
  )
);

// --- Directories & files ---
const PUBLIC_DIR = path.join(__dirname, "public");
const ICONS_DIR = path.join(PUBLIC_DIR, "icons");
const SHORTCUTS_PATH = path.join(PUBLIC_DIR, "shortcuts.json");
const DATA_DIR = path.join(__dirname, "data");
const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const PREFS_PATH = path.join(DATA_DIR, "prefs.json");

// Ensure directories exist
for (const d of [ICONS_DIR, UPLOADS_DIR, DATA_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}
// Initialize shortcuts & prefs files if missing
if (!fs.existsSync(SHORTCUTS_PATH))
  fs.writeFileSync(SHORTCUTS_PATH, "[]", "utf8");
if (!fs.existsSync(PREFS_PATH)) fs.writeFileSync(PREFS_PATH, "{}", "utf8");

// Multer for wallpaper uploads
const upload = multer({ dest: UPLOADS_DIR });

// --- Static middleware ---
app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/icons", express.static(ICONS_DIR));
app.use(express.static(PUBLIC_DIR));
app.use(express.json()); // for rename/remove/order JSON bodies

// --- API routes ---

// Return basic user info
app.get("/api/user", ensureApiAuth, (req, res) => {
  res.json({ name: req.user.displayName, photo: req.user.photo });
});

// Get & update preferences
app.get("/api/prefs", ensureApiAuth, (req, res) => {
  const all = JSON.parse(fs.readFileSync(PREFS_PATH, "utf8"));
  res.json(all[req.user.id] || {});
});
app.post(
  "/api/prefs",
  ensureApiAuth,
  upload.single("wallpaper"),
  (req, res) => {
    const { weatherOn, bgColor, searchEngine } = req.body;
    const all = JSON.parse(fs.readFileSync(PREFS_PATH, "utf8"));
    const prev = all[req.user.id] || {};

    all[req.user.id] = {
      weatherOn: weatherOn === "true",
      bgColor: bgColor || prev.bgColor || "#ffffff",
      searchEngine: searchEngine || prev.searchEngine || "google",
      wallpaper: req.file
        ? `/uploads/${req.file.filename}`
        : prev.wallpaper || "",
    };

    fs.writeFileSync(PREFS_PATH, JSON.stringify(all, null, 2), "utf8");
    res.json(all[req.user.id]);
  }
);

// Persist reordered shortcuts
app.post("/api/shortcuts/order", ensureApiAuth, (req, res) => {
  const { shortcuts } = req.body;
  if (!Array.isArray(shortcuts)) {
    return res.status(400).json({ success: false, error: "Expected array" });
  }
  fs.writeFile(
    SHORTCUTS_PATH,
    JSON.stringify(shortcuts, null, 2),
    "utf8",
    (err) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, shortcuts });
    }
  );
});

// Shortcut management
app.post("/add-shortcut", ensureApiAuth, express.json(), async (req, res) => {
  const { name, url } = req.body;
  if (!name || !url)
    return res.status(400).json({ success: false, error: "Name+URL required" });

  try {
    const h = new URL(url).hostname.replace(/\./g, "_");
    const fn = `${h}.png`;
    const buf = await (
      await fetch(
        `https://www.google.com/s2/favicons?sz=64&domain=${h.replace(
          /_/g,
          "."
        )}`
      )
    ).arrayBuffer();
    fs.writeFileSync(path.join(ICONS_DIR, fn), Buffer.from(buf));

    const list = JSON.parse(fs.readFileSync(SHORTCUTS_PATH, "utf8"));
    list.push({ name, url, icon: `icons/${fn}` });
    fs.writeFileSync(SHORTCUTS_PATH, JSON.stringify(list, null, 2), "utf8");
    res.json({ success: true, shortcuts: list });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/rename-shortcut", ensureApiAuth, express.json(), (req, res) => {
  const { index, name, url } = req.body;
  const list = JSON.parse(fs.readFileSync(SHORTCUTS_PATH, "utf8"));
  if (list[index]) {
    if (name) list[index].name = name;
    if (url) list[index].url = url;
    fs.writeFileSync(SHORTCUTS_PATH, JSON.stringify(list, null, 2), "utf8");
    return res.json({ success: true, shortcuts: list });
  }
  res.status(404).json({ success: false, error: "Not found" });
});

app.post("/remove-shortcut", ensureApiAuth, express.json(), (req, res) => {
  const idx = Number(req.body.index);
  let list = JSON.parse(fs.readFileSync(SHORTCUTS_PATH, "utf8"));
  if (list[idx]) {
    list.splice(idx, 1);
    fs.writeFileSync(SHORTCUTS_PATH, JSON.stringify(list, null, 2), "utf8");
    return res.json({ success: true, shortcuts: list });
  }
  res.status(404).json({ success: false, error: "Not found" });
});

// --- HTML routes ---
app.get("/prefs", ensureHtmlAuth, (req, res) =>
  res.sendFile(path.join(PUBLIC_DIR, "prefs.html"))
);
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile"],
    prompt: "select_account", // 👈 Forces account chooser
  })
);
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => res.redirect("/")
);
app.get("/logout", ensureHtmlAuth, (req, res, next) => {
  req.logout((err) => (err ? next(err) : res.redirect("/")));
});

// Serve index.html for root
app.get("/", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
