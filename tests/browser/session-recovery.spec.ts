import { test, expect } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

test('an open local page recovers authorization after a server restart', async ({
  page,
  request,
}) => {
  const dataDir = await mkdtemp(join(tmpdir(), 'nairrator-session-'));
  let server: ChildProcess | undefined;
  const start = async () => {
    server = spawn(process.execPath, ['scripts/start.mjs'], {
      env: {
        ...process.env,
        PORT: '4193',
        NAIRRATOR_DATA_DIR: dataDir,
        NAIRRATOR_LOCAL_ONLY: 'true',
      },
      stdio: 'ignore',
    });
    await expect(async () => {
      expect((await request.get('http://127.0.0.1:4193/')).status()).toBe(200);
    }).toPass({ timeout: 5000 });
  };
  const stop = async () => {
    if (server && server.exitCode === null) {
      const exited = once(server, 'exit');
      server.kill('SIGTERM');
      await exited;
    }
  };
  try {
    await start();
    await page.goto('http://127.0.0.1:4193/');
    // A working dialog interaction confirms hydration before the restart.
    await expect(async () => {
      await page.getByRole('button', { name: 'Open a project', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Your projects' })).toBeVisible({
        timeout: 300,
      });
    }).toPass({ timeout: 3000 });
    await page.getByRole('button', { name: 'Close Your projects' }).click();
    await stop();
    await start();
    await page.getByRole('button', { name: 'Explore the sample project' }).click();
    await expect(page.getByRole('button', { name: 'Confirm & build tour' })).toBeVisible({
      timeout: 3000,
    });
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.getByRole('button', { name: 'Confirm & build tour' }).click();
    await page.getByRole('button', { name: 'Next step' }).click();
    await page.getByRole('combobox', { name: 'EXPLANATION LEVEL' }).click();
    await page.getByRole('option', { name: 'Expert in this stack', exact: true }).click();
    await expect(page.getByRole('status')).toHaveCount(0);
    await stop();
    await start();
    await page.getByRole('button', { name: 'Next step' }).click();
    await expect(page.getByRole('heading', { name: 'addPlace', exact: true })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'EXPLANATION LEVEL' })).toContainText(
      'Expert in this stack',
    );
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
  } finally {
    await stop();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test('session renewal rejects missing browser context and cross-origin requests', async ({
  request,
}) => {
  const noContext = await request.post('/api/session', { data: {} });
  expect(noContext.status()).toBe(403);
  const foreign = await request.post('/api/session', {
    headers: { Origin: 'https://untrusted.example', 'Sec-Fetch-Site': 'cross-site' },
    data: {},
  });
  expect(foreign.status()).toBe(403);
  const unicode = await request.post('/api/freshness', {
    headers: { 'x-nairrator-token': 'é'.repeat(64) },
    data: {},
  });
  expect(unicode.status()).toBe(403);
});
