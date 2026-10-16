import { describe, it, expect, afterEach, vi } from 'vitest';
import { mkdtemp, writeFile, mkdir, symlink, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { analyze, safeRead } from '../src/lib/server/analysis';
import { makeTour } from '../src/lib/server/tours';
import { freshness, checkDataRoot, updateState, readState } from '../src/lib/server/storage';
import { allowProvider, validateVariants, explain, speech } from '../src/lib/server/providers';
const dirs: string[] = [];
async function temp() {
  const d = await mkdtemp(join(tmpdir(), 'nairrator-test-'));
  dirs.push(d);
  return d;
}
afterEach(async () => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});
describe('source extraction and tours', () => {
  it('connects the sample entry, event handler, logic and storage with real evidence', async () => {
    const a = await analyze(resolve('fixtures/waypoint'), true);
    const app = a.symbols.find((s) => s.name === 'App')!;
    const tour = makeTour(a, app.id);
    expect(tour.steps.map((s) => s.title)).toEqual([
      'App',
      'handleSave',
      'addPlace',
      'writePlaces',
    ]);
    expect(a.edges.every((e) => e.status === 'inference')).toBe(true);
    for (const e of a.evidence) {
      expect(e.excerpt).toBeTruthy();
      expect(e.hash).toMatch(/^[a-f0-9]{64}$/);
      expect(e.start).toBeGreaterThan(0);
    }
    expect((await freshness(a)).stale).toBe(false);
    expect(new Set(tour.steps.map((s) => s.nodeId)).size).toBe(tour.steps.length);
  });
  it('skips ignored sources, credentials and symlinks without changing target content', async () => {
    const root = await temp(),
      outside = await temp();
    await writeFile(join(root, '.gitignore'), 'ignored.tsx\n');
    const source = 'export function App(){ return <button>Save</button> }';
    await writeFile(join(root, 'App.tsx'), source);
    await writeFile(join(root, 'ignored.tsx'), source);
    await writeFile(join(root, 'secret.tsx'), source);
    await writeFile(join(root, 'token.tsx'), `const apiKey = 'sensitivecredential'; ${source}`);
    await writeFile(join(outside, 'escape.tsx'), source);
    await symlink(join(outside, 'escape.tsx'), join(root, 'escape.tsx'));
    const a = await analyze(root);
    expect(a.files.map((f) => f.path)).toEqual(['App.tsx']);
    expect(await readFile(join(root, 'App.tsx'), 'utf8')).toBe(source);
    await expect(safeRead(root, '../nope')).rejects.toThrow();
    await expect(safeRead(root, 'escape.tsx')).rejects.toThrow();
  });
  it('marks changed and missing source evidence stale', async () => {
    const root = await temp();
    await writeFile(join(root, 'App.tsx'), 'export function App(){return <div/>}');
    const a = await analyze(root);
    await writeFile(join(root, 'App.tsx'), 'export function App(){return <button/>}');
    expect((await freshness(a)).changed).toEqual(['App.tsx']);
    await rm(join(root, 'App.tsx'));
    expect((await freshness(a)).stale).toBe(true);
  });
  it('rejects data inside the target and persists tours outside it', async () => {
    const root = await temp();
    vi.stubEnv('NAIRRATOR_DATA_DIR', join(root, 'data'));
    await expect(checkDataRoot(root)).rejects.toThrow('outside');
    const data = await temp();
    vi.stubEnv('NAIRRATOR_DATA_DIR', data);
    const a = await analyze(resolve('fixtures/waypoint'));
    const t = makeTour(a, a.symbols.find((s) => s.component)!.id);
    await updateState((s) => {
      s.analysis = a;
      s.tours = [{ ...t, position: 1 }];
    });
    expect((await readState()).tours[0].position).toBe(1);
  });
});
describe('provider routing and output validation', () => {
  it('blocks cloud calls before network access in local-only mode', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    vi.stubEnv('NAIRRATOR_LOCAL_ONLY', 'true');
    expect(() => allowProvider('openai', true)).toThrow('Local-only');
    expect(() => allowProvider('speech', true)).toThrow('Local-only');
    await expect(speech('hello', true)).rejects.toThrow('Local-only');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('requires explicit opt-in even when cloud mode is enabled', () => {
    vi.stubEnv('NAIRRATOR_LOCAL_ONLY', 'false');
    expect(() => allowProvider('openai', false)).toThrow('consent');
    expect(() => allowProvider('ollama', false)).not.toThrow();
  });
  it('rejects unknown, duplicate, and malformed step output', async () => {
    const a = await analyze(resolve('fixtures/waypoint'));
    const t = makeTour(a, a.symbols.find((s) => s.component)!.id);
    expect(() => validateVariants({ steps: [] }, t)).toThrow();
    expect(() =>
      validateVariants(
        { steps: t.steps.map((s) => ({ id: 'wrong', explanations: s.explanations })) },
        t,
      ),
    ).toThrow();
    expect(
      validateVariants(
        { steps: t.steps.map((s) => ({ id: s.id, explanations: s.explanations })) },
        t,
      ).steps,
    ).toHaveLength(4);
  });
  it('handles missing local models without fallback', async () => {
    vi.stubEnv('OLLAMA_MODEL', 'test');
    const fetch = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    vi.stubGlobal('fetch', fetch);
    const a = await analyze(resolve('fixtures/waypoint'));
    const t = makeTour(a, a.symbols.find((s) => s.component)!.id);
    await expect(explain(a, t, 'ollama', false)).rejects.toThrow('no cloud fallback');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe('http://127.0.0.1:11434/api/chat');
  });
});
describe('freshness selection boundaries', () => {
  it('detects added eligible sources and nested ignore rules', async () => {
    const root = await temp();
    await mkdir(join(root, 'src'));
    await writeFile(join(root, 'src', '.gitignore'), 'hidden.tsx\n');
    await writeFile(join(root, 'src', 'App.tsx'), 'export function App(){return <div/>}');
    await writeFile(join(root, 'src', 'hidden.tsx'), 'export function Hidden(){return <div/>}');
    const a = await analyze(root);
    expect(a.files.map((f) => f.path)).toEqual(['src/App.tsx']);
    await writeFile(join(root, 'src', 'added.ts'), 'export function logic(){}');
    expect((await freshness(a)).changed).toEqual(['src/added.ts']);
  });
});
describe('compact source and default exports', () => {
  it('attributes references to the actual enclosing function and actual default export', async () => {
    const root = await temp();
    await writeFile(
      join(root, 'App.tsx'),
      "import Screen from './Screen'; function helper() {} export function App(){ helper(); return <button onClick={helper}/> } function unrelated(){}",
    );
    await writeFile(
      join(root, 'Screen.tsx'),
      'function Preview(){return <div/>} export default function Screen(){return <section/>}',
    );
    await writeFile(
      join(root, 'Entry.tsx'),
      "import Screen from './Screen'; export function Entry(){ return <Screen/> }",
    );
    const a = await analyze(root);
    const app = a.symbols.find((s) => s.name === 'App')!,
      helper = a.symbols.find((s) => s.name === 'helper')!,
      unrelated = a.symbols.find((s) => s.name === 'unrelated')!;
    expect(a.edges).toContainEqual(expect.objectContaining({ from: app.id, to: helper.id }));
    expect(a.edges.some((e) => e.from === unrelated.id)).toBe(false);
    expect(a.edges).toContainEqual(
      expect.objectContaining({
        from: a.symbols.find((s) => s.name === 'Entry')!.id,
        to: a.symbols.find((s) => s.name === 'Screen')!.id,
      }),
    );
    // Default functions used in calls must resolve to their export, not the first component.
    await writeFile(
      join(root, 'App.tsx'),
      "import Screen from './Screen'; export function App(){ Screen(); return <button/> }",
    );
    const b = await analyze(root);
    expect(b.edges).toContainEqual(
      expect.objectContaining({
        from: b.symbols.find((s) => s.name === 'App')!.id,
        to: b.symbols.find((s) => s.name === 'Screen')!.id,
      }),
    );
  });
});
describe('speech and hosted adapter contracts', () => {
  it('sends narration text only and caches the result locally', async () => {
    vi.stubEnv('NAIRRATOR_LOCAL_ONLY', 'false');
    vi.stubEnv('NAIRRATOR_DATA_DIR', await temp());
    vi.stubEnv('ELEVENLABS_API_KEY', 'test-key');
    vi.stubEnv('ELEVENLABS_VOICE_ID', 'test-voice');
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'audio/mpeg' } }),
      );
    vi.stubGlobal('fetch', fetch);
    expect(await speech('A place-saving journey.', true)).toEqual(Buffer.from([1, 2, 3]));
    await speech('A place-saving journey.', true);
    expect(fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(Object.keys(body).sort()).toEqual(['model_id', 'text']);
    expect(body.text).toBe('A place-saving journey.');
  });
  it('validates a hosted response and preserves original step/source references', async () => {
    vi.stubEnv('NAIRRATOR_LOCAL_ONLY', 'false');
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    vi.stubEnv('OPENAI_MODEL', 'configured-test-model');
    const a = await analyze(resolve('fixtures/waypoint'), true);
    const t = makeTour(a, a.symbols.find((s) => s.component)!.id);
    const payload = { steps: t.steps.map((s) => ({ id: s.id, explanations: s.explanations })) };
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          output: [{ content: [{ type: 'output_text', text: JSON.stringify(payload) }] }],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetch);
    const next = await explain(a, t, 'openai', true);
    expect(next.origin).toBe('openai');
    expect(next.steps.map((s) => s.evidenceIds)).toEqual(t.steps.map((s) => s.evidenceIds));
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.store).toBe(false);
    expect(body.text.format.strict).toBe(true);
    expect(body.input).not.toContain(a.root);
  });
});
