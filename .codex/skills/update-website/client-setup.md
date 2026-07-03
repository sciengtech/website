# Client setup — SciEngTech website repo

Give this document to the client along with GitHub credentials. The agent (Codex/Cursor) uses it for first-time environment setup.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Git | 2.40+ | [git-scm.com](https://git-scm.com/download/win) |
| Node.js | 22.x (LTS) | [nodejs.org](https://nodejs.org/) |
| Cursor or Codex | Latest | Provided by SciEngTech |

Verify in PowerShell:

```powershell
git --version
node --version
npm --version
```

## Clone the repository

```powershell
cd $HOME
git clone https://github.com/sciengtech/website.git
cd website
npm install
```

## GitHub authentication

The client needs permission to **push to `main`** on `sciengtech/website`.

### Option A — Personal Access Token (recommended)

1. GitHub → **Settings → Developer settings → Personal access tokens**
2. Create a token with **`repo`** scope (classic) or **Contents: Read and write** (fine-grained, limited to `website` in the `sciengtech` org)
3. Store the token securely (password manager). **Never commit it to the repo.**

First push will prompt for credentials:

- **Username:** GitHub username
- **Password:** paste the PAT (not the GitHub account password)

To cache credentials on Windows (optional):

```powershell
git config --global credential.helper manager
```

### Option B — GitHub CLI

```powershell
winget install GitHub.cli
gh auth login
```

Choose HTTPS, authenticate in browser, then clone or push normally.

## Install the update skill

### Codex

1. Enable skills in `%USERPROFILE%\.codex\config.toml`: `[features]\nskills = true`
2. Unzip `packages/update-website-skill.zip` into `%USERPROFILE%\.codex\skills\`
3. Restart Codex; verify with `/skills`
4. Invoke with `$update-website` in prompts

Full steps: unzip `packages/update-website-skill.zip` and follow `INSTALL.md` inside.

### Cursor

Open the cloned repo (skill at `.cursor/skills/update-website/`) or copy the folder to `~/.cursor/skills/update-website/`. Invoke with `@update-website`.

## Daily workflow (what the client does)

1. Open Cursor/Codex with the `website` folder as workspace.
2. Send a request, e.g. *"Add this product: [name, SKU, description]"* and attach an image.
3. The agent edits JSON, saves images, runs `npm run build:site`, commits, and pushes.
4. Wait ~2–5 minutes; verify at `https://sciengtech.github.io/website/`

## What gets deployed automatically

| Trigger | CI action |
|---------|-----------|
| Push to `main` changing `data/catalog.json`, `data/knowledge.json`, or `assets/**` | GitHub Actions runs `npm run build:site` → GitHub Pages |

Workflow file: `.github/workflows/deploy-pages.yml`

Manual deploy (if needed): GitHub → **Actions → Deploy to GitHub Pages → Run workflow**

## Local preview (optional)

```powershell
cd website
npm run build:site
npm run serve
```

Open `http://localhost:3456`

## Security rules for the client

- **Do not** share the PAT in chat, commits, or screenshots.
- **Do not** commit `.env` files or credential files.
- **Do not** run `npm run build` or `npm run ingest` unless explicitly instructed by SciEngTech engineering — these overwrite manual catalog edits.
- Only push to `main` after `npm run build:site` succeeds locally.

## Repo contacts

| Resource | URL |
|----------|-----|
| Repository | https://github.com/sciengtech/website |
| Live site | https://sciengtech.github.io/website/ |
| Issues | https://github.com/sciengtech/website/issues |
