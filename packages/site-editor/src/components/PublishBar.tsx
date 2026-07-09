import { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export function PublishBar({ onPublished }: { onPublished?: () => void }) {
  const [dirty, setDirty] = useState<string[]>([]);
  const [message, setMessage] = useState('content: update site data');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function refreshDirty() {
    const files = await window.siteEditor.publish.getDirtyFiles();
    setDirty(files);
  }

  useEffect(() => {
    refreshDirty();
    const id = setInterval(refreshDirty, 5000);
    return () => clearInterval(id);
  }, []);

  async function publish() {
    if (!window.confirm(`Publish ${dirty.length} file(s) to main?`)) return;
    setLoading(true);
    setStatus('');
    const result = await window.siteEditor.publish.run(message);
    setLoading(false);
    if (result.ok) {
      setStatus(`Pushed ${result.files.length} file(s). CI: ${result.actionsUrl}`);
      onPublished?.();
      refreshDirty();
    } else {
      setStatus(result.error || 'Publish failed');
    }
  }

  return (
    <div className="w-full rounded-lg border border-[#2a3142] bg-[#161b26] p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Commit message
          </div>
          <Input value={message} onChange={(e) => setMessage(e.target.value)} className="w-full" />
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button
            type="button"
            variant="primary"
            disabled={loading || dirty.length === 0}
            onClick={publish}
            className="w-[90px] text-xs"
          >
            {loading ? 'Publishing…' : `Publish (${dirty.length})`}
          </Button>
          <Button
            type="button"
            onClick={refreshDirty}
            variant="ghost"
            className="w-[90px] text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>

      {dirty.length > 0 && (
        <ul className="mt-2 max-h-24 overflow-auto pr-1 list-inside list-disc text-xs text-slate-400">
          {dirty.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}

      {status && <p className="mt-2 text-xs text-slate-300">{status}</p>}
    </div>
  );
}
