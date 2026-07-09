import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function LoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError('');
    try {
      const status = await window.siteEditor.auth.login();
      if (!status.loggedIn) throw new Error('Login failed');
      await window.siteEditor.workspace.sync();
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-[#2a3142] bg-[#161b26] p-8 text-center">
        <h1 className="mb-2 text-2xl font-bold text-[#e11d48]">SciEngTech Site Editor</h1>
        <p className="mb-6 text-sm text-slate-400">
          Opens GitHub in your browser. After approving access, you will be redirected to
          localhost and can return here.
        </p>
        <Button variant="primary" className="w-full" disabled={loading} onClick={handleLogin}>
          {loading ? 'Waiting for browser sign-in…' : 'Sign in with GitHub'}
        </Button>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        <p className="mt-6 text-left text-xs text-slate-500">
          Requires <code className="text-slate-300">.env</code> with GitHub OAuth client ID and secret.
        </p>
      </div>
    </div>
  );
}
