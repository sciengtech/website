import http from 'http';
import { URL } from 'url';
import { shell } from 'electron';
import { GITHUB_OAUTH, OAUTH_PORT, REPO } from './config';
import { saveToken, loadToken, clearToken } from './token-store';
import type { AuthStatus } from '../shared/types';

function authUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GITHUB_OAUTH.clientId,
    redirect_uri: GITHUB_OAUTH.redirectUri,
    scope: GITHUB_OAUTH.scope,
    state,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

async function githubApi<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

async function exchangeCode(code: string): Promise<string> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_OAUTH.clientId,
      client_secret: GITHUB_OAUTH.clientSecret,
      code,
      redirect_uri: GITHUB_OAUTH.redirectUri,
    }),
  });
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(data.error || 'OAuth token exchange failed');
  }
  return data.access_token;
}

const SUCCESS_HTML = `<html><body style="font-family:system-ui,sans-serif;padding:2rem;text-align:center">
<h2>Signed in to GitHub</h2>
<p>You can close this tab and return to SciEngTech Site Editor.</p>
</body></html>`;

/**
 * OAuth via system browser + loopback callback on :3847.
 * Keep the Electron app open until the browser redirects back.
 */
function waitForCallback(state: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let finished = false;

    function finish(err: Error | null, code?: string) {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      server.close();
      if (err) reject(err);
      else resolve(code!);
    }

    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url || '/', `http://127.0.0.1:${OAUTH_PORT}`);
        if (url.pathname !== '/callback') {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const oauthError = url.searchParams.get('error');
        if (oauthError) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<html><body><p>GitHub error: ${oauthError}</p></body></html>`);
          finish(new Error(url.searchParams.get('error_description') || oauthError));
          return;
        }

        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        if (!code || returnedState !== state) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<html><body><p>Invalid OAuth callback.</p></body></html>');
          finish(new Error('Invalid OAuth callback (missing code or state mismatch)'));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(SUCCESS_HTML);
        finish(null, code);
      } catch (err) {
        finish(err instanceof Error ? err : new Error(String(err)));
      }
    });

    const timeout = setTimeout(() => {
      finish(new Error('OAuth timed out — complete sign-in in your browser within 2 minutes'));
    }, 120_000);

    server.on('error', (err) => {
      finish(
        new Error(
          err.message.includes('EADDRINUSE')
            ? `Port ${OAUTH_PORT} is in use. Close other Site Editor instances and try again.`
            : err.message,
        ),
      );
    });

    server.listen(OAUTH_PORT, '127.0.0.1', () => {
      shell.openExternal(authUrl(state));
    });
  });
}

export async function loginWithGitHub(): Promise<AuthStatus> {
  if (!GITHUB_OAUTH.clientId || !GITHUB_OAUTH.clientSecret) {
    throw new Error(
      'Set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET in packages/site-editor/.env',
    );
  }
  const state = Math.random().toString(36).slice(2);
  const code = await waitForCallback(state);
  const token = await exchangeCode(code);

  const user = await githubApi<{ login: string; avatar_url: string }>('/user', token);
  await githubApi(`/repos/${REPO.owner}/${REPO.name}`, token);

  saveToken({ token, username: user.login, avatarUrl: user.avatar_url });
  return { loggedIn: true, username: user.login, avatarUrl: user.avatar_url };
}

export function getAuthStatus(): AuthStatus {
  const stored = loadToken();
  if (!stored?.token) return { loggedIn: false };
  return {
    loggedIn: true,
    username: stored.username,
    avatarUrl: stored.avatarUrl,
  };
}

export function logout(): void {
  clearToken();
}

export function getAccessToken(): string | null {
  return loadToken()?.token ?? null;
}
