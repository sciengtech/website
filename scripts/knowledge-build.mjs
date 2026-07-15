/**
 * Build Knowledge Center hub and article pages from data/knowledge.json.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const FALLBACK_IMAGES = {
  'optical-lenses': 'assets/slides/03-dielectric-mirror.svg',
  'plano-convex-pcx-lenses': 'assets/slides/03-dielectric-mirror.svg',
  'plano-concave-pcv-lenses': 'assets/slides/03-dielectric-mirror.svg',
};

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function truncateSummary(s, max = 130) {
  const t = String(s ?? '')
    .replace(/\[&hellip;\]/g, '')
    .replace(/&hellip;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

function extractImage(body) {
  const m = String(body ?? '').match(/src="([^"]+)"/i);
  if (!m) return null;
  return m[1].replace(/&#038;/g, '&').replace(/&amp;/g, '&');
}

function articleImage(article) {
  if (article.image) return article.image;
  return extractImage(article.body) || FALLBACK_IMAGES[article.id] || 'assets/slides/03-dielectric-mirror.svg';
}

function articleHref(base, id) {
  return `${base}engineering/knowledge/${id}.html`;
}

function knowledgeHubHref(base) {
  return `${base}engineering/knowledge/index.html`;
}

function fixBodyLinks(body, base) {
  return String(body ?? '').replace(
    /href="(?!https?:|\/|\.{1,2}\/)([a-z0-9-]+)\.html"/gi,
    (_, slug) => `href="${articleHref(base, slug)}"`
  );
}

function bentoStackedCard(article, assetBase, pageBase, tone = 'panel') {
  const img = articleImage(article);
  const src = img.startsWith('http') ? img : `${assetBase}${img}`;
  return `<article class="bento-card bento-card--stacked bento-tone-${tone}" data-category="${esc(article.category)}">
    <a class="bento-card-link" href="${esc(articleHref(pageBase, article.id))}">
      <div class="bento-card-media" aria-hidden="true">
        <img src="${esc(src)}" alt="" loading="lazy" />
      </div>
      <div class="bento-card-body">
        <span class="bento-card-meta">${esc(article.categoryLabel)}</span>
        <h2>${esc(article.title)}</h2>
        <p>${esc(truncateSummary(article.summary, 110))}</p>
        <span class="bento-card-cta">Read article</span>
      </div>
    </a>
  </article>`;
}

function bentoCompactCard(article, pageBase, tone = 'panel') {
  return `<article class="bento-card bento-card--compact bento-tone-${tone}" data-category="${esc(article.category)}">
    <a class="bento-card-link" href="${esc(articleHref(pageBase, article.id))}">
      <div class="bento-card-body">
        <span class="bento-card-meta">${esc(article.categoryLabel)}</span>
        <h2>${esc(article.title)}</h2>
        <p>${esc(truncateSummary(article.summary))}</p>
        <span class="bento-card-cta">Read article</span>
      </div>
    </a>
  </article>`;
}

function bentoSplitCard(article, assetBase, pageBase, tone = 'muted') {
  const img = articleImage(article);
  const src = img.startsWith('http') ? img : `${assetBase}${img}`;
  return `<article class="bento-card bento-card--split bento-tone-${tone}" data-category="${esc(article.category)}">
    <a class="bento-card-link" href="${esc(articleHref(pageBase, article.id))}">
      <div class="bento-card-body">
        <span class="bento-card-meta">${esc(article.categoryLabel)} · ${esc(formatDate(article.published))}</span>
        <h2>${esc(article.title)}</h2>
        <p>${esc(truncateSummary(article.summary))}</p>
        <span class="bento-card-cta">Read article</span>
      </div>
      <div class="bento-card-media" aria-hidden="true">
        <img src="${esc(src)}" alt="" loading="lazy" />
      </div>
    </a>
  </article>`;
}

function bentoCtaCard(assetBase, pageBase) {
  return `<article class="bento-card bento-card--cta bento-card--split bento-tone-ruby">
    <a class="bento-card-link" href="${pageBase}engineering/rfq.html">
      <div class="bento-card-body">
        <span class="bento-card-meta">Engineering</span>
        <h2>Request a technical quote</h2>
        <p>Specify lab requirements and our engineering team will respond with configurations and lead times.</p>
        <span class="bento-card-cta">Open RFQ form</span>
      </div>
      <div class="bento-card-media" aria-hidden="true">
        <img src="${assetBase}assets/slides/01-translation-stage.svg" alt="" loading="lazy" />
      </div>
    </a>
  </article>`;
}

function addSpan(cardHtml, span) {
  return cardHtml.replace('class="bento-card', `class="bento-card ${span}`);
}

function spanForIndex(i) {
  const row = Math.floor(i / 2);
  const isLeft = i % 2 === 0;
  const evenRow = row % 2 === 0;
  if (evenRow) return isLeft ? 'bento-span-wide-left' : 'bento-span-narrow-right';
  return isLeft ? 'bento-span-narrow-left' : 'bento-span-wide-right';
}

function slotVariant(span) {
  if (span === 'bento-span-wide-left') return 'featured';
  if (span === 'bento-span-narrow-right') return 'stacked';
  if (span === 'bento-span-narrow-left') return 'compact';
  return 'split';
}

function renderCard(variant, article, assetBase, pageBase) {
  switch (variant) {
    case 'stacked':
      return bentoStackedCard(article, assetBase, pageBase, 'panel');
    case 'compact':
      return bentoCompactCard(article, pageBase, 'deep');
    case 'split':
      return bentoSplitCard(article, assetBase, pageBase, 'muted');
    default:
      return bentoCompactCard(article, pageBase, 'panel');
  }
}

function featuredImage(article, articles, assetBase) {
  const own = extractImage(article.body);
  if (own) return own;
  for (const other of articles) {
    const img = extractImage(other.body);
    if (img) return img;
  }
  return FALLBACK_IMAGES[article.id] || 'assets/slides/03-dielectric-mirror.svg';
}

function bentoFeaturedCardWithFallback(article, articles, assetBase, pageBase) {
  const img = featuredImage(article, articles, assetBase);
  const src = img.startsWith('http') ? img : `${assetBase}${img}`;
  return `<article class="bento-card bento-card--featured" data-category="${esc(article.category)}">
    <a class="bento-card-link" href="${esc(articleHref(pageBase, article.id))}">
      <div class="bento-card-media" aria-hidden="true">
        <img src="${esc(src)}" alt="" loading="lazy" />
        <div class="bento-card-media-overlay"></div>
      </div>
      <div class="bento-card-body">
        <span class="bento-card-meta">${esc(article.categoryLabel)} · ${esc(formatDate(article.published))}</span>
        <h2>${esc(article.title)}</h2>
        <p>${esc(truncateSummary(article.summary, 160))}</p>
        <span class="bento-card-cta">Read article</span>
      </div>
    </a>
  </article>`;
}

function renderSlotCard(span, article, articles, assetBase, pageBase) {
  const variant = slotVariant(span);
  if (variant === 'featured') return bentoFeaturedCardWithFallback(article, articles, assetBase, pageBase);
  return renderCard(variant, article, assetBase, pageBase);
}

function buildBentoGrid(articles, assetBase, pageBase) {
  if (!articles.length) return '<p class="catalog-meta">No articles yet.</p>';

  const cards = articles.map((article, i) => {
    const span = spanForIndex(i);
    return addSpan(renderSlotCard(span, article, articles, assetBase, pageBase), span);
  });

  const ctaSpan = spanForIndex(articles.length);
  cards.push(addSpan(bentoCtaCard(assetBase, pageBase), ctaSpan));

  return cards.join('\n');
}

export function buildKnowledgePages({ shell, write }) {
  const dataPath = path.join(ROOT, 'data/knowledge.json');
  if (!fs.existsSync(dataPath)) {
    console.log('  skip knowledge (data/knowledge.json missing — run migrate-knowledge.mjs)');
    return null;
  }

  const knowledge = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const articles = knowledge.articles || [];
  const base = '../../';
  const assetBase = '../../';

  const hubMain = `<section class="knowledge-hub">
    <div class="wrap">
      <header class="knowledge-hero">
        <nav class="product-breadcrumb knowledge-breadcrumb">
          <a href="${base}index.html">Home</a> / <a href="${base}company/about.html">About</a> / <span>Knowledge Center</span>
        </nav>
        <h1>Knowledge Center</h1>
        <p class="lead">Application notes, optical guides, and technical references for quantum and photonics labs.</p>
      </header>
      <div class="knowledge-bento" id="knowledgeGrid">
        ${buildBentoGrid(articles, assetBase, base)}
      </div>
    </div>
  </section>`;

  write(
    'engineering/knowledge/index.html',
    shell({
      base,
      title: 'Knowledge Center',
      desc: 'Application notes and technical guides for quantum optics and photonics.',
      main: hubMain,
      pageId: 'knowledge',
    })
  );

  for (const article of articles) {
    const tagHtml = (article.tags || [])
      .map((t) => `<span class="knowledge-tag">${esc(t.replace(/-/g, ' '))}</span>`)
      .join('');

    const main = `<section class="page-content knowledge-article">
      <div class="wrap">
        <nav class="product-breadcrumb">
          <a href="${base}index.html">Home</a> / <a href="${knowledgeHubHref(base)}">Knowledge Center</a> / <span>${esc(article.title)}</span>
        </nav>
        <header class="knowledge-article-header">
          <p class="knowledge-article-meta">${esc(article.categoryLabel)} · ${esc(formatDate(article.published))}</p>
          <h1>${esc(article.title)}</h1>
          ${tagHtml ? `<div class="knowledge-tags">${tagHtml}</div>` : ''}
        </header>
        ${
          article.image
            ? `<div class="knowledge-article-hero"><img src="${esc(article.image.startsWith('http') ? article.image : base + article.image)}" alt="" /></div>`
            : ''
        }
        <div class="knowledge-prose">${fixBodyLinks(article.body, base)}</div>
        <footer class="knowledge-article-footer">
          <p>Questions about specifications or custom configurations? <a href="${base}engineering/rfq.html">Request a technical quote</a> or <a href="${base}company/contact.html">contact engineering</a>.</p>
        </footer>
      </div>
    </section>`;

    write(
      `engineering/knowledge/${article.id}.html`,
      shell({
        base,
        title: article.title,
        desc: truncateSummary(article.summary, 160),
        main,
        pageId: 'knowledge-article',
      })
    );
  }

  console.log(`  knowledge: ${articles.length} articles`);

  for (const article of articles) {
    write(
      `${article.id}.html`,
      `<!DOCTYPE html><html><head><meta charset="UTF-8" /><meta http-equiv="refresh" content="0;url=engineering/knowledge/${article.id}.html" /><title>Redirect</title></head><body><p><a href="engineering/knowledge/${article.id}.html">${article.title}</a></p></body></html>`
    );
  }
  write(
    'knowledge-center.html',
    `<!DOCTYPE html><html><head><meta charset="UTF-8" /><meta http-equiv="refresh" content="0;url=engineering/knowledge/index.html" /><title>Redirect</title></head><body><p><a href="engineering/knowledge/index.html">Knowledge Center</a></p></body></html>`
  );

  return knowledge;
}
