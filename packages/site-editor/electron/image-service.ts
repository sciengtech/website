import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { extname, join } from 'path';
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

export async function pickAndSaveImage(
  productId: string,
  slot: 'primary' | 'gallery',
): Promise<{ path: string; relativePath: string } | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
  });
  if (result.canceled || !result.filePaths[0]) return null;

  const src = result.filePaths[0];
  const ext = extname(src).toLowerCase();
  if (!IMAGE_EXTS.has(ext)) throw new Error('Unsupported image type');

  const { productsAssets, root } = getWorkspacePaths();
  const destDir = join(productsAssets, productId);
  mkdirSync(destDir, { recursive: true });

  let filename: string;
  if (slot === 'primary') {
    filename = `primary${ext}`;
  } else {
    const existing = readdirSync(destDir).filter((f) => /^image-\d+/i.test(f));
    filename = `image-${String(existing.length + 2).padStart(2, '0')}${ext}`;
  }

  const dest = join(destDir, filename);
  copyFileSync(src, dest);
  const relativePath = `assets/products/${productId}/${filename}`;
  return { path: dest, relativePath };
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

export function listProductImages(productId: string): string[] {
  const { productsAssets } = getWorkspacePaths();
  const dir = join(productsAssets, productId);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()))
    .map((f) => `assets/products/${productId}/${f}`);
}
