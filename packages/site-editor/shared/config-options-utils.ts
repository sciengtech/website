import { formatVariantColumnLabel, slugifyColumnKey } from './variant-utils';

export interface ConfigOptionGroup {
  /** Free-text label shown in the editor; serialized to snake_case key. */
  name: string;
  values: string[];
}

export interface RfqSection {
  id: string;
  title: string;
  parameters: string[];
}

export { formatVariantColumnLabel, slugifyColumnKey };

export function toConfigOptionGroups(raw: unknown): ConfigOptionGroup[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, unknown>).map(([key, values]) => ({
    name: key.replace(/_/g, ' '),
    values: Array.isArray(values)
      ? values.map((v) => (v == null ? '' : String(v))).filter((v) => v.trim() !== '')
      : [],
  }));
}

export function fromConfigOptionGroups(groups: ConfigOptionGroup[]): Record<string, string[]> | null {
  const out: Record<string, string[]> = {};
  for (const group of groups) {
    const key = slugifyColumnKey(group.name);
    if (!key) continue;
    const values = group.values.map((v) => v.trim()).filter(Boolean);
    if (!values.length) continue;
    out[key] = values;
  }
  return Object.keys(out).length ? out : null;
}

export function toRfqSections(raw: unknown): RfqSection[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const section = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const title = String(section.title ?? '');
    const id =
      String(section.id ?? '').trim() ||
      slugifyColumnKey(title) ||
      `section_${index + 1}`;
    const parameters = Array.isArray(section.parameters)
      ? section.parameters.map((p) => (p == null ? '' : String(p)))
      : [];
    return { id, title, parameters };
  });
}

export function fromRfqSections(sections: RfqSection[]): RfqSection[] | null {
  const out = sections
    .map((section, index) => {
      const title = section.title.trim();
      const parameters = section.parameters.map((p) => p.trim()).filter(Boolean);
      if (!title && !parameters.length) return null;
      const id =
        slugifyColumnKey(section.id) ||
        slugifyColumnKey(title) ||
        `section_${index + 1}`;
      return { id, title: title || formatVariantColumnLabel(id), parameters };
    })
    .filter((s): s is RfqSection => Boolean(s));
  return out.length ? out : null;
}
