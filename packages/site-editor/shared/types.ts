export type ProductType = 'component' | 'solution';

export type PageTemplate =
  | 'component'
  | 'solution'
  | 'configurable'
  | 'variant-catalog'
  | 'rich-page';

export interface SpecRow {
  label: string;
  value: string;
}

export interface SolutionContent {
  tagline: string | null;
  demonstrates: string[];
  kitIncludes: string[];
  capabilities: string[];
}

/** One row in a variant-catalog product table. */
export interface CatalogVariant {
  sr: number;
  sku?: string;
  product_code?: string;
  set_code?: string;
  image?: string;
  [key: string]: string | number | undefined;
}

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  type: ProductType;
  pageTemplate: PageTemplate;
  aliases: string[];
  overview: string[];
  features: string[];
  applications: string[];
  techSpecs: SpecRow[];
  keyValueSpecs: SpecRow[];
  variants: Record<string, unknown>[];
  configurationOptions: unknown | null;
  rfqSections: unknown | null;
  solutionContent: SolutionContent | null;
  customNote: string | null;
  summary: string;
  specHighlight: string;
  specs: SpecRow[];
  body: string;
  /** Rich HTML content for pageTemplate === 'rich-page'. Stored as an HTML string in catalog.json. */
  htmlBody?: string;
  image: string | null;
  images?: string[];
  tags: string[];
  writeupPath: string | null;
  category?: string;
  categoryLabel?: string;
  categoryPath?: string;
  solutionGroup?: string;
  solutionUrl?: string;
  _search: string;
}

export interface CatalogData {
  version: number;
  updated: string;
  solutions: CatalogProduct[];
  components: CatalogProduct[];
  counts: { solutions: number; components: number };
}

export interface KnowledgeCategory {
  slug: string;
  label: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  summary: string;
  published: string;
  modified: string;
  category: string;
  categoryLabel: string;
  tags: string[];
  legacyUrl: string | null;
  legacyId: number | null;
  body: string;
  /** Featured / primary image path under assets/knowledge/ */
  image?: string | null;
}

export interface KnowledgeData {
  version: number;
  updated: string;
  source: string;
  categories: KnowledgeCategory[];
  articles: KnowledgeArticle[];
}

export interface AuthStatus {
  loggedIn: boolean;
  username?: string;
  avatarUrl?: string;
}

export interface WorkspacePaths {
  root: string;
  catalogJson: string;
  knowledgeJson: string;
  productsAssets: string;
}

export interface PublishResult {
  ok: boolean;
  commitSha?: string;
  actionsUrl: string;
  files: string[];
  error?: string;
}

export interface SiteEditorApi {
  auth: {
    login: () => Promise<AuthStatus>;
    logout: () => Promise<void>;
    getStatus: () => Promise<AuthStatus>;
  };
  workspace: {
    sync: () => Promise<WorkspacePaths>;
    getPaths: () => Promise<WorkspacePaths | null>;
  };
  catalog: {
    load: () => Promise<CatalogData>;
    save: (product: CatalogProduct) => Promise<CatalogData>;
    create: (product: CatalogProduct) => Promise<CatalogData>;
    remove: (id: string, type: ProductType) => Promise<CatalogData>;
    reorder: (orderedIds: string[]) => Promise<CatalogData>;
  };
  knowledge: {
    load: () => Promise<KnowledgeData>;
    save: (article: KnowledgeArticle) => Promise<KnowledgeData>;
    create: (article: KnowledgeArticle) => Promise<KnowledgeData>;
    remove: (id: string) => Promise<KnowledgeData>;
  };
  images: {
    pickAndSave: (
      productId: string,
      slot: 'primary' | 'gallery',
      options?: { multi?: boolean; kind?: 'product' | 'knowledge' },
    ) => Promise<{ path: string; relativePath: string }[] | null>;
    saveFromPaths: (
      productId: string,
      filePaths: string[],
      slot: 'primary' | 'gallery',
      kind?: 'product' | 'knowledge',
    ) => Promise<{ path: string; relativePath: string }[]>;
    getPreviewUrl: (relativePath: string) => Promise<string | null>;
    listForProduct: (
      productId: string,
      kind?: 'product' | 'knowledge',
    ) => Promise<string[]>;
    remove: (relativePath: string) => Promise<void>;
  };
  publish: {
    run: (commitMessage: string) => Promise<PublishResult>;
    getDirtyFiles: () => Promise<string[]>;
  };
}

declare global {
  interface Window {
    siteEditor: SiteEditorApi;
  }
}

export {};
