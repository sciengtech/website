# Example client requests

These walkthroughs match how requests usually arrive. Follow `SKILL.md` for the full workflow.

---

## Example 1: "Add this product" + attached image

**Client message:**
> Add a new opto-mechanics product: Post Clamp Extension, SKU SET-PCE. [attaches product.png]

**Agent steps:**

1. `git pull origin main`
2. Open `data/catalog.json`, confirm `post-clamp-extension` and `SET-PCE` are unused.
3. Create folder `assets/products/post-clamp-extension/`
4. Save attached image as `assets/products/post-clamp-extension/primary.png`
5. Append component object to `components` array (see SKILL.md template).
6. Set `_search` to lowercase joined text of all searchable fields.
7. Update `"updated": "2026-07-02"` and increment `counts.components`.
8. `npm run build:site`
9. Commit and push:

```powershell
git add data/catalog.json assets/products/post-clamp-extension/
git commit -m "content: add Post Clamp Extension (SET-PCE)"
git push origin main
```

10. Tell client: live in ~5 min at `product.html?id=post-clamp-extension`

---

## Example 2: "Add this blog post"

**Client message:**
> Publish a new Knowledge Center article about achromatic lenses. Here's the HTML content. Category: Lenses.

**Agent steps:**

1. `git pull origin main`
2. Open `data/knowledge.json`
3. Confirm category `lenses` exists in `categories` (add if missing).
4. Choose `id`: `achromatic-lenses`
5. Append article with `title`, `summary`, `body` (HTML), `published`/`modified` dates.
6. Update root `updated` date.
7. `npm run build:site`
8. Commit and push:

```powershell
git add data/knowledge.json
git commit -m "content: add achromatic lenses article"
git push origin main
```

9. Live URL: `engineering/knowledge/achromatic-lenses.html`

---

## Example 3: "Update the image for Washer"

**Client message:**
> Replace the washer product photo with this one. [attaches new-washer.jpg]

**Agent steps:**

1. Find existing entry: `id` = `washer` in `catalog.json`
2. Save image to `assets/products/washer/primary.jpg`
3. Update `"image": "assets/products/washer/primary.jpg"` if extension changed
4. `npm run build:site`
5. Push `assets/products/washer/` (and catalog.json if `image` path changed)

---

## Example 4: "Add a quantum setup solution"

**Client message:**
> Add a new quantum demonstration kit: Entangled Photon Demo Bench, SKU SET-EPD.

**Agent steps:**

1. Append to `solutions` in `catalog.json`
2. Set `solutionGroup`: `quantum-setups`
3. Set `pageTemplate`: `solution`
4. Fill `solutionContent.demonstrates`, `kitIncludes`, `capabilities`
5. Set `solutionUrl`: `solutions/entangled-photon-demo-bench.html`
6. Image at `assets/products/entangled-photon-demo-bench/primary.png`
7. Regenerate `_search`, bump `counts.solutions`
8. Build, commit, push

**Note:** Homepage carousel shows the first 5 `quantum-setups` in array order. Reorder array if this should appear in the carousel.

---

## Example 5: "Remove discontinued product"

**Client message:**
> Remove Hex Keys from the catalog.

**Agent steps:**

1. Find `id`: `hex-keys` in `components`
2. Remove the object from the array
3. Decrement `counts.components`, update `updated`
4. Optionally delete `assets/products/hex-keys/` (or leave for history)
5. `npm run build:site`
6. Commit and push

`products/hex-keys.html` may remain until next full rebuild; runtime detail uses `product.html?id=hex-keys` which will 404 after rebuild.

---

## Example 6: "Fix typo in product description"

**Client message:**
> On the Linear Stage page, change "25mm" to "≥ 25 mm" in the travel range spec.

**Agent steps:**

1. Find `linear-stage` in `components`
2. Edit `techSpecs` or `overview` as appropriate
3. **Regenerate `_search`** (body/summary changed)
4. Build, commit, push — no image changes needed

---

## Commit message conventions

| Change type | Example message |
|-------------|-----------------|
| New product | `content: add Linear Stage Bracket (SET-LSB)` |
| New blog | `content: publish fiber collimator guide` |
| Image update | `content: refresh washer product image` |
| Copy fix | `content: fix linear stage travel range spec` |
| Removal | `content: remove discontinued hex keys` |
