# Deploy SkillSwap (GitHub Actions + API)

Your teacher requires **GitHub Actions** for the website: that is **already** this repo’s workflow (`.github/workflows/deploy-github-pages.yml`). GitHub Pages cannot run Node or MongoDB, so a **live** API is deployed separately with **`render.yaml`** when you want shared data.

### Offline demo (no setup)

If you **do not** set `REACT_APP_API_URL`, Actions still **builds and deploys** the site in **offline demo mode**: register, login, profile, search, swap requests, and chat work **in this browser only** (data in `localStorage`). A yellow banner explains this. Add `REACT_APP_API_URL` later when your API on Render is ready.

## 1. One-time: GitHub Pages

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## 2. One-time: API on Render (free)

1. Push this repo to GitHub.
2. Open [Render Dashboard](https://dashboard.render.com) → **New +** → **Blueprint**.
3. Connect the GitHub repo and apply **`render.yaml`**.
4. When prompted, set **Environment** on the web service:
   - **MONGO_URI** — from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier) or your cluster.
   - **JWT_SECRET** — any long random string.
   - **CLIENT_ORIGIN** — exactly  
     `https://YOUR_GITHUB_USERNAME.github.io`  
     (replace with your GitHub username; **no** `/repository-name` at the end.)

5. After deploy finishes, copy the service URL, e.g. `https://skillswap-api.onrender.com`.

## 3. Point the React build at the API (skip for offline demo only)

GitHub → **Settings → Secrets and variables → Actions**.

- **Variables** (recommended for a public URL): **New repository variable**  
  **Name:** `REACT_APP_API_URL`  
  **Value:** `https://your-service.onrender.com` (no trailing slash, no `/api`)

You can use a **secret** with the same name instead; either works.  
**Leave both unset** to keep **offline demo mode** after each deploy.

## Optional: Google Sign-In

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Credentials** → **Create credentials** → **OAuth client ID** → type **Web application**.
2. **Authorized JavaScript origins** (add both if you use them):
   - `http://localhost:3000` (local `npm start`)
   - `https://YOUR_GITHUB_USERNAME.github.io` (GitHub Pages; no `/repo` path)
3. Copy the **Client ID** (ends with `.apps.googleusercontent.com`).
4. **Render** → your API service → **Environment** → set **GOOGLE_CLIENT_ID** to that value.
5. GitHub → **Settings → Secrets and variables → Actions → Variables** → **REACT_APP_GOOGLE_CLIENT_ID** = same Client ID.

Rebuild the site (push to `main` / `master`) so the client embeds the ID. If you skip this, email/password auth still works and the Google button stays hidden.

## 4. Deploy the site (every update)

Push to **`main`** or **`master`**, or run the workflow manually (**Actions → Deploy to GitHub Pages → Run workflow**).

The workflow builds the client with your `REACT_APP_API_URL` and publishes to Pages.

## Checklist if login/register fails

| Check | Detail |
|--------|--------|
| Variable/secret | `REACT_APP_API_URL` matches the **Render** URL exactly (https). |
| CORS | `CLIENT_ORIGIN` on Render is `https://USERNAME.github.io`. |
| MongoDB | `MONGO_URI` is valid and Atlas IP allowlist allows **0.0.0.0/0** (or Render’s IPs). |
| Cold start | Free Render sleeps; first request after idle can take ~30–60s. |

## Optional: auto-redeploy API from GitHub

In Render: service **Settings → Build & Deploy → Deploy Hook**.  
Add a repository secret **`RENDER_DEPLOY_HOOK_URL`** with the hook URL.  
The Pages workflow will POST to it after a successful Pages deploy (if that step is enabled in the workflow).
