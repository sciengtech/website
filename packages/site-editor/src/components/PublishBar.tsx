import { useEffect, useState } from 'react';
import { Button } from './ui/Button';

function shortPath(file: string) {
  const parts = file.replace(/\\/g, '/').split('/');
  if (parts.length <= 2) return file;
  return `…/${parts.slice(-2).join('/')}`;
}

export function PublishBar({ onPublished }: { onPublished?: () => void }) {
  const [dirty, setDirty] = useState<string[]>([]);
  const [message, setMessage] = useState('content: update site data');
  const [status, setStatus] = useState<{
    kind: 'ok' | 'err';
    text: string;
    actionsUrl?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

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
    if (!window.confirm(`Push ${dirty.length} file(s) to main?`)) return;
    setLoading(true);
    setStatus(null);
    const result = await window.siteEditor.publish.run(message);
    setLoading(false);
    if (result.ok) {
      setStatus({
        kind: 'ok',
        text: `Pushed ${result.files.length} file(s)`,
        actionsUrl: result.actionsUrl,
      });
      onPublished?.();
      refreshDirty();
      setShowFiles(false);
    } else {
      setStatus({ kind: 'err', text: result.error || 'Push failed' });
    }
  }

  const hasChanges = dirty.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Push changes
        </span>
        <button
          type="button"
          onClick={refreshDirty}
          className="text-[11px] text-slate-500 transition hover:text-slate-300"
          title="Refresh dirty files"
        >
          Refresh
        </button>
      </div>

      <div
        className={`rounded-md border px-2.5 py-2 text-xs ${
          hasChanges
            ? 'border-[#e11d48]/35 bg-[#e11d48]/10 text-[#fda4af]'
            : 'border-[#2a3142] bg-[#0e1118] text-slate-500'
        }`}
      >
        {hasChanges ? (
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 text-left"
            onClick={() => setShowFiles((v) => !v)}
          >
            <span>
              {dirty.length} file{dirty.length === 1 ? '' : 's'} ready
            </span>
            <span className="text-[10px] uppercase tracking-wide opacity-70">
              {showFiles ? 'Hide' : 'Show'}
            </span>
          </button>
        ) : (
          <span>Working tree clean</span>
        )}
      </div>

      {hasChanges && showFiles && (
        <ul className="max-h-28 space-y-1 overflow-y-auto rounded-md border border-[#2a3142] bg-[#0e1118] p-2">
          {dirty.map((f) => (
            <li
              key={f}
              className="truncate font-mono text-[10px] leading-relaxed text-slate-400"
              title={f}
            >
              {shortPath(f)}
            </li>
          ))}
        </ul>
      )}

      <div className="relative z-10">
        <label htmlFor="publish-commit-message" className="mb-1 block text-[11px] text-slate-500">
          Commit message
        </label>
        <textarea
          id="publish-commit-message"
          name="publish-commit-message"
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full resize-none rounded-md border border-[#2a3142] bg-[#0e1118] px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#e11d48] disabled:opacity-50"
        />
      </div>

      <Button
        type="button"
        variant="primary"
        disabled={loading || !hasChanges || !message.trim()}
        onClick={publish}
        className="w-full text-xs"
      >
        {loading ? 'Pushing…' : 'Push to GitHub'}
      </Button>

      {status && (
        <p
          className={`text-[11px] leading-snug ${
            status.kind === 'ok' ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {status.text}
          {status.kind === 'ok' && status.actionsUrl ? (
            <>
              {' · '}
              <a
                href={status.actionsUrl}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-emerald-700 underline-offset-2 hover:text-emerald-300"
              >
                CI
              </a>
            </>
          ) : null}
        </p>
      )}
    </div>
  );
}
