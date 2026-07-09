import { useEffect, useMemo, useRef } from 'react';
import type { CatalogProduct } from '@shared/types';
import { renderProductDetail } from '../../../../scripts/product-detail-template.mjs';

import siteCss from '../../../../css/site.css?inline';
import catalogCss from '../../../../css/catalog.css?inline';

const ASSET_BASE = 'site-editor://local/';

function splitAliases(text: string): string[] {
  // Template joins with " · "
  return text
    .split(/[\u00B7•]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function WebsiteProductInlineEditor({
  product,
  onChange,
}: {
  product: CatalogProduct;
  onChange: (next: CatalogProduct) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const html = useMemo(() => {
    try {
      return renderProductDetail(product, { base: ASSET_BASE });
    } catch {
      return '<div class="placeholder">Preview unavailable</div>';
    }
  }, [product]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    // Write isolated HTML + website CSS into an iframe, so it can't break the rest of the app.
    doc.open();
    doc.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      ${siteCss}
      ${catalogCss}
      .inline-editable{
        cursor:text;
        outline:1px dashed rgba(225,29,72,0.55);
        outline-offset:2px;
        border-radius:4px;
      }
      .inline-editable:focus{
        outline:2px solid rgba(225,29,72,0.95);
        background: rgba(225,29,72,0.08);
      }
      .inline-edit-overlay-btn{
        position:fixed;
        z-index:999999;
        display:none;
        background: rgba(225, 29, 72, 0.95);
        color:#fff;
        border: 1px solid rgba(0, 0, 0, 0.25);
        border-radius:999px;
        padding:4px 8px;
        font: 700 11px/1 'JetBrains Mono', ui-monospace, monospace;
        cursor:pointer;
        user-select:none;
        box-shadow: 0 10px 26px rgba(0,0,0,0.35);
      }
      body{ margin:0; }
    </style>
  </head>
  <body>
    <div id="preview-root">${html}</div>
  </body>
</html>`);
    doc.close();

    const root = doc.querySelector('#preview-root') as HTMLElement | null;
    if (!root) return;

    // If image loading fails, visually mark it so we can debug bad URLs/base paths.
    const imgs = Array.from(doc.querySelectorAll('img')) as HTMLImageElement[];
    if (imgs.length) {
      imgs.forEach((img) => {
        img.addEventListener('error', () => {
          img.style.outline = '2px solid rgba(225, 29, 72, 0.95)';
          img.style.outlineOffset = '-2px';
          img.title = `Image failed to load: ${img.currentSrc || img.src}`;
        });
      });
    }

    const disposers: Array<() => void> = [];

    let overlayBtn: HTMLButtonElement | null = null;
    let overlayTarget: HTMLElement | null = null;

    const ensureOverlayBtn = () => {
      if (!overlayBtn) {
        overlayBtn = doc.createElement('button');
        overlayBtn.type = 'button';
        overlayBtn.className = 'inline-edit-overlay-btn';
        overlayBtn.textContent = 'Edit';
        doc.body.appendChild(overlayBtn);

        overlayBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
        });

        overlayBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!overlayTarget) return;
          overlayTarget.focus?.();

          try {
            const selection = doc.defaultView?.getSelection();
            selection?.removeAllRanges();
            const range = doc.createRange();
            range.selectNodeContents(overlayTarget);
            selection?.addRange(range);
          } catch {
            /* ignore */
          }
        });
      }
      return overlayBtn;
    };

    const positionOverlayBtn = (target: HTMLElement) => {
      const btn = ensureOverlayBtn();
      const rect = target.getBoundingClientRect();
      const left = Math.max(6, rect.right - 72);
      const top = Math.max(6, rect.top);
      btn.style.left = `${left}px`;
      btn.style.top = `${top}px`;
    };

    const addEditable = (el: Element | null, onBlur: () => void) => {
      if (!el) return;
      const node = el as HTMLElement;
      node.setAttribute('contenteditable', 'true');
      node.setAttribute('spellcheck', 'false');
      node.classList.add('inline-editable');

      const handler = () => onBlur();
      node.addEventListener('blur', handler);
      disposers.push(() => node.removeEventListener('blur', handler));

      const show = () => {
        overlayTarget = node;
        positionOverlayBtn(node);
        ensureOverlayBtn().style.display = 'block';
      };
      const hide = () => {
        if (overlayTarget === node && overlayBtn) overlayBtn.style.display = 'none';
      };

      node.addEventListener('mouseenter', show);
      node.addEventListener('mouseleave', hide);
      disposers.push(() => node.removeEventListener('mouseenter', show));
      disposers.push(() => node.removeEventListener('mouseleave', hide));
    };

    const parseOverview = () => {
      const summaryDiv = root.querySelector('.product-summary');
      const ps = summaryDiv?.querySelectorAll('p') ?? [];
      const lines = Array.from(ps)
        .map((p) => (p.textContent || '').trim())
        .filter(Boolean);

      onChange({
        ...product,
        overview: lines,
        summary: lines[0] || '',
      });
    };

    const parseBulletSection = (title: string): string[] => {
      const blocks = Array.from(root.querySelectorAll('.product-detail-block'));
      const block = blocks.find((b) => {
        const t = b.querySelector('.product-section-title')?.textContent?.trim();
        return t === title;
      });
      const lis = block?.querySelectorAll('ul.product-bullet-list li') ?? [];
      return Array.from(lis)
        .map((li) => (li.textContent || '').trim())
        .filter(Boolean);
    };

    const parseSolutionSection = (sectionTitle: string): string[] | null => {
      const sections = Array.from(root.querySelectorAll('.product-solution-section'));
      const section = sections.find((s) => {
        const t = s.querySelector('.product-section-title')?.textContent?.trim();
        return t === sectionTitle;
      });
      const lis = section?.querySelectorAll('ul.product-bullet-list li') ?? [];
      const lines = Array.from(lis)
        .map((li) => (li.textContent || '').trim())
        .filter(Boolean);
      return section ? lines : null;
    };

    const parseSpecTable = () => {
      const rows = Array.from(root.querySelectorAll('.spec-table-detail .spec-row'));
      const parsed = rows
        .map((row) => {
          const spans = Array.from(row.querySelectorAll('span'));
          const label = (spans[0]?.textContent || '').trim();
          const value = (spans[1]?.textContent || '').trim();
          return { label, value };
        })
        .filter((r) => r.label || r.value);

      onChange({
        ...product,
        techSpecs: parsed,
        keyValueSpecs: [],
      });
    };

    // Name
    addEditable(root.querySelector('h1'), () => {
      const h1 = root.querySelector('h1');
      const nextName = (h1?.textContent || '').trim();
      onChange({ ...product, name: nextName, _search: product._search });
    });

    // Aliases (solutions/components)
    addEditable(root.querySelector('p.product-aliases'), () => {
      const el = root.querySelector('p.product-aliases');
      const aliasesText = (el?.textContent || '').trim();
      onChange({ ...product, aliases: splitAliases(aliasesText) });
    });

    // Spec highlight
    addEditable(root.querySelector('p.product-highlight'), () => {
      const el = root.querySelector('p.product-highlight');
      const specHighlight = (el?.textContent || '').trim();
      onChange({ ...product, specHighlight });
    });

    // Tagline (solutions)
    addEditable(root.querySelector('p.product-tagline'), () => {
      const el = root.querySelector('p.product-tagline');
      const tagline = (el?.textContent || '').trim();
      onChange({
        ...product,
        solutionContent: product.solutionContent
          ? { ...product.solutionContent, tagline: tagline || null }
          : { tagline: tagline || null, demonstrates: [], kitIncludes: [], capabilities: [] },
      });
    });

    // Overview/summary paragraphs
    Array.from(root.querySelectorAll('.product-summary p')).forEach((p) => {
      addEditable(p, parseOverview);
    });

    // Features / Applications (two-col blocks)
    Array.from(root.querySelectorAll('.product-detail-block')).forEach((block) => {
      const title = block
        .querySelector('.product-section-title')
        ?.textContent?.trim();
      const listItems = Array.from(block.querySelectorAll('ul.product-bullet-list li'));
      if (!title || !listItems.length) return;

      if (title === 'Features' || title === 'Applications') {
        listItems.forEach((li) =>
          addEditable(li, () => {
            const parsed = parseBulletSection(title);
            onChange({
              ...product,
              features: title === 'Features' ? parsed : product.features,
              applications: title === 'Applications' ? parsed : product.applications,
            });
          }),
        );
      }
    });

    // Solution sections
    Array.from(root.querySelectorAll('.product-solution-section')).forEach((section) => {
      const sectionTitle = section
        .querySelector('.product-section-title')
        ?.textContent?.trim();
      const listItems = Array.from(section.querySelectorAll('ul.product-bullet-list li'));
      if (!sectionTitle || !listItems.length) return;

      const key =
        sectionTitle === 'What This Kit Demonstrates'
          ? 'demonstrates'
          : sectionTitle === "What's Included"
            ? 'kitIncludes'
            : sectionTitle === 'Key Capabilities'
              ? 'capabilities'
              : null;

      if (!key) return;

      listItems.forEach((li) =>
        addEditable(li, () => {
          const lines = parseSolutionSection(sectionTitle);
          if (!lines) return;
          onChange({
            ...product,
            solutionContent: product.solutionContent
              ? { ...product.solutionContent, [key]: lines }
              : {
                  tagline: null,
                  demonstrates: key === 'demonstrates' ? lines : [],
                  kitIncludes: key === 'kitIncludes' ? lines : [],
                  capabilities: key === 'capabilities' ? lines : [],
                },
          });
        }),
      );
    });

    // Custom note
    addEditable(root.querySelector('p.product-custom-note'), () => {
      const el = root.querySelector('p.product-custom-note');
      const customNote = (el?.textContent || '').trim();
      onChange({ ...product, customNote: customNote || null });
    });

    // Spec table (if rendered)
    const specRows = root.querySelectorAll('.spec-table-detail .spec-row');
    if (specRows.length) {
      Array.from(root.querySelectorAll('.spec-table-detail .spec-row span')).forEach((span) => {
        addEditable(span, parseSpecTable);
      });
    }

    return () => {
      disposers.forEach((d) => d());
      if (overlayBtn && overlayBtn.parentElement) overlayBtn.parentElement.removeChild(overlayBtn);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  return (
    <div className="rounded-lg border border-[#2a3142] bg-[#0e1118] overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[#2a3142] p-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-[#e11d48]">Website preview (inline edit)</div>
          <div className="text-xs text-slate-500">
            Edit text directly in the preview. Hover to see the edit button.
          </div>
        </div>
        <div className="text-[11px] text-slate-500">Live</div>
      </div>
      <iframe
        ref={iframeRef}
        className="w-full p-4 overflow-auto max-h-[640px] bg-[#0e1118]"
      />
    </div>
  );
}

