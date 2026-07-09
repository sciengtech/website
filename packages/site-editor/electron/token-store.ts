import { app, safeStorage } from 'electron';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const TOKEN_FILE = 'github-token.json';

interface StoredToken {
  token: string;
  username: string;
  avatarUrl?: string;
}

function tokenPath(): string {
  const dir = app.getPath('userData');
  mkdirSync(dir, { recursive: true });
  return join(dir, TOKEN_FILE);
}

export function saveToken(data: StoredToken): void {
  const payload = safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(JSON.stringify(data))
    : Buffer.from(JSON.stringify(data), 'utf8');
  writeFileSync(tokenPath(), payload);
}

export function loadToken(): StoredToken | null {
  const path = tokenPath();
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path);
    const json = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(raw)
      : raw.toString('utf8');
    return JSON.parse(json) as StoredToken;
  } catch {
    return null;
  }
}

export function clearToken(): void {
  const path = tokenPath();
  if (existsSync(path)) writeFileSync(path, '');
}
