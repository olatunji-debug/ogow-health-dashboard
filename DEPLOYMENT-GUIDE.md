# Ogow Health Dashboard — Protected Deployment Guide

This package is for a **staff-only** Netlify deployment protected by Google Sign-In and Netlify Functions.

---

## 1. Package structure

Expected files:

```text
index.html
auth-gate.js
netlify.toml
package.json
netlify/functions/verify-google-auth.js
netlify/functions/dashboard-data.js
netlify/functions/public-config.js
```

---

## 2. GitHub repository setup

1. Create or use the target GitHub repository.
2. Upload this package to the repository root.
3. Keep the repository private if the protected dataset or deployment details are stored there.

---

## 3. Google Cloud setup

1. Create a Google OAuth **Web application** client.
2. Add the Netlify site origin(s) under **Authorized JavaScript origins**.
3. Copy the generated OAuth Web Client ID.
4. Set that value in Netlify as `GOOGLE_CLIENT_ID`.
5. This package is also prefilled with Google OAuth Web Client ID `433735217842-72ao49diubclpcf4gpdjmh5ecumq17fr.apps.googleusercontent.com` in `index.html` and in the `public-config.js` fallback.
6. The revised package exposes this value safely to the browser through `/.netlify/functions/public-config`, so no additional manual client-ID edit in `index.html` is required unless the client ID changes later.

---

## 4. Netlify setup

### Build settings
| Setting | Value |
|---|---|
| Base directory | *(blank)* |
| Build command | *(blank)* |
| Publish directory | `.` |
| Functions directory | `netlify/functions` |

### Environment variables
Set the following in **Site configuration → Environment variables**:

- `GOOGLE_CLIENT_ID`
- `GITHUB_TOKEN`
- `GITHUB_REPO`
- `GITHUB_DATA_PATH` (optional, default `data/epi_dashboard_data.json`)
- `GITHUB_DATA_URL` (optional direct JSON URL instead of GitHub API retrieval)

---

## 5. Protected data source options

### Option A — Private GitHub JSON
Recommended when Apps Script pushes a cleaned JSON file to a private repository path.

Required variables:
- `GITHUB_TOKEN`
- `GITHUB_REPO`
- `GITHUB_DATA_PATH`

### Option B — Protected remote JSON URL
Use `GITHUB_DATA_URL` or `DATA_URL` if the protected dataset is published at a secure endpoint.

### Option C — Bundled fallback file
If `data/epi_dashboard_data.json` exists in the deployed package, the function can use it as a fallback.

---

## 6. Authentication behavior

### verify-google-auth
- Accepts a POST body containing `{ credential }`
- Verifies the Google ID token server-side
- Requires `email_verified === true`
- Requires the email to end with `@ogowhealth.com`
- Returns HTTP 403 with the standard OGOW denial message when blocked

### dashboard-data
- Accepts a POST body containing `{ credential }`
- Re-verifies the Google ID token
- Reads protected dashboard rows from the configured source
- Returns `{ ok: true, rows }` on success

---

## 7. Frontend notes

The revised `index.html` now:
- includes the Google Identity Services script URL
- contains the full-screen login overlay
- loads `auth-gate.js`
- hides the dashboard until authentication succeeds
- defines `STATE`
- defines `updateTimestamp()`
- resolves the Google Client ID from runtime config before auth starts
- uses the standard denial message
- retries Google Sign-In more safely if publication or script-loading issues occur

Before go-live, ensure `GOOGLE_CLIENT_ID` is set in Netlify, even though this package is now prefilled with `433735217842-72ao49diubclpcf4gpdjmh5ecumq17fr.apps.googleusercontent.com` as a browser-side and function-side fallback.

---

## 8. QA checklist

- Login overlay appears immediately for signed-out users
- Google sign-in button renders
- Valid `@ogowhealth.com` account is approved
- Personal Gmail account is denied with the exact message
- `/.netlify/functions/verify-google-auth` returns expected verification responses
- `/.netlify/functions/dashboard-data` returns protected rows only for approved users
- `/.netlify/functions/public-config` returns the configured Google Client ID
- No public dataset URL is exposed in the frontend bootstrap path

---

## 9. Delivery note

This revised package resolves the known frontend blockers (`STATE`, `updateTimestamp`, broken sign-in bootstrap, and missing Netlify assets) and is now prefilled with Google OAuth Web Client ID `433735217842-72ao49diubclpcf4gpdjmh5ecumq17fr.apps.googleusercontent.com`. The remaining deployment requirement is correct Netlify function routing plus the protected data source configuration in Netlify.
