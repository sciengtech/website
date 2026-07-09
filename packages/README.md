# update-website skill — Codex import package

Give your client **only** `update-website-skill.zip` plus their GitHub PAT.

## Site Editor (Electron)

Desktop CMS for editing `catalog.json`, `knowledge.json`, and product images:

```powershell
cd packages/site-editor
npm install
npm run dev
```

See [site-editor/README.md](site-editor/README.md) for GitHub OAuth setup.

## What's in the zip

```
update-website/
├── SKILL.md          ← required by Codex
├── INSTALL.md        ← install steps for the client
├── client-setup.md   ← clone repo + GitHub auth
├── examples.md       ← sample requests
└── reference.md      ← catalog/blog field reference
```

## Client install (quick)

1. Enable skills in `~/.codex/config.toml` → `[features] skills = true`
2. Unzip into `~/.codex/skills/` (creates `update-website/SKILL.md`)
3. Restart Codex
4. Clone `https://github.com/sciengtech/website`
5. In Codex: `$update-website add this product...`

## Rebuild the zip

After editing skill files under `.cursor/skills/update-website/`:

```powershell
cd website
$src = ".cursor\skills\update-website"
$pkg = "packages\update-website-skill\update-website"
Copy-Item "$src\*" -Destination $pkg -Force
foreach ($t in @(".codex\skills\update-website", ".agents\skills\update-website")) {
  New-Item -ItemType Directory -Force -Path $t | Out-Null
  Copy-Item "$pkg\*" -Destination $t -Force
}
Compress-Archive -Path $pkg -DestinationPath packages\update-website-skill.zip -Force
```

## Also in repo (auto-discovery)

When the client clones the repo, Codex finds the skill at:

- `.codex/skills/update-website/`
- `.agents/skills/update-website/`

No zip needed if they only work inside the cloned repository.
