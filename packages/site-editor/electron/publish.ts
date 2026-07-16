import { existsSync, readFileSync } from 'fs';
import type { SimpleGit } from 'simple-git';
import { getGit, getWorkspacePaths } from './workspace';
import { REPO } from './config';
import { loadToken } from './token-store';
import type { PublishResult } from '../shared/types';

const ALLOWED_PREFIXES = [
  'data/catalog.json',
  'data/knowledge.json',
  'assets/products/',
  'assets/knowledge/',
];

function normalizeRepoPath(file: string): string {
  return file.replace(/\\/g, '/');
}

function isAllowedSourceFile(file: string): boolean {
  const f = normalizeRepoPath(file);
  return ALLOWED_PREFIXES.some((prefix) => f === prefix || f.startsWith(prefix));
}

function validateJsonSyntax(): void {
  const { catalogJson, knowledgeJson } = getWorkspacePaths();
  for (const file of [catalogJson, knowledgeJson]) {
    if (!existsSync(file)) throw new Error(`Missing ${file}`);
    JSON.parse(readFileSync(file, 'utf8'));
  }
}

/**
 * Git refuses to commit without user.name / user.email.
 * Client machines often have neither configured — set local identity
 * from the signed-in GitHub account on this app-managed clone only.
 */
async function ensureGitIdentity(g: SimpleGit): Promise<void> {
  const stored = loadToken();
  const name = stored?.username?.trim() || 'SciEngTech Editor';
  const email = stored?.username?.trim()
    ? `${stored.username.trim()}@users.noreply.github.com`
    : 'site-editor@users.noreply.github.com';

  await g.addConfig('user.name', name, false, 'local');
  await g.addConfig('user.email', email, false, 'local');
}

/**
 * Expand directories / collapsed untracked entries to real file paths.
 * Without `-uall`, git often reports `assets/products/test/` instead of
 * `assets/products/test/primary.png`, which makes publish look stuck.
 */
export async function getDirtySourceFiles(): Promise<string[]> {
  const g = getGit();
  const porcelain = await g.raw(['status', '--porcelain=v1', '-uall']);
  const files = new Set<string>();

  for (const line of porcelain.split(/\r?\n/)) {
    if (!line || line.length < 4) continue;
    // XY PATH  or  XY ORIG -> PATH for renames
    const body = line.slice(3);
    const arrow = ' -> ';
    const pathPart = body.includes(arrow)
      ? body.slice(body.lastIndexOf(arrow) + arrow.length)
      : body;
    // Quoted paths from git: "path with spaces"
    const unquoted = pathPart.replace(/^"(.*)"$/, '$1').replace(/\\(.)/g, '$1');
    const normalized = normalizeRepoPath(unquoted.trim());
    if (!normalized || normalized.endsWith('/')) continue;
    if (isAllowedSourceFile(normalized)) files.add(normalized);
  }

  return [...files].sort();
}

export async function publishChanges(commitMessage: string): Promise<PublishResult> {
  const actionsUrl = REPO.actionsUrl;
  try {
    validateJsonSyntax();
    const dirty = await getDirtySourceFiles();
    if (dirty.length === 0) {
      return { ok: false, actionsUrl, files: [], error: 'No changes to publish' };
    }

    const g = getGit();
    await ensureGitIdentity(g);
    await g.add(dirty);

    const cached = (await g.raw(['diff', '--cached', '--name-only']))
      .split(/\r?\n/)
      .map((f) => normalizeRepoPath(f.trim()))
      .filter(Boolean);
    if (cached.length === 0) {
      return {
        ok: false,
        actionsUrl,
        files: dirty,
        error: `Nothing staged after git add (${dirty.join(', ')}). Check file permissions / git locks.`,
      };
    }

    const commit = await g.commit(commitMessage);
    await g.push('origin', REPO.branch);

    const remaining = await getDirtySourceFiles();
    if (remaining.length > 0) {
      return {
        ok: false,
        commitSha: commit.commit,
        actionsUrl,
        files: dirty,
        error: `Commit pushed, but still dirty: ${remaining.join(', ')}. Avoid Pull until this is clear.`,
      };
    }

    return {
      ok: true,
      commitSha: commit.commit,
      actionsUrl,
      files: dirty,
    };
  } catch (err) {
    return {
      ok: false,
      actionsUrl,
      files: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
