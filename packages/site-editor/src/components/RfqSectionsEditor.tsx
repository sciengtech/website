import { useEffect, useState } from 'react';
import {
  fromRfqSections,
  slugifyColumnKey,
  toRfqSections,
  type RfqSection,
} from '@shared/config-options-utils';
import { StringListEditor } from './StringListEditor';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';

export function RfqSectionsEditor({
  productId,
  value,
  onChange,
}: {
  productId: string;
  value: unknown;
  onChange: (next: RfqSection[] | null) => void;
}) {
  const [sections, setSections] = useState<RfqSection[]>(() => toRfqSections(value));

  useEffect(() => {
    setSections(toRfqSections(value));
  }, [productId]);

  const emit = (next: RfqSection[]) => {
    setSections(next);
    onChange(fromRfqSections(next));
  };

  const updateSection = (index: number, patch: Partial<RfqSection>) => {
    const next = sections.map((section, i) => {
      if (i !== index) return section;
      const merged = { ...section, ...patch };
      if (patch.title != null && (!section.id || section.id === slugifyColumnKey(section.title))) {
        merged.id = slugifyColumnKey(patch.title) || section.id;
      }
      return merged;
    });
    emit(next);
  };

  const removeSection = (index: number) => {
    emit(sections.filter((_, i) => i !== index));
  };

  const addSection = () => {
    emit([
      ...sections,
      {
        id: `section_${sections.length + 1}`,
        title: 'Specify Your Requirements',
        parameters: [''],
      },
    ]);
  };

  return (
    <div className="space-y-4 rounded-lg border border-[#2a3142] bg-[#0e1118] p-4">
      <div>
        <Label>RFQ requirement hints</Label>
        <p className="mt-1 text-xs text-slate-500">
          Optional prompts shown when customers specify requirements for a quote.
        </p>
      </div>

      {sections.length === 0 && (
        <p className="text-xs text-slate-500">No RFQ sections yet. Add one if you want guided hints.</p>
      )}

      <div className="space-y-3">
        {sections.map((section, index) => (
          <div
            key={`${section.id}-${index}`}
            className="space-y-3 rounded-md border border-[#2a3142] bg-[#161b26] p-3"
          >
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[12rem] flex-1">
                <Label>Section title</Label>
                <Input
                  className="mt-1"
                  value={section.title}
                  placeholder="e.g. Specify Your Requirements"
                  onChange={(e) => updateSection(index, { title: e.target.value })}
                />
              </div>
              <Button type="button" variant="ghost" onClick={() => removeSection(index)}>
                Remove
              </Button>
            </div>
            <StringListEditor
              label="Hint parameters"
              items={section.parameters.length ? section.parameters : ['']}
              onChange={(parameters) => updateSection(index, { parameters })}
            />
          </div>
        ))}
      </div>

      <Button type="button" onClick={addSection}>
        + Add RFQ section
      </Button>
    </div>
  );
}
