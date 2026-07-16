import { useEffect, useState } from 'react';
import {
  fromConfigOptionGroups,
  slugifyColumnKey,
  toConfigOptionGroups,
  type ConfigOptionGroup,
} from '@shared/config-options-utils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { TagsInput } from './TagsInput';

export function ConfigurationOptionsEditor({
  productId,
  value,
  onChange,
}: {
  productId: string;
  value: unknown;
  onChange: (next: Record<string, string[]> | null) => void;
}) {
  const [groups, setGroups] = useState<ConfigOptionGroup[]>(() => toConfigOptionGroups(value));
  const [newGroupName, setNewGroupName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setGroups(toConfigOptionGroups(value));
    setNewGroupName('');
    setError('');
  }, [productId]);

  const emit = (next: ConfigOptionGroup[]) => {
    setGroups(next);
    onChange(fromConfigOptionGroups(next));
  };

  const updateGroupName = (index: number, name: string) => {
    emit(groups.map((group, i) => (i === index ? { ...group, name } : group)));
  };

  const updateGroupValues = (index: number, values: string[]) => {
    emit(groups.map((group, i) => (i === index ? { ...group, values } : group)));
  };

  const removeGroup = (index: number) => {
    emit(groups.filter((_, i) => i !== index));
  };

  const addGroup = () => {
    const key = slugifyColumnKey(newGroupName);
    if (!key) {
      setError('Enter an option name (e.g. metric type, thickness mm).');
      return;
    }
    if (groups.some((g) => slugifyColumnKey(g.name) === key)) {
      setError('That option group already exists.');
      return;
    }
    setError('');
    setNewGroupName('');
    emit([...groups, { name: newGroupName.trim(), values: [] }]);
  };

  return (
    <div className="space-y-4 rounded-lg border border-[#2a3142] bg-[#0e1118] p-4">
      <div>
        <Label>Configuration options</Label>
        <p className="mt-1 text-xs text-slate-500">
          Add option groups shown as chips on the product page (e.g. metric type: M3, M4, M5).
        </p>
      </div>

      {groups.length === 0 && (
        <p className="text-xs text-slate-500">No configuration options yet. Add a group below.</p>
      )}

      <div className="space-y-3">
        {groups.map((group, index) => {
          const savedKey = slugifyColumnKey(group.name);
          return (
            <div
              key={`${productId}-group-${index}`}
              className="space-y-3 rounded-md border border-[#2a3142] bg-[#161b26] p-3"
            >
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[12rem] flex-1">
                  <Label>Option name</Label>
                  <Input
                    className="mt-1"
                    value={group.name}
                    placeholder="e.g. metric type"
                    onChange={(e) => updateGroupName(index, e.target.value)}
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Saved as: {savedKey || '—'}
                  </p>
                </div>
                <Button type="button" variant="ghost" onClick={() => removeGroup(index)}>
                  Remove
                </Button>
              </div>
              <div>
                <Label>Values</Label>
                <p className="mb-1 mt-1 text-xs text-slate-500">Comma-separated list</p>
                <TagsInput
                  key={`${productId}-config-values-${index}`}
                  value={group.values}
                  onChange={(values) => updateGroupValues(index, values)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[12rem] flex-1">
          <Input
            placeholder="New option (e.g. thickness mm)"
            value={newGroupName}
            onChange={(e) => {
              setNewGroupName(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addGroup();
              }
            }}
          />
        </div>
        <Button type="button" onClick={addGroup}>
          Add option group
        </Button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
