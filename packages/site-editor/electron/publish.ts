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

export async function getDirtySourceFiles(): Promise<string[]> {
  const g = getGit();
  const status = await g.status();
  const dirty = [
    ...status.modified,
    ...status.created,
    ...status.deleted,
    ...status.not_added,
    ...status.renamed.map((r) => r.to),
  ];
  return dirty.filter((f) =>
    ALLOWED_PREFIXES.some((prefix) => f.replace(/\\/g, '/').startsWith(prefix)),
  );
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
    const commit = await g.commit(commitMessage);
    await g.push('origin', REPO.branch);

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
