# MyKK Dashboard

A customizable browser start page / new-tab dashboard. Features include search, bookmarks (favorites), weather, mini calendar, date & clock widgets, toolbar shortcuts, drag-and-drop layout reordering, and optional cloud sync via Google sign-in.

**Live demo:** [start.mykk.us](https://start.mykk.us)

## Features

### Widgets

- **Search Bar** — multi-engine search with support for Google, Bing, DuckDuckGo, Yahoo, Brave, Ecosia, and Startpage. Enable multiple engines and switch between them from the search bar dropdown. Configure default engine and open results in a new tab or the same tab.
- **Favorites / Bookmarks** — add, edit, delete, and drag-to-reorder quick-access shortcuts. Automatic favicon detection for 40+ popular services. Customizable icon background color and style (gradient, solid, or transparent).
- **Weather** — current conditions, 5-day forecast, and interactive radar map powered by OpenWeatherMap. Click current weather or any forecast day for a detail modal with feels-like temperature, humidity, wind, UV index, pressure, and visibility. Switchable radar layers (precipitation, clouds, temperature, wind). Animated weather overlays (rain, snow, thunderstorm, clouds, mist, wind).
- **Mini Calendar** — compact monthly calendar with navigation and today highlighting.
- **Date Widget** — current date with configurable format (short, long, numeric, ISO). Auto-scaling font size.
- **Clock Widget** — current time in 12-hour or 24-hour format with seconds display. Auto-scaling font size.
- **iFrame Widgets** — embed any external content on your dashboard. Add Google Calendar, RSS/news feeds, Twitter/X timelines, or any service that provides an embed URL. Add unlimited widgets with custom names and sizes.

### Toolbar Buttons

- **Fullscreen** — toggle browser fullscreen mode
- **Refresh** — manually reload the page
- **Webcam / Selfie** — live mirror view with 3-second countdown selfie capture, flash effect, and download
- **Paint Canvas** — drawing tool with brush, line, rectangle, circle, text, and eraser. Color picker, adjustable brush size, save as PNG or PDF
- **Notepad** — text editor with copy-to-clipboard and download as TXT. Auto-saves to localStorage.

Each toolbar button can be independently shown or hidden.

### Customization

- **Background Themes** — gradient (8 presets), solid color (color picker), or custom image URL
- **Page Title** — customize the browser tab title
- **Auto-Refresh** — configurable interval (0–60 minutes) to keep data fresh
- **Widget Layout** — 12-column CSS grid. Set custom width (1–12 columns) and height (1–8 rows) for every widget.
- **Drag & Drop Reordering** — reorder all dashboard sections by dragging. Handles appear on hover (desktop) or are always visible (mobile).

### Cloud Sync

- **Google Sign-In** — optional sign-in to sync settings and bookmarks across all your devices automatically
- **Push / Pull** — manually push or pull settings to/from the cloud
- **Export / Import** — download settings as JSON or import from a file to transfer between devices without signing in

### Design

- **Responsive** — adapts to desktop (12-column), tablet (6-column at 900px), and phone (single-column at 500px)
- **Glass Morphism** — frosted glass widget cards with backdrop blur
- **Single File** — the entire app is one `index.html` with zero build dependencies
- **No Backend Required** — runs entirely in the browser using localStorage. Firebase is optional for cloud sync only.

## Project Structure

```
index.html   – The complete application (HTML + CSS + JS)
_headers     – Cloudflare Pages response headers
build.sh     – Cloudflare Pages build script (injects Firebase secrets)
```

---

## Self-Hosting

Because the dashboard is a single static HTML file, you can host it anywhere that serves static files.

### Option 1: Local / Any Web Server

1. Clone or download this repository
2. Serve `index.html` with any web server:
   ```bash
   # Python
   python3 -m http.server 8000

   # Node.js (npx)
   npx serve .

   # Nginx, Apache, Caddy, etc. — just point the document root here
   ```
3. Open `http://localhost:8000` in your browser

The dashboard works fully offline without Firebase — settings are stored in `localStorage`. If you want cloud sync, see [Firebase Setup](#firebase-project-setup) below.

### Option 2: GitHub Pages

1. **Fork** this repository on GitHub
2. Go to your fork's **Settings > Pages**
3. Under "Build and deployment":
   - **Source:** Deploy from a branch
   - **Branch:** `main` (or `master`), folder: `/ (root)`
4. Click **Save**
5. Your dashboard will be live at `https://<your-username>.github.io/<repo-name>/`

> **Note:** GitHub Pages serves static files directly — the `build.sh` script is not used. If you want Firebase cloud sync, you'll need to hardcode your Firebase config values in `index.html` (see [Configuring Firebase without build.sh](#configuring-firebase-without-buildsh)) or use GitHub Actions to inject them at build time.

#### Custom domain (optional)

1. In **Settings > Pages**, add your custom domain
2. Create a DNS `CNAME` record pointing to `<your-username>.github.io`
3. Wait for DNS propagation and HTTPS certificate provisioning

### Option 3: Cloudflare Pages

This is the recommended approach — it supports the build script which securely injects Firebase credentials from environment variables.

1. **Fork** this repository on GitHub
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages**
3. Click **Create application > Pages > Connect to Git**
4. Select your forked repository
5. Configure build settings:
   - **Build command:** `bash build.sh`
   - **Build output directory:** `dist`
6. Add environment variables (under **Settings > Environment variables**) if you want cloud sync:
   - `FIREBASE_API_KEY` — your Firebase Web API key
   - `FIREBASE_AUTH_DOMAIN` — e.g. `your-project.firebaseapp.com`
   - `FIREBASE_PROJECT_ID` — your Firebase project ID
7. Click **Save and Deploy**

The `build.sh` script copies `index.html` and `_headers` to `dist/`, then injects the Firebase config values into the JavaScript. If no `FIREBASE_API_KEY` is set, the dashboard deploys without cloud sync (it still works fine with local storage).

#### Custom domain (optional)

1. In Cloudflare Pages, go to your project's **Custom domains** tab
2. Add your domain and follow the DNS instructions

---

## Firebase Project Setup

Firebase provides the backend for optional cloud sync (Google sign-in + Firestore). This is entirely optional — the dashboard works without it.

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **Create a project** (or **Add project**)
3. Enter a project name (e.g., "mykk-dashboard")
4. Disable Google Analytics (not needed) or enable if you want it
5. Click **Create project**

### 2. Enable Authentication

1. In your Firebase project, go to **Build > Authentication**
2. Click **Get started**
3. Go to the **Sign-in method** tab
4. Click **Google** and toggle it to **Enabled**
5. Select a support email address and click **Save**

### 3. Add Authorized Domains

1. Still in **Authentication**, go to **Settings > Authorized domains**
2. Add every domain where you'll host the dashboard:
   - Your Cloudflare Pages domain (e.g., `your-project.pages.dev`)
   - Your custom domain (e.g., `start.yourdomain.com`)
   - `localhost` (for local development)
   - Your GitHub Pages domain if applicable (e.g., `username.github.io`)

### 4. Create a Firestore Database

1. Go to **Build > Firestore Database**
2. Click **Create database**
3. Choose a location closest to your users
4. Start in **Production mode**
5. Set up security rules to protect user data. Replace the default rules with:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
   This ensures users can only read and write their own data.

### 5. Get Your Firebase Config

1. Go to **Project settings** (gear icon in the sidebar)
2. Scroll down to **Your apps** and click the **Web** icon (`</>`) to add a web app
3. Register the app with a nickname (e.g., "MyKK Dashboard")
4. You'll see a config object like:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id"
   };
   ```
5. You need these three values: `apiKey`, `authDomain`, and `projectId`

### 6. Add the Config to Your Deployment

Choose one method depending on your hosting setup:

#### Cloudflare Pages (recommended)

Add these as environment variables in the Cloudflare dashboard (Settings > Environment variables):

| Variable | Value |
|---|---|
| `FIREBASE_API_KEY` | `AIza...` |
| `FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | `your-project-id` |

Redeploy and the `build.sh` script will inject them automatically.

#### Configuring Firebase without build.sh

If you're hosting on GitHub Pages or any static host that doesn't run `build.sh`, edit `index.html` directly. Find the `firebaseConfig` object in the `defaultSettings`:

```javascript
firebaseConfig: {
    apiKey: '',
    authDomain: '',
    projectId: ''
}
```

Replace the empty strings with your values:

```javascript
firebaseConfig: {
    apiKey: 'AIza...',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id'
}
```

#### Import via JSON config

You can also configure Firebase at runtime without editing code:

1. Create a JSON settings file with your Firebase config:
   ```json
   {
     "settings": {
       "firebaseConfig": {
         "apiKey": "AIza...",
         "authDomain": "your-project.firebaseapp.com",
         "projectId": "your-project-id"
       }
     },
     "version": "4.0"
   }
   ```
2. Open the dashboard, go to **Settings > Data > Import**
3. Import the JSON file — the Firebase config will be saved to localStorage

---

## Google OAuth Brand Verification

If you plan to make your dashboard available to users outside your organization, Google may show an "unverified app" warning during sign-in. To remove this:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select the project linked to your Firebase project
3. Go to **APIs & Services > OAuth consent screen**
4. Fill in the required fields (app name, support email, logo)
5. Add your authorized domains
6. Submit for verification if prompted

For personal use or small deployments, the unverified app warning can be bypassed by users clicking "Advanced > Go to (app name)".

---

## Headers

The `_headers` file configures response headers for Cloudflare Pages:

- `Permissions-Policy: camera=*, microphone=*, fullscreen=*` — allows webcam and fullscreen features
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` — required for Google sign-in popup flow
- `X-Frame-Options: SAMEORIGIN` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME-type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer information

If hosting elsewhere, configure equivalent headers in your web server (Nginx, Apache, etc.).

---

## Attribution

MyKK Dashboard is built with the following open-source libraries, APIs, and services.

> **Note:** All client-side code that runs in the browser is fully open-source (MIT, Apache 2.0, BSD 2-Clause, SIL OFL). The external *services* these libraries connect to — Firebase Auth/Firestore, OpenWeatherMap API, and Google Favicons — are free-tier proprietary services operated by Google and OpenWeather. The dashboard itself contains no proprietary code, and all service integrations are optional.

### Libraries

| Library | Version | Use | License |
|---|---|---|---|
| [Firebase JavaScript SDK](https://firebase.google.com/docs/web/setup) | 10.12.0 | Authentication (Google Sign-In) and Cloud Firestore for settings sync | Apache 2.0 |
| [Leaflet](https://leafletjs.com/) | 1.9.4 | Interactive weather radar maps | BSD 2-Clause |
| [jsPDF](https://github.com/parallax/jsPDF) | 2.5.1 | Export paint canvas drawings as PDF | MIT |

### Fonts

| Font | Provider | Use |
|---|---|---|
| [Inter](https://rsms.me/inter/) | Google Fonts | Primary UI typeface (weights 300–700) |

### APIs & Data Services

| Service | Use |
|---|---|
| [OpenWeatherMap](https://openweathermap.org/api) | Current weather, 5-day forecast, and radar tile layers (One Call API 3.0 + weather map tiles) |
| [Google Identity / Firebase Auth](https://firebase.google.com/docs/auth) | Google OAuth sign-in for cloud sync |
| [Cloud Firestore](https://firebase.google.com/docs/firestore) | Cloud database for syncing user settings and bookmarks |

### Map Tiles

| Provider | Use | License |
|---|---|---|
| [CARTO](https://carto.com/basemaps/) | Dark base map tiles for the weather radar (`dark_all`) | CC BY 3.0, uses OpenStreetMap data |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Underlying map data used by CARTO tiles | ODbL |
| [OpenWeatherMap](https://openweathermap.org/api/weathermaps) | Weather overlay tiles (precipitation, clouds, temperature, wind) | CC BY-SA 4.0 |

### Icons

| Source | Use |
|---|---|
| [Dashboard Icons](https://github.com/homarr-labs/dashboard-icons) (homarr-labs) | SVG icons for 40+ popular services in the favorites widget, served via jsDelivr CDN |
| [Google Favicons](https://www.google.com/s2/favicons) | Fallback favicon service for bookmark icons |

### CDN

| Provider | Use |
|---|---|
| [jsDelivr](https://www.jsdelivr.com/) | Serves Dashboard Icons SVGs from GitHub |
| [unpkg](https://unpkg.com/) | Serves Leaflet CSS and JS |
| [cdnjs](https://cdnjs.com/) (Cloudflare) | Serves jsPDF |
| [Google Hosted Libraries](https://developers.google.com/speed/libraries) | Serves Firebase SDK and Google Fonts |

---

## License

This project is licensed under the [MIT License](LICENSE).
