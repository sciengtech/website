import type { CustomTable } from '@shared/types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';

function normalizeTable(table: CustomTable | null | undefined): CustomTable {
  // Blank column names are intentional — live page hides thead when all names are empty.
  const columns =
    table?.columns?.length ? table.columns.map((c) => String(c ?? '')) : ['', ''];
  const colCount = Math.max(columns.length, 1);
  const rows = (table?.rows || []).map((row) => {
    const next = Array.isArray(row) ? row.map((c) => String(c ?? '')) : [];
    while (next.length < colCount) next.push('');
    return next.slice(0, colCount);
  });
  return {
    title: table?.title ?? null,
    columns: columns.length ? columns : [''],
    rows,
  };
}

function tablesEqual(a: CustomTable, b: CustomTable): boolean {
  return (
    (a.title || null) === (b.title || null) &&
    a.columns.length === b.columns.length &&
    a.rows.length === b.rows.length &&
    a.columns.every((c, i) => c === b.columns[i]) &&
    a.rows.every((row, ri) => row.every((cell, ci) => cell === (b.rows[ri]?.[ci] || '')))
  );
}

export function customTableFromProduct(product: {
  customTable?: CustomTable | null;
  techSpecs?: { label: string; value: string }[];
  specTableTitle?: string | null;
}): CustomTable {
  if (product.customTable?.columns?.length) {
    return normalizeTable(product.customTable);
  }
  if (product.techSpecs?.length) {
    return normalizeTable({
      title: product.specTableTitle || null,
      columns: ['Label', 'Value'],
      rows: product.techSpecs.map((r) => [r.label || '', r.value || '']),
    });
  }
  return normalizeTable({
    title: product.specTableTitle || null,
    columns: ['', ''],
    rows: [],
  });
}

/** True when the table would render on the live site. */
export function customTableHasContent(table: CustomTable | null | undefined): boolean {
  if (!table?.rows?.length) return false;
  return table.rows.some((row) => (row || []).some((cell) => String(cell || '').trim()));
}

export function CustomTableEditor({
  table,
  onChange,
  defaultTitlePlaceholder = 'SPECIFICATION SHEET',
}: {
  table: CustomTable;
  onChange: (table: CustomTable) => void;
  defaultTitlePlaceholder?: string;
}) {
  const current = normalizeTable(table);

  function commit(next: CustomTable) {
    const normalized = normalizeTable(next);
    if (tablesEqual(current, normalized)) return;
    onChange(normalized);
  }

  function setColumn(index: number, value: string) {
    const columns = [...current.columns];
    columns[index] = value;
    commit({ ...current, columns });
  }

  function addColumn() {
    const columns = [...current.columns, ''];
    const rows = current.rows.map((row) => [...row, '']);
    commit({ ...current, columns, rows });
  }

  function removeColumn(index: number) {
    if (current.columns.length <= 1) return;
    const columns = current.columns.filter((_, i) => i !== index);
    const rows = current.rows.map((row) => row.filter((_, i) => i !== index));
    commit({ ...current, columns, rows });
  }

  function setCell(rowIndex: number, colIndex: number, value: string) {
    const rows = current.rows.map((row, i) => {
      if (i !== rowIndex) return row;
      const next = [...row];
      next[colIndex] = value;
      return next;
    });
    commit({ ...current, rows });
  }

  function addRow() {
    commit({
      ...current,
      rows: [...current.rows, current.columns.map(() => '')],
    });
  }

  function removeRow(index: number) {
    commit({
      ...current,
      rows: current.rows.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="space-y-3" autoComplete="off">
      <div>
        <Label>Custom table title (optional)</Label>
        <Input
          autoComplete="off"
          placeholder={defaultTitlePlaceholder}
          value={current.title || ''}
          onChange={(e) => commit({ ...current, title: e.target.value || null })}
        />
        <p className="mt-1 text-xs text-slate-500">
          Table title (e.g. SPECIFICATION SHEET) is separate from column headers. Leave blank for
          the default title. Leave all column names blank to hide the column header row on the live
          page.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Columns</Label>
          <Button type="button" onClick={addColumn}>
            Add column
          </Button>
        </div>
        <div className="space-y-2">
          {current.columns.map((col, i) => (
            <div key={i} className="flex gap-2">
              <Input
                autoComplete="off"
                placeholder={`Column ${i + 1} (optional name)`}
                value={col}
                onChange={(e) => setColumn(i, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                disabled={current.columns.length <= 1}
                onClick={() => removeColumn(i)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Rows</Label>
          <Button type="button" onClick={addRow}>
            Add row
          </Button>
        </div>
        {current.rows.length === 0 ? (
          <p className="text-xs text-slate-500">No rows yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[#2a3142]">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#161b26] text-left text-xs uppercase tracking-wide text-slate-400">
                  {current.columns.map((col, i) => (
                    <th key={i} className="border-b border-[#2a3142] px-2 py-2 font-medium">
                      {col || `Column ${i + 1}`}
                    </th>
                  ))}
                  <th className="border-b border-[#2a3142] px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {current.rows.map((row, ri) => (
                  <tr key={ri} className="align-top">
                    {current.columns.map((_, ci) => (
                      <td key={ci} className="border-b border-[#2a3142] px-2 py-2">
                        <Input
                          autoComplete="off"
                          value={row[ci] || ''}
                          onChange={(e) => setCell(ri, ci, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="border-b border-[#2a3142] px-2 py-2">
                      <Button type="button" variant="ghost" onClick={() => removeRow(ri)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
