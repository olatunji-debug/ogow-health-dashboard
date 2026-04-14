# Ogow Health Dashboard — Complete Deployment Guide

> **GitHub → Netlify → Google Apps Script**
> End-to-end workflow to publish the dashboard live and keep it auto-synced with the Google Sheet.

---

## Prerequisites

| Tool | Signup | Free Tier |
|------|--------|-----------|
| **GitHub** | [github.com/signup](https://github.com/signup) | ✅ Unlimited public repos |
| **Netlify** | [app.netlify.com/signup](https://app.netlify.com/signup) | ✅ 100 GB bandwidth/month |
| **Google Account** | Already have (owns the spreadsheet) | ✅ Apps Script included |
| **Git** (local) | [git-scm.com/downloads](https://git-scm.com/downloads) | ✅ Free |

---

## STEP 1 — Create GitHub Repository

### 1.1 Create the repo on GitHub

1. Go to **[github.com/new](https://github.com/new)**
2. Fill in:
   - **Repository name**: `ogow-health-dashboard`
   - **Description**: `Ogow Health EPI Weekly Performance Dashboard`
   - **Visibility**: `Public` (or Private — both work with Netlify)
   - ⚠️ **Do NOT** check "Add a README" — we already have one
   - ⚠️ **Do NOT** add `.gitignore` or license — we already have them
3. Click **Create repository**
4. You'll see a blank repo page with setup instructions — keep this tab open

### 1.2 Unzip and push files

Open a terminal on your computer:

```bash
# 1. Unzip the deployment package
unzip ogow-dashboard-deploy.zip
cd ogow-dashboard-deploy

# 2. Initialize Git
git init
git add .
git commit -m "Initial deploy: Ogow Health EPI Performance Dashboard"

# 3. Connect to GitHub (replace YOUR_USERNAME with your GitHub username)
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ogow-health-dashboard.git

# 4. Push
git push -u origin main
```

### 1.3 Verify

- Go to `https://github.com/YOUR_USERNAME/ogow-health-dashboard`
- You should see these files:
  ```
  index.html          ← the dashboard (single HTML file)
  netlify.toml        ← Netlify configuration
  _redirects          ← SPA routing rules
  README.md           ← project documentation
  .gitignore          ← Git ignore patterns
  google-apps-script/ ← Apps Script code (reference copy)
  ```

---

## STEP 2 — Connect Netlify for Auto-Deploy

### 2.1 Import the repository

1. Go to **[app.netlify.com](https://app.netlify.com/)**
2. Click **Add new site → Import an existing project**
3. Choose **Deploy with GitHub**
4. Authorize Netlify to access your GitHub (if first time)
5. Search for and select **`ogow-health-dashboard`**

### 2.2 Configure build settings

| Setting | Value |
|---------|-------|
| **Branch to deploy** | `main` |
| **Build command** | *(leave completely blank)* |
| **Publish directory** | `.` |

> No build step is needed — the dashboard is a single pre-built HTML file.

6. Click **Deploy site**

### 2.3 Wait for deployment (~30 seconds)

- Netlify will show "Site deploy in progress"
- Once complete, you'll get a URL like: `https://random-name-12345.netlify.app`
- Click it to verify the dashboard is live

### 2.4 Set a custom site name (optional)

1. In Netlify → **Site configuration → Site details → Change site name**
2. Set to something like: `ogow-health-dashboard`
3. Your URL becomes: **`https://ogow-health-dashboard.netlify.app`**

### 2.5 Add custom domain (optional)

1. In Netlify → **Domain management → Add a domain**
2. Enter your domain: `dashboard.ogowhealth.org`
3. Follow DNS configuration instructions
4. Netlify provides free SSL/HTTPS automatically

---

## STEP 3 — Google Apps Script Setup

### 3.1 Open the Script Editor

1. Open the spreadsheet: **[EPI Weekly Health Facility Performance Tracker](https://docs.google.com/spreadsheets/d/10K0WRDFZs7rAOFJaVnn2xpwu2eGbWNej0-4II1K7EXk/edit)**
2. Go to **Extensions → Apps Script**
3. Delete any existing code in `Code.gs`
4. Copy the entire contents of `google-apps-script/Code.gs` from the deployment package
5. Paste it into the script editor
6. Click **Save** (💾 icon or Ctrl+S)

### 3.2 Deploy as Web App

1. In the Apps Script editor, click **Deploy → New deployment**
2. Click the ⚙️ gear icon next to "Select type" → choose **Web app**
3. Fill in:
   - **Description**: `Ogow Dashboard JSON API v1`
   - **Execute as**: `Me (your@email.com)`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. Click **Authorize access** → choose your Google account → **Allow**
6. **Copy the Web App URL** — save it somewhere safe:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

> ✅ This URL now serves live processed JSON. Visit it in a browser to verify — you should see JSON data.

### 3.3 Create a Netlify Deploy Hook

1. Go to **Netlify → your dashboard site → Site configuration**
2. Navigate to **Build & deploy → Build hooks**
3. Click **Add build hook**:
   - **Name**: `Google Sheets Auto-Update`
   - **Branch**: `main`
4. Click **Save**
5. **Copy the hook URL**:
   ```
   https://api.netlify.com/build_hooks/abc123def456...
   ```

### 3.4 Configure the Deploy Hook in Apps Script

1. Back in the Apps Script editor
2. Find **line 19** — the `NETLIFY_DEPLOY_HOOK_URL` constant
3. Paste your hook URL:
   ```javascript
   const NETLIFY_DEPLOY_HOOK_URL = 'https://api.netlify.com/build_hooks/abc123def456...';
   ```
4. Click **Save**

### 3.5 Set Up the Auto-Deploy Trigger

1. In Apps Script, click the ⏰ **Triggers** icon (left sidebar, clock icon)
2. Click **+ Add Trigger** (bottom right)
3. Configure:
   - **Choose which function to run**: `onSheetEdit`
   - **Choose which deployment should run**: `Head`
   - **Select event source**: `From spreadsheet`
   - **Select event type**: `On edit`
4. Click **Save**
5. Authorize if prompted

> ✅ Now whenever the `EPI Weekly Data` sheet is edited, Netlify auto-rebuilds within 5 minutes.

### 3.6 Verify the Custom Menu

1. Go back to the spreadsheet and **reload the page**
2. After a moment, you should see a new menu: **🏥 Ogow Dashboard**
3. Test each option:
   - **📊 Preview JSON Output** → shows data summary
   - **🚀 Trigger Netlify Deploy** → manually triggers a rebuild
   - **📋 Copy Web App URL** → shows deployment info

---

## STEP 4 — Verify the Complete Pipeline

### Test 1: Direct Dashboard Access
- Visit your Netlify URL → dashboard should load with embedded data

### Test 2: In-Browser Live Sync
- On the dashboard, click **⚡ Sync Live Data**
- Dashboard should refresh with the latest spreadsheet data

### Test 3: Apps Script JSON API
- Visit your Web App URL in a browser
- You should see raw JSON data

### Test 4: Auto-Deploy on Edit
1. Edit a cell in the `EPI Weekly Data` sheet
2. Wait 5-6 minutes
3. Check Netlify → **Deploys** tab → you should see a new deploy triggered by the build hook

---

## Ongoing Update Workflow

### For Data Analysts (daily use)
| Action | How | Speed |
|--------|-----|-------|
| View latest data | Click **⚡ Sync Live Data** on dashboard | Instant (~3s) |
| Add new weekly data | Enter data in Google Sheet → auto-deploys | ~5 min |
| Manual rebuild | Spreadsheet menu → **🚀 Trigger Netlify Deploy** | ~60s |

### For Developers (code changes)
| Action | How | Speed |
|--------|-----|-------|
| Update dashboard UI | Edit `index.html` → `git push` | ~30s auto-deploy |
| Update embedded data | Re-run sync script → replace `index.html` → `git push` | ~60s |
| Rollback | Netlify → Deploys → click any previous deploy → **Publish** | Instant |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Google Sheets (data source)            │
│  EPI Weekly Data | Facility List | Targets       │
└────────┬──────────────┬──────────────┬──────────┘
         │              │              │
    ┌────▼────┐   ┌─────▼─────┐  ┌────▼──────────┐
    │ CSV API │   │ Apps Script│  │ On-Edit       │
    │ (Sheets)│   │ Web App   │  │ Trigger       │
    └────┬────┘   │ (JSON API)│  └────┬──────────┘
         │        └─────┬─────┘       │
         │              │        ┌────▼──────────┐
    ┌────▼────────┐     │        │ Netlify       │
    │ ⚡ Sync     │     │        │ Deploy Hook   │
    │ Live Data   │     │        └────┬──────────┘
    │ (in-browser)│     │             │
    └────┬────────┘     │        ┌────▼──────────┐
         │              │        │ Netlify       │
         ▼              ▼        │ Auto-Build    │
    ┌─────────────────────┐      └────┬──────────┘
    │                     │           │
    │  Ogow Health        │◄──────────┘
    │  Dashboard          │
    │  (Netlify CDN)      │
    │                     │
    │  github.com/repo    │
    │  → auto-deploy      │
    └─────────────────────┘
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **⚡ Sync fails with CORS error** | Ensure the Google Sheet sharing is set to "Anyone with the link can view" |
| **Apps Script returns 401** | Re-deploy the Web App → update permissions to "Anyone" |
| **Netlify deploy not triggering** | Check the deploy hook URL is correct in Apps Script |
| **Auto-deploy fires too often** | The script has a 5-minute debounce — this is expected behavior |
| **Dashboard shows old data** | Hard-refresh the browser (Ctrl+Shift+R) or click ⚡ Sync |
| **Git push rejected** | Run `git pull --rebase origin main` first, then push again |
