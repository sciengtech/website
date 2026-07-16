import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync } from 'fs';
import { extname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dialog } from 'electron';
import { getWorkspacePaths } from './workspace';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export type ImageAssetKind = 'product' | 'knowledge';

function resolveAssetAbsolutePath(input: string): string | null {
  const pathInput = input.trim();
  if (!pathInput) return null;

  if (/^file:\/\//i.test(pathInput)) {
    try {
      return fileURLToPath(pathInput);
    } catch {
      return null;
    }
  }

  const normalized = pathInput.replace(/^\/+/, '').replace(/\\/g, '/');
  const { root } = getWorkspacePaths();

  if (/^[a-zA-Z]:/.test(normalized)) {
    return normalized;
  }

  return join(root, ...normalized.split('/'));
}

function assetsDir(kind: ImageAssetKind): string {
  const { root, productsAssets } = getWorkspacePaths();
  return kind === 'knowledge' ? join(root, 'assets', 'knowledge') : productsAssets;
}

function relativePrefix(kind: ImageAssetKind, ownerId: string, filename: string): string {
  const folder = kind === 'knowledge' ? 'knowledge' : 'products';
  return `assets/${folder}/${ownerId}/${filename}`;
}

function nextGalleryName(destDir: string): string {
  const existing = existsSync(destDir)
    ? readdirSync(destDir).filter((f) => /^image-\d+/i.test(f))
    : [];
  return `image-${String(existing.length + 2).padStart(2, '0')}`;
}

function clearOtherPrimaries(destDir: string, keepFilename: string): void {
  if (!existsSync(destDir)) return;
  for (const name of readdirSync(destDir)) {
    if (!/^primary\./i.test(name)) continue;
    if (name === keepFilename) continue;
    if (!IMAGE_EXTS.has(extname(name).toLowerCase())) continue;
    unlinkSync(join(destDir, name));
  }
}

function sameFileContents(a: string, b: string): boolean {
  try {
    if (!existsSync(b)) return false;
    const left = readFileSync(a);
    const right = readFileSync(b);
    return left.length === right.length && left.equals(right);
  } catch {
    return false;
  }
}

function copyIntoSlot(
  src: string,
  ownerId: string,
  slot: 'primary' | 'gallery',
  kind: ImageAssetKind,
): { path: string; relativePath: string } {
  const ext = extname(src).toLowerCase();
  if (!IMAGE_EXTS.has(ext)) throw new Error('Unsupported image type');

  const destDir = join(assetsDir(kind), ownerId);
  mkdirSync(destDir, { recursive: true });

  const filename =
    slot === 'primary' ? `primary${ext}` : `${nextGalleryName(destDir)}${ext}`;
  const dest = join(destDir, filename);

  // Replacing primary.png with primary.jpg (etc.) must not leave the old file
  // forever dirty / listed as an orphan in the product folder.
  if (slot === 'primary') {
    clearOtherPrimaries(destDir, filename);
  }

  // Skip rewrite when bytes are identical — avoids a perpetual dirty git entry
  // when the user re-selects the same file or the UI re-applies an upload.
  if (!sameFileContents(src, dest)) {
    copyFileSync(src, dest);
  }

  return { path: dest, relativePath: relativePrefix(kind, ownerId, filename) };
}

export async function pickAndSaveImage(
  productId: string,
  slot: 'primary' | 'gallery',
  options?: { multi?: boolean; kind?: ImageAssetKind },
): Promise<{ path: string; relativePath: string }[] | null> {
  const multi = options?.multi ?? true;
  const kind = options?.kind ?? 'product';
  const result = await dialog.showOpenDialog({
    properties: multi ? ['openFile', 'multiSelections'] : ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
  });
  if (result.canceled || !result.filePaths.length) return null;

  return saveImagesFromPaths(productId, result.filePaths, slot, kind);
}

/** Save images from absolute filesystem paths (drag-and-drop). */
export function saveImagesFromPaths(
  ownerId: string,
  filePaths: string[],
  slot: 'primary' | 'gallery',
  kind: ImageAssetKind = 'product',
): { path: string; relativePath: string }[] {
  if (!filePaths.length) return [];
  const saved: { path: string; relativePath: string }[] = [];
  for (let i = 0; i < filePaths.length; i++) {
    const usePrimary = slot === 'primary' && i === 0;
    saved.push(
      copyIntoSlot(filePaths[i], ownerId, usePrimary ? 'primary' : 'gallery', kind),
    );
  }
  return saved;
}

export function getPreviewFileUrl(relativePath: string): string | null {
  const abs = resolveAssetAbsolutePath(relativePath);
  if (!abs || !existsSync(abs)) return null;

  const ext = extname(abs).toLowerCase();
  const mime = MIME_TYPES[ext];
  if (!mime) return null;

  const data = readFileSync(abs);
  return `data:${mime};base64,${data.toString('base64')}`;
}

export function listProductImages(
  productId: string,
  kind: ImageAssetKind = 'product',
): string[] {
  const dir = join(assetsDir(kind), productId);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()))
    .map((f) => relativePrefix(kind, productId, f));
}

/** Delete an image file under assets/products or assets/knowledge only. */
export function deleteProductImage(relativePath: string): void {
  const abs = resolveAssetAbsolutePath(relativePath);
  if (!abs || !existsSync(abs)) throw new Error('Image not found');

  const { root, productsAssets } = getWorkspacePaths();
  const resolved = resolve(abs);
  const allowedRoots = [resolve(productsAssets), resolve(join(root, 'assets', 'knowledge'))];
  const ok = allowedRoots.some((assetsRoot) => {
    const rel = relative(assetsRoot, resolved);
    return Boolean(rel) && !rel.startsWith('..');
  });
  if (!ok) {
    throw new Error('Can only delete files inside assets/products or assets/knowledge');
  }
  if (!IMAGE_EXTS.has(extname(resolved).toLowerCase())) {
    throw new Error('Not an image file');
  }

  unlinkSync(resolved);
}
