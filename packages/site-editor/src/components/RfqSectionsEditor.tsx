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

const DEFAULT_SECTION: RfqSection = {
  id: 'requirements',
  title: 'Specify Your Requirements',
  parameters: [
    'Application and experimental goals',
    'Wavelength / spectral range',
    'Power, repetition rate, or bandwidth targets',
    'Integration and mounting requirements',
    'Timeline and quantity',
  ],
};

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

  const enabled = sections.length > 0;

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Label>Specify Your Requirements</Label>
          <p className="mt-1 text-xs text-slate-500">
            When enabled, the live page shows a “Specify Your Requirements” button with a text box
            customers use to add notes to their quote.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              if (e.target.checked) emit([{ ...DEFAULT_SECTION, parameters: [...DEFAULT_SECTION.parameters] }]);
              else emit([]);
            }}
          />
          Show on page
        </label>
      </div>

      {!enabled && (
        <p className="text-xs text-slate-500">
          Off — the requirements button and text box will not appear on the product page.
        </p>
      )}

      {enabled && (
        <>
          <div className="space-y-3">
            {sections.map((section, index) => (
              <div
                key={`${section.id}-${index}`}
                className="space-y-3 rounded-md border border-[#2a3142] bg-[#161b26] p-3"
              >
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[12rem] flex-1">
                    <Label>Button / section title</Label>
                    <Input
                      className="mt-1"
                      value={section.title}
                      placeholder="e.g. Specify Your Requirements"
                      onChange={(e) => updateSection(index, { title: e.target.value })}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Shown as the button label on the product page.
                    </p>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => removeSection(index)}>
                    Remove
                  </Button>
                </div>
                <StringListEditor
                  label="Hint parameters (bullet list above the text box)"
                  items={section.parameters.length ? section.parameters : ['']}
                  onChange={(parameters) => updateSection(index, { parameters })}
                />
              </div>
            ))}
          </div>

          <Button type="button" onClick={addSection}>
            + Add RFQ section
          </Button>
        </>
      )}
    </div>
  );
}
