import { app } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { REPO } from './config';
import { getAccessToken } from './github-auth';
import type { WorkspacePaths } from '../shared/types';

let workspaceRoot: string | null = null;

const CLONE_OPTS = ['--depth', '1', '--branch', REPO.branch, '--single-branch'] as const;

function userDataDir(): string {
  return app.getPath('userData');
}

function activeRepoMarker(): string {
  return join(userDataDir(), 'active-repo.txt');
}

function saveActiveRepo(path: string): void {
  workspaceRoot = path;
  writeFileSync(activeRepoMarker(), path, 'utf8');
}

function authenticatedRepoUrl(): string {
  const token = getAccessToken();
  if (token) {
    return `https://x-access-token:${token}@github.com/${REPO.owner}/${REPO.name}.git`;
  }
  return REPO.url;
}

function redactSecrets(message: string): string {
  const token = getAccessToken();
  let out = message;
  if (token) out = out.split(token).join('***');
  return out.replace(/x-access-token:[^@\s]+@/g, 'x-access-token:***@');
}

function wrapGitError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err);
  return new Error(redactSecrets(raw));
}

export function getWorkspaceRoot(): string {
  if (workspaceRoot) return workspaceRoot;

  const marker = activeRepoMarker();
  if (existsSync(marker)) {
    const saved = readFileSync(marker, 'utf8').trim();
    if (saved && existsSync(join(saved, '.git'))) {
      workspaceRoot = saved;
      return workspaceRoot;
    }
  }

  workspaceRoot = join(userDataDir(), 'repo');
  return workspaceRoot;
}

export function getWorkspacePaths(): WorkspacePaths {
  const root = getWorkspaceRoot();
  return {
    root,
    catalogJson: join(root, 'data', 'catalog.json'),
    knowledgeJson: join(root, 'data', 'knowledge.json'),
    productsAssets: join(root, 'assets', 'products'),
  };
}

function bindGit(root: string): SimpleGit {
  const g = simpleGit(root);
  g.addConfig('remote.origin.url', authenticatedRepoUrl(), false, 'local');
  return g;
}

/**
 * Git clone requires the destination path to NOT exist yet (even empty dirs fail).
 */
async function cloneRepo(): Promise<string> {
  const parent = userDataDir();
  mkdirSync(parent, { recursive: true });

  const preferred = join(parent, 'repo');
  if (existsSync(join(preferred, '.git'))) {
    saveActiveRepo(preferred);
    return preferred;
  }

  // If `repo` exists (empty or broken partial), use a fresh path — never delete (EBUSY on Windows).
  let target = preferred;
  if (existsSync(target)) {
    target = join(parent, `repo-${Date.now()}`);
  }

  try {
    await simpleGit().clone(authenticatedRepoUrl(), target, [...CLONE_OPTS]);
  } catch (err) {
    throw wrapGitError(err);
  }

  saveActiveRepo(target);
  return target;
}

/** Shallow repos can't merge on pull — fetch + hard reset instead. */
async function syncShallow(g: SimpleGit): Promise<void> {
  await g.fetch(['origin', REPO.branch, '--depth', '1', '--force']);
  await g.checkout(['-B', REPO.branch, `origin/${REPO.branch}`]);
  await g.reset(['--hard', `origin/${REPO.branch}`]);
}

async function repairInPlace(root: string): Promise<void> {
  const g = bindGit(root);
  await g.fetch(['origin', REPO.branch, '--depth', '1', '--force']);
  await g.checkout(['-B', REPO.branch, `origin/${REPO.branch}`]);
  await g.reset(['--hard', `origin/${REPO.branch}`]);
}

export async function syncWorkspace(): Promise<WorkspacePaths> {
  let root = getWorkspaceRoot();
  const gitDir = join(root, '.git');

  try {
    if (!existsSync(gitDir)) {
      root = await cloneRepo();
    } else {
      try {
        await syncShallow(bindGit(root));
      } catch {
        await repairInPlace(root);
      }
    }
  } catch (err) {
    throw wrapGitError(err);
  }

  const paths = getWorkspacePaths();
  if (!existsSync(paths.catalogJson)) {
    throw new Error(
      `Sync finished but catalog.json is missing at ${paths.catalogJson}`,
    );
  }

  return paths;
}

export function getGit(): SimpleGit {
  return bindGit(getWorkspaceRoot());
}
