#!/usr/bin/env bash
set -euo pipefail

# Cloudflare Pages build script
# Copies static files to dist/ and injects secrets from environment variables.
#
# Required Cloudflare Pages settings:
#   Build command:          bash build.sh
#   Build output directory: dist
#
# Environment variables / Secrets (set in Cloudflare dashboard):
#   FIREBASE_API_KEY       – Firebase Web API Key
#   FIREBASE_AUTH_DOMAIN   – e.g. your-project.firebaseapp.com
#   FIREBASE_PROJECT_ID    – Firebase Project ID

DIST="dist"
rm -rf "$DIST"
mkdir -p "$DIST"

# Copy all static assets
cp index.html "$DIST/"
cp _headers   "$DIST/"

# ---------- Inject Firebase config ----------
# Only touch the file if at least the API key is provided.
if [[ -n "${FIREBASE_API_KEY:-}" ]]; then
    # Escape special sed characters in values
    escape() { printf '%s' "$1" | sed 's/[&/\]/\\&/g'; }

    API_KEY=$(escape "${FIREBASE_API_KEY}")
    AUTH_DOMAIN=$(escape "${FIREBASE_AUTH_DOMAIN:-}")
    PROJECT_ID=$(escape "${FIREBASE_PROJECT_ID:-}")

    sed -i \
        "s|apiKey: ''|apiKey: '${API_KEY}'|;
         s|authDomain: ''|authDomain: '${AUTH_DOMAIN}'|;
         s|projectId: ''|projectId: '${PROJECT_ID}'|" \
        "$DIST/index.html"

    echo "✓ Firebase config injected"
else
    echo "⚠ No FIREBASE_API_KEY set – shipping without pre-configured Firebase"
fi

echo "✓ Build complete → $DIST/"
