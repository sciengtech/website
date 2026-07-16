export const CATEGORIES = [
  { slug: 'opto-mechanics', label: 'Opto-Mechanics', path: '/components/opto-mechanics.html' },
  {
    slug: 'motion-and-positioning',
    label: 'Motion and Positioning',
    path: '/components/motion-and-positioning.html',
  },
  { slug: 'hardware', label: 'Hardware', path: '/components/hardware.html' },
  { slug: 'fibre-optics', label: 'Fibre Optics', path: '/components/fibre-optics.html' },
  { slug: 'lasers', label: 'Lasers', path: '/components/lasers.html' },
  { slug: 'optics', label: 'Optics', path: '/components/optics.html' },
  { slug: 'lab-accessories', label: 'Lab Accessories', path: '/components/lab-accessories.html' },
] as const;

export const SOLUTION_GROUPS = [
  { slug: 'quantum-setups', label: 'Quantum Set-Ups' },
  { slug: 'training-kits', label: 'Training Kits' },
  { slug: 'state-of-the-art-setups', label: 'State of the Art Setups' },
] as const;

export const PAGE_TEMPLATES = [
  'component',
  'solution',
  'configurable',
  'variant-catalog',
  'rich-page',
] as const;

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  // Non-Latin names would otherwise yield "" and break product create / asset paths.
  return slug || `item-${Date.now().toString(36)}`;
}

export function categoryMeta(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function solutionGroupLabel(slug: string) {
  return SOLUTION_GROUPS.find((g) => g.slug === slug)?.label ?? 'Solutions';
}
