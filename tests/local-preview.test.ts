import { describe, it, expect } from 'vitest';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { resolve } from 'node:path';
import { analyze } from '../src/lib/server/analysis';
import { makeTour } from '../src/lib/server/tours';
import { capturePreview, previewAddress, suggestFeature } from '../src/lib/server/local-preview';
const ownOrigin = 'http://127.0.0.1:4173';
async function sample() {
  const analysis = await analyze(resolve('fixtures/waypoint'), true);
  return { analysis, tour: makeTour(analysis, analysis.symbols.find((s) => s.name === 'App')!.id) };
}
describe('local preview capture', () => {
  it('accepts only literal loopback HTTP previews on a separate port', () => {
    expect(previewAddress('http://localhost:5173/path#anchor', ownOrigin).href).toBe(
      'http://127.0.0.1:5173/path',
    );
    for (const address of [
      'https://127.0.0.1:5173',
      'http://example.com',
      'http://127.0.0.1.example.com',
      'file:///tmp/app.html',
      'http://user:pass@localhost:5173',
      'http://localhost:4173',
    ])
      expect(() => previewAddress(address, ownOrigin)).toThrow();
  });
  it('suggests a unique source-bound control and preserves ambiguity', async () => {
    const { analysis, tour } = await sample();
    const target = { id: 'save', label: 'Save a place', x: 20, y: 40, width: 100, height: 30 };
    expect(suggestFeature(analysis, tour, [target])).toBe('save');
    expect(suggestFeature(analysis, tour, [target, { ...target, id: 'duplicate' }])).toBeNull();
    expect(suggestFeature(analysis, tour, [{ ...target, label: 'Unrelated' }])).toBeNull();
  });
  it('captures the actual rendered interface, blocks other origins and write requests, and refuses redirects', async () => {
    const { analysis, tour } = await sample();
    let forbiddenHits = 0,
      writes = 0;
    const foreign = createServer((_req, res) => {
      forbiddenHits++;
      res.end('foreign');
    });
    await new Promise<void>((r) => foreign.listen(0, '127.0.0.1', r));
    const foreignUrl = `http://127.0.0.1:${(foreign.address() as AddressInfo).port}`;
    const server = createServer((req, res) => {
      if (req.method === 'POST') writes++;
      if (req.url === '/redirect') {
        res.writeHead(302, { Location: foreignUrl });
        res.end();
        return;
      }
      res.setHeader('Content-Type', 'text/html');
      res.end(
        `<h1>Actual preview</h1><button style="margin:40px">Save a place</button><script>document.querySelector('button').textContent='Save a place';fetch('${foreignUrl}/secret');fetch('/write',{method:'POST'});</script>`,
      );
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const address = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
      const capture = await capturePreview(address, ownOrigin, analysis, tour);
      expect(capture.image).toMatch(/^data:image\/png;base64,/);
      expect(capture.targets.find((t) => t.id === capture.suggestedId)?.label).toBe('Save a place');
      expect(capture.blockedRequests).toBeGreaterThanOrEqual(2);
      expect(forbiddenHits).toBe(0);
      expect(writes).toBe(0);
      await expect(
        capturePreview(`${address}/redirect`, ownOrigin, analysis, tour),
      ).rejects.toThrow();
      expect(forbiddenHits).toBe(0);
    } finally {
      await Promise.all([
        new Promise<void>((r) => server.close(() => r())),
        new Promise<void>((r) => foreign.close(() => r())),
      ]);
    }
  }, 25000);
});
