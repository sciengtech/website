import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/Button';

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

function isPrimaryPath(p: string): boolean {
  return /\/primary\.[^/]+$/i.test(normalizePath(p));
}

type ImageKind = 'product' | 'knowledge';

export function ImageManager({
  productId,
  image,
  images = [],
  isNew = false,
  kind = 'product',
  onChange,
}: {
  productId: string;
  image: string | null;
  images?: string[];
  /** When true, do not merge orphan files from disk (avoids leak across new products). */
  isNew?: boolean;
  kind?: ImageKind;
  onChange: (next: {
    image: string | null;
    images?: string[];
    removedPath?: string;
  }) => void;
}) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [displayPaths, setDisplayPaths] = useState<string[]>([]);
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [needsSaveHint, setNeedsSaveHint] = useState(false);
  const boundForId = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    boundForId.current = null;
    setNeedsSaveHint(false);
  }, [productId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!productId.trim()) {
        setDisplayPaths([]);
        setPreviews({});
        return;
      }
      const catalogPaths = [image, ...(images || [])].filter(Boolean) as string[];
      const onDisk = isNew
        ? []
        : await window.siteEditor.images.listForProduct(productId, kind);
      const paths = [...new Set([...catalogPaths, ...onDisk].map(normalizePath))];

      // Disk orphans used to show in the UI without updating form state, so Save
      // wrote image:null and the PNG stayed forever dirty after Pull/sync.
      if (!isNew && boundForId.current !== productId) {
        const catalogSet = new Set(catalogPaths.map(normalizePath));
        const primaryOnDisk = onDisk.find(isPrimaryPath);
        let nextImage = image;
        let nextImages = [...(images || [])];
        let changed = false;

        if (!image && primaryOnDisk) {
          nextImage = primaryOnDisk;
          changed = true;
        }

        for (const diskPath of onDisk) {
          const n = normalizePath(diskPath);
          if (isPrimaryPath(n)) continue;
          if (catalogSet.has(n)) continue;
          if (nextImages.some((p) => normalizePath(p) === n)) continue;
          nextImages.push(diskPath);
          changed = true;
        }

        if (!nextImage && nextImages.length) {
          nextImage = nextImages[0];
          changed = true;
        }

        boundForId.current = productId;
        if (changed) {
          setNeedsSaveHint(true);
          onChangeRef.current({ image: nextImage, images: nextImages });
        }
      }

      const entries = await Promise.all(
        paths.map(async (p) => {
          const url = await window.siteEditor.images.getPreviewUrl(p);
          return [p, url || ''] as const;
        }),
      );
      if (!cancelled) {
        setDisplayPaths(paths);
        setPreviews(Object.fromEntries(entries));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [productId, image, images, isNew, kind]);

  function applySaved(
    saved: { relativePath: string }[],
    slot: 'primary' | 'gallery',
  ) {
    if (!saved.length) return;
    setNeedsSaveHint(false);
    if (slot === 'primary') {
      const primary = saved[0].relativePath;
      const extra = saved.slice(1).map((s) => s.relativePath);
      onChange({
        image: primary,
        images: [
          ...(images || []).filter((p) => normalizePath(p) !== normalizePath(primary)),
          ...extra,
        ],
      });
    } else {
      const nextImages = [...(images || []), ...saved.map((s) => s.relativePath)];
      onChange({
        image: image || nextImages[0] || null,
        images: nextImages,
      });
    }
  }

  async function pick(slot: 'primary' | 'gallery') {
    if (!productId.trim()) {
      setError('Set a product/article ID before uploading images.');
      return;
    }
    setError('');
    const result = await window.siteEditor.images.pickAndSave(productId, slot, {
      multi: true,
      kind,
    });
    if (result) applySaved(result, slot);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!productId.trim()) {
      setError('Set a product/article ID before uploading images.');
      return;
    }
    const files = [...e.dataTransfer.files].filter((f) =>
      /\.(png|jpe?g|webp|gif)$/i.test(f.name),
    );
    const paths = files
      .map((f) => (f as File & { path?: string }).path)
      .filter((p): p is string => Boolean(p));
    if (!paths.length) {
      setError('Drop image files from disk (PNG, JPG, WebP, GIF).');
      return;
    }
    setError('');
    const hasPrimary = Boolean(image);
    const slot = hasPrimary ? 'gallery' : 'primary';
    const saved = await window.siteEditor.images.saveFromPaths(
      productId,
      paths,
      slot,
      kind,
    );
    applySaved(saved, slot);
  }

  async function removeImage(path: string) {
    const label = path.split('/').pop() || path;
    if (!window.confirm(`Delete image “${label}”? This cannot be undone.`)) return;

    setBusyPath(path);
    setError('');
    try {
      await window.siteEditor.images.remove(path);
      const norm = normalizePath(path);
      const nextImage = image && normalizePath(image) === norm ? null : image;
      const nextImages = (images || []).filter((p) => normalizePath(p) !== norm);
      onChange({ image: nextImage, images: nextImages, removedPath: path });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyPath(null);
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`rounded-md border border-dashed px-4 py-6 text-center transition ${
          dragOver
            ? 'border-[#e11d48] bg-[#e11d48]/10'
            : 'border-[#2a3142] bg-[#0e1118]'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <p className="text-sm text-slate-300">Drag & drop images here</p>
        <p className="mt-1 text-xs text-slate-500">PNG, JPG, WebP, GIF — multiple files supported</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button type="button" variant="primary" onClick={() => pick('primary')}>
            {image ? 'Replace primary' : 'Upload primary'}
          </Button>
          <Button type="button" onClick={() => pick('gallery')}>
            Add gallery images
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {needsSaveHint && (
        <p className="text-xs text-amber-400">
          Image found on disk but not saved to the product yet — click Save locally, then Push.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {displayPaths.map((path) => {
          const isPrimary = image != null && normalizePath(image) === normalizePath(path);
          return (
            <figure
              key={path}
              className="overflow-hidden rounded-md border border-[#2a3142] bg-black"
            >
              {previews[path] ? (
                <img src={previews[path]} alt="" className="aspect-[4/3] w-full object-contain" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center text-xs text-slate-500">
                  No preview
                </div>
              )}
              <figcaption className="space-y-2 p-2">
                <p className="truncate text-[11px] text-slate-400">
                  {isPrimary ? 'Primary · ' : ''}
                  {path}
                </p>
                <Button
                  type="button"
                  variant="danger"
                  className="w-full px-2 py-1 text-xs"
                  disabled={busyPath === path}
                  onClick={() => removeImage(path)}
                >
                  {busyPath === path ? 'Deleting…' : 'Delete'}
                </Button>
              </figcaption>
            </figure>
          );
        })}
      </div>
      {displayPaths.length === 0 && (
        <p className="text-sm text-slate-500">No images yet.</p>
      )}
    </div>
  );
}
