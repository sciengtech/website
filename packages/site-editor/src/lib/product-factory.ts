import type {
  CatalogProduct,
  PageTemplate,
  ProductType,
  SolutionContent,
} from '@shared/types';
import { categoryMeta, slugify, solutionGroupLabel } from './catalog-meta';

export function emptySolutionContent(): SolutionContent {
  return { tagline: null, demonstrates: [], kitIncludes: [], capabilities: [] };
}

export function scaffoldProduct(input: {
  type: ProductType;
  name: string;
  id?: string;
  pageTemplate: PageTemplate;
  category?: string;
  solutionGroup?: string;
}): CatalogProduct {
  const id = input.id || slugify(input.name);
  const isSolution = input.type === 'solution';
  const cat = input.category ? categoryMeta(input.category) : undefined;

  return {
    id,
    sku: `SET-${id.toUpperCase().replace(/-/g, '').slice(0, 12)}`,
    name: input.name,
    type: input.type,
    pageTemplate: input.pageTemplate,
    aliases: [],
    overview: [],
    features: [],
    applications: [],
    techSpecs: [],
    keyValueSpecs: [],
    specTableTitle: null,
    customTable: null,
    variants: [],
    configurationOptions: null,
    rfqSections: null,
    solutionContent: isSolution ? emptySolutionContent() : null,
    customNote: null,
    summary: input.name,
    specHighlight: '',
    specs: [{ label: 'Procurement', value: 'Request Technical Quote' }],
    body: '',
    htmlBody: input.pageTemplate === 'rich-page' ? '' : undefined,
    image: null,
    images: [],
    tags: [],
    writeupPath: null,
    sortIndex: null,
    _search: '',
    ...(isSolution
      ? {
          solutionGroup: input.solutionGroup || 'quantum-setups',
          categoryLabel: solutionGroupLabel(input.solutionGroup || 'quantum-setups'),
          solutionUrl: `solutions/${id}.html`,
        }
      : {
          category: cat?.slug || 'opto-mechanics',
          categoryLabel: cat?.label || 'Opto-Mechanics',
          categoryPath: cat?.path || '/components/opto-mechanics.html',
        }),
  };
}
