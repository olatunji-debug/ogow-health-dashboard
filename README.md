# Ogow Health — Weekly Performance Dashboard

Protected OGOW Health staff dashboard for monitoring weekly facility performance.

## Package contents
- `index.html` — dashboard UI with Google Sign-In gate
- `auth-gate.js` — frontend authentication helper
- `netlify/functions/verify-google-auth.js` — server-side Google token verification
- `netlify/functions/dashboard-data.js` — protected data endpoint
- `netlify/functions/public-config.js` — runtime client configuration endpoint for the browser
- `netlify.toml` — Netlify build/functions/header configuration
- `package.json` — Node dependency manifest

## Access model
- Dashboard stays hidden until sign-in succeeds
- Only `@ogowhealth.com` Google accounts are allowed
- Denied users receive the standard OGOW access-denied message
- Protected rows are loaded from a secured backend path after verification

## Required deployment configuration
Set these in Netlify site environment variables:
- `GOOGLE_CLIENT_ID`
- `GITHUB_TOKEN`
- `GITHUB_REPO`
- `GITHUB_DATA_PATH` (optional, default: `data/epi_dashboard_data.json`)
- `GITHUB_DATA_URL` (optional alternative to GitHub API source)

## Frontend configuration
The revised package no longer requires a hardcoded client ID in `index.html`.

At runtime, the dashboard resolves the Google OAuth Web Client ID in this order:
1. `window.OGOW_GOOGLE_CLIENT_ID`
2. `<meta name="ogow-google-client-id">`
3. `window.OGOW_RUNTIME_CONFIG.googleClientId`
4. `/.netlify/functions/public-config`

The package now includes the configured Google OAuth Web Client ID `433735217842-72ao49diubclpcf4gpdjmh5ecumq17fr.apps.googleusercontent.com` in the browser bootstrap and `public-config.js` fallback path.

Recommended production setup still remains: set `GOOGLE_CLIENT_ID` in Netlify so the deployed environment and package stay aligned.

## Stack
- Single HTML dashboard with embedded CSS and JavaScript
- Google Identity Services
- Netlify Functions
- ECharts
- ag-Grid Community
- Optional private GitHub-hosted JSON dataset

## QA checklist
- Google sign-in button renders
- Signed-out users see the full-screen login overlay
- Non-OGOW accounts receive the standard denial message
- Approved OGOW users can load protected rows
- Netlify functions return expected 200/403/500 responses
- `/.netlify/functions/public-config` returns the configured Google Client ID
