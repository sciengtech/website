# SciEngTech Site Editor

Electron desktop app for editing `data/catalog.json`, `data/knowledge.json`, and product images in [sciengtech/website](https://github.com/sciengtech/website).

## Prerequisites

- Node.js 22+
- Git
- GitHub account with push access to `sciengtech/website`
- A GitHub OAuth App

## GitHub OAuth App setup

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
2. **Homepage URL:** `http://localhost`
3. **Authorization callback URL:** `http://127.0.0.1:3847/callback`
4. Copy **Client ID** and generate a **Client secret**

Create `.env` from the example:

```powershell
cd packages/site-editor
Copy-Item .env.example .env
# Edit .env and paste your OAuth credentials
```

## Development

```powershell
cd packages/site-editor
npm install
npm run dev
```

## Build & package (Windows)

```powershell
npm run build
npm run package:win
```

Installer output: `packages/site-editor/dist/`

## Workflow

1. **Sign in with GitHub** — OAuth opens in your browser; token is stored encrypted locally.
2. **Sync** — shallow clone/pull of `sciengtech/website` into `%APPDATA%/SciEngTech-SiteEditor/workspace`.
3. **Edit** — components, solutions, knowledge articles, and product images.
4. **Save locally** — writes JSON and images to the workspace clone only.
5. **Publish** — commits and pushes **only**:
   - `data/catalog.json`
   - `data/knowledge.json`
   - changed files under `assets/products/`

No local `npm run build:site`. GitHub Actions builds and deploys after push.

## Security

- Never commit `.env` or OAuth tokens.
- Publish never stages generated HTML or `products.json` / `search-index.json`.
