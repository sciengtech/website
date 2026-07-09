import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';

export function StringListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <Button type="button" variant="ghost" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" onClick={() => onChange([...items, ''])}>
        Add row
      </Button>
    </div>
  );
}
