import { useEffect, useState } from 'react';
import { Button } from './ui/Button';

export function ImageManager({
  productId,
  image,
  images = [],
  onChange,
}: {
  productId: string;
  image: string | null;
  images?: string[];
  onChange: (next: { image: string | null; images?: string[] }) => void;
}) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [displayPaths, setDisplayPaths] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const onDisk = await window.siteEditor.images.listForProduct(productId);
      const paths = [...new Set([image, ...(images || []), ...onDisk].filter(Boolean))] as string[];
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
  }, [productId, image, images]);

  async function replacePrimary() {
    const result = await window.siteEditor.images.pickAndSave(productId, 'primary');
    if (result) onChange({ image: result.relativePath, images });
  }

  async function addGallery() {
    const result = await window.siteEditor.images.pickAndSave(productId, 'gallery');
    if (result) onChange({ image, images: [...(images || []), result.relativePath] });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="primary" onClick={replacePrimary}>
          Replace primary image
        </Button>
        <Button type="button" onClick={addGallery}>
          Add gallery image
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {displayPaths.map((path) => (
            <figure key={path as string} className="overflow-hidden rounded-md border border-[#2a3142] bg-black">
              {previews[path as string] ? (
                <img src={previews[path as string]} alt="" className="aspect-[4/3] w-full object-contain" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center text-xs text-slate-500">No preview</div>
              )}
              <figcaption className="truncate p-2 text-[11px] text-slate-400">{path as string}</figcaption>
            </figure>
          ))}
      </div>
    </div>
  );
}
