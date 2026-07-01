# Client writeup images

Images and docx copied from `_writeup/Webpage_Writeup` for review before applying to the live catalog.

## Regenerate

```powershell
cd C:\Users\Sagar\BioMatch\sciengtech-revamp
npm run ingest
npm run review:writeup
```

## Browse and select images

```powershell
npm run serve
# http://localhost:3456/assets/imported/writeup/review.html
```

Or one command:

```powershell
npm run review:writeup:open
```

### Workflow

1. For each product, choose **Use as-is**, **Revamp**, or **Skip**
2. Click an image to select as primary (ruby border)
3. Add optional notes
4. Click **Copy for Cursor** or **Download JSON**
5. Save JSON to `data/image-selections.json`
6. Run `npm run apply-images` to copy selections into `assets/products/` and rebuild

Selections auto-save in your browser (localStorage key `sciengtech-writeup-image-selections-v2`).
