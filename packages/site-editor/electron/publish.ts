import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getGit, getWorkspacePaths } from './workspace';
import { REPO } from './config';
import type { PublishResult } from '../shared/types';

const ALLOWED_PREFIXES = ['data/catalog.json', 'data/knowledge.json', 'assets/products/'];

function validateJsonSyntax(): void {
  const { catalogJson, knowledgeJson } = getWorkspacePaths();
  for (const file of [catalogJson, knowledgeJson]) {
    if (!existsSync(file)) throw new Error(`Missing ${file}`);
    JSON.parse(readFileSync(file, 'utf8'));
  }
}

export async function getDirtySourceFiles(): Promise<string[]> {
  const g = getGit();
  const status = await g.status();
  const dirty = [
    ...status.modified,
    ...status.created,
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
