import { readFileSync, writeFileSync, existsSync } from 'fs';
import { makeBody, makeSearch } from '../shared/catalog-search';
import type {
  CatalogData,
  CatalogProduct,
  KnowledgeArticle,
  KnowledgeData,
  ProductType,
} from '../shared/types';
import { getWorkspacePaths } from './workspace';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function loadCatalog(): CatalogData {
  const { catalogJson } = getWorkspacePaths();
  if (!existsSync(catalogJson)) throw new Error('catalog.json not found — sync workspace first');
  return readJson<CatalogData>(catalogJson);
}

export function saveCatalog(data: CatalogData): CatalogData {
  const { catalogJson } = getWorkspacePaths();
  data.updated = today();
  data.counts = {
    solutions: data.solutions.length,
    components: data.components.length,
  };
  writeJson(catalogJson, data);
  return data;
}

function upsertProduct(catalog: CatalogData, product: CatalogProduct): void {
  product.body = makeBody(product);
  product._search = makeSearch(product);
  const list = product.type === 'solution' ? catalog.solutions : catalog.components;
  const idx = list.findIndex((p) => p.id === product.id);
  if (idx >= 0) list[idx] = product;
  else list.push(product);
}

export function saveProduct(product: CatalogProduct): CatalogData {
  const catalog = loadCatalog();
  upsertProduct(catalog, product);
  return saveCatalog(catalog);
}

export function createProduct(product: CatalogProduct): CatalogData {
  const catalog = loadCatalog();
  const list = product.type === 'solution' ? catalog.solutions : catalog.components;
  if (list.some((p) => p.id === product.id)) {
    throw new Error(`Product id "${product.id}" already exists`);
  }
  upsertProduct(catalog, product);
  return saveCatalog(catalog);
}

export function removeProduct(id: string, type: ProductType): CatalogData {
  const catalog = loadCatalog();
  if (type === 'solution') {
    catalog.solutions = catalog.solutions.filter((p) => p.id !== id);
  } else {
    catalog.components = catalog.components.filter((p) => p.id !== id);
  }
  return saveCatalog(catalog);
}

export function loadKnowledge(): KnowledgeData {
  const { knowledgeJson } = getWorkspacePaths();
  if (!existsSync(knowledgeJson)) throw new Error('knowledge.json not found — sync workspace first');
  return readJson<KnowledgeData>(knowledgeJson);
}

export function saveKnowledgeData(data: KnowledgeData): KnowledgeData {
  const { knowledgeJson } = getWorkspacePaths();
  data.updated = today();
  writeJson(knowledgeJson, data);
  return data;
}

export function saveArticle(article: KnowledgeArticle): KnowledgeData {
  const data = loadKnowledge();
  const idx = data.articles.findIndex((a) => a.id === article.id);
  if (idx >= 0) data.articles[idx] = article;
  else data.articles.push(article);
  return saveKnowledgeData(data);
}

export function createArticle(article: KnowledgeArticle): KnowledgeData {
  const data = loadKnowledge();
  if (data.articles.some((a) => a.id === article.id)) {
    throw new Error(`Article id "${article.id}" already exists`);
  }
  data.articles.push(article);
  return saveKnowledgeData(data);
}

export function removeArticle(id: string): KnowledgeData {
  const data = loadKnowledge();
  data.articles = data.articles.filter((a) => a.id !== id);
  return saveKnowledgeData(data);
}
