import { homedir } from 'node:os';
import { resolve, join, dirname, basename } from 'node:path';
import { mkdir, readFile, writeFile, rename, realpath } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { Analysis, Tour, Freshness } from '../types';
import { analyze, hash, inside } from './analysis';
export function dataRoot() {
  return resolve(process.env.NAIRRATOR_DATA_DIR || join(homedir(), '.local', 'share', 'nairrator'));
}
async function canonicalFuture(path: string): Promise<string> {
  try {
    return await realpath(path);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    return join(await canonicalFuture(dirname(path)), basename(path));
  }
}
export async function checkDataRoot(target: string) {
  const root = await realpath(resolve(target));
  const data = await canonicalFuture(dataRoot());
  if (inside(root, data)) throw new Error('Choose a data directory outside the target repository.');
}

async function save(name: string, value: unknown) {
  await mkdir(dataRoot(), { recursive: true, mode: 0o700 });
  const temp = join(dataRoot(), `${randomUUID()}.tmp`);
  await writeFile(temp, JSON.stringify(value, null, 2), { mode: 0o600 });
  await rename(temp, join(dataRoot(), name));
}
export async function readState(): Promise<{
  schemaVersion: number;
  analysis: Analysis | null;
  analyses: Analysis[];
  tours: Tour[];
}> {
  try {
    const state = JSON.parse(await readFile(join(dataRoot(), 'workspace.json'), 'utf8'));
    return {
      ...state,
      schemaVersion: 1,
      analyses: state.analyses ?? (state.analysis ? [state.analysis] : []),
    };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT')
      return { schemaVersion: 1, analysis: null, analyses: [], tours: [] };
    throw new Error('Saved workspace is unreadable. Preserve it and select a repository again.');
  }
}
let writes = Promise.resolve();
export function updateState(fn: (state: Awaited<ReturnType<typeof readState>>) => void) {
  const next = writes.then(async () => {
    const state = await readState();
    fn(state);
    await save('workspace.json', state);
  });
  writes = next.catch(() => {});
  return next;
}
export async function freshness(a: Analysis): Promise<Freshness> {
  const changed: string[] = [];
  try {
    const current = await analyze(a.root, a.sample, a.exclusions ?? []);
    const before = new Map(a.files.map((f) => [f.path, f.hash]));
    const after = new Map(current.files.map((f) => [f.path, f.hash]));
    for (const path of new Set([...before.keys(), ...after.keys()]))
      if (before.get(path) !== after.get(path)) changed.push(path);
  } catch {
    changed.push('(selected repository unavailable)');
  }

  return { stale: changed.length > 0, changed, checkedAt: new Date().toISOString() };
}
export async function cacheAudio(key: string, data?: Buffer): Promise<Buffer | null> {
  const dir = join(dataRoot(), 'audio');
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const file = join(dir, `${hash(key)}.mp3`);
  if (data) {
    const tmp = `${file}.${randomUUID()}.tmp`;
    await writeFile(tmp, data, { mode: 0o600 });
    await rename(tmp, file);
    return data;
  }
  try {
    return await readFile(file);
  } catch {
    return null;
  }
}
