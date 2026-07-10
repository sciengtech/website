import { useState } from 'react';
import { Input } from './ui/Input';

function parseTags(text: string): string[] {
  return text
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Keeps raw text while typing so commas are not stripped mid-entry. */
export function TagsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [text, setText] = useState(() => value.join(', '));

  return (
    <Input
      value={text}
      placeholder="laser, optics, education"
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        onChange(parseTags(next));
      }}
      onBlur={() => {
        const parsed = parseTags(text);
        setText(parsed.join(', '));
        onChange(parsed);
      }}
    />
  );
}
