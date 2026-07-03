# Install `update-website` skill in Codex

Portable skill package for updating the SciEngTech website (products, images, blog) and pushing to GitHub.

## 1. Enable Codex skills

Edit `%USERPROFILE%\.codex\config.toml` (Windows) or `~/.codex/config.toml` (Mac/Linux):

```toml
[features]
skills = true
```

Save and restart Codex if it was already running.

## 2. Install this skill

### Option A — Unzip (recommended)

Extract this folder so the path is:

```
%USERPROFILE%\.codex\skills\update-website\SKILL.md
```

PowerShell:

```powershell
$dest = "$env:USERPROFILE\.codex\skills"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Expand-Archive -Path ".\update-website-skill.zip" -DestinationPath $dest -Force
```

The zip contains an `update-website` folder — after extract you should have `.codex\skills\update-website\SKILL.md`.

### Option B — Copy folder manually

Copy the entire `update-website` folder into:

| OS | Path |
|----|------|
| Windows | `%USERPROFILE%\.codex\skills\update-website\` |
| macOS / Linux | `~/.codex/skills/update-website/` |

### Option C — Project-level (repo only)

If the skill ships inside the cloned repo, Codex also discovers:

- `.codex/skills/update-website/`
- `.agents/skills/update-website/`

No user-level install needed when working inside `website`.

## 3. Clone the website repo

```powershell
git clone https://github.com/sciengtech/website.git
cd website
npm install
```

Set up GitHub credentials — see [client-setup.md](client-setup.md).

## 4. Verify installation

Restart Codex, then:

```
/skills
```

You should see **update-website** in the list.

## 5. Use the skill

Open Codex in the `website` directory, then invoke explicitly:

```
$update-website Add this product: Post Clamp Extension, SKU SET-PCE
```

Or mention the skill in your prompt:

```
Use $update-website to publish a new blog article about achromatic lenses
```

Codex may also auto-select the skill when your request matches its description.

## Package contents

| File | Purpose |
|------|---------|
| `SKILL.md` | Main workflow (required by Codex) |
| `client-setup.md` | Clone, Node.js, GitHub PAT setup |
| `examples.md` | Walkthroughs for common requests |
| `reference.md` | Catalog and knowledge field reference |
| `INSTALL.md` | This file |

## Live site

https://sciengtech.github.io/website/

Pushes to `main` trigger GitHub Actions deploy (~2–5 minutes).
