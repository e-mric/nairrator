import { test, expect } from '@playwright/test';
test('sample journey, evidence, depth, persistence and mobile layout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the sample project' }).click();
  await page.getByRole('button', { name: 'Confirm & build tour' }).click();
  await expect(page.getByRole('heading', { name: 'Where the journey begins' })).toBeVisible();
  await expect(page.locator('.interface-stage .screen-context')).toBeVisible();
  await expect(page.locator('.svelte-flow__node')).toHaveCount(0);
  await page.getByRole('button', { name: 'View connections' }).click();
  await expect(page.locator('.svelte-flow__node')).toHaveCount(4);
  expect((await page.locator('.visual-stage').boundingBox())!.height).toBeGreaterThan(300);
  await page.getByRole('button', { name: 'Back to the scene' }).click();
  await expect(page.locator('.code-block')).toHaveCount(0);
  await page.getByRole('button', { name: 'View source' }).click();
  await expect(page.locator('.code-block')).toContainText('onClick={handleSave}');
  await page.getByRole('button', { name: 'Close Source evidence' }).click();
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(page.getByRole('heading', { name: 'handleSave', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'EXPLANATION LEVEL' }).click();
  await page.getByRole('option', { name: 'Expert in this stack', exact: true }).click();
  await expect(page.locator('.explanation-text')).toContainText('TypeScript AST');
  await expect(page.locator('.tour-pagination')).toContainText('2 of 4');
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'handleSave', exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'EXPLANATION LEVEL' })).toContainText(
    'Expert in this stack',
  );
  await page.getByRole('button', { name: 'Read transcript' }).click();
  await expect(page.locator('.transcript p')).toBeVisible();
  await page.getByRole('button', { name: 'Close Transcript' }).click();
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Next step' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});
test('filesystem endpoints require session authorization and reject foreign origins', async ({
  request,
}) => {
  const missing = await request.post('/api/open', { data: { sample: true } });
  expect(missing.status()).toBe(403);
  const origin = await request.post('/api/open', {
    headers: { Origin: 'https://untrusted.example' },
    data: { sample: true },
  });
  expect(origin.status()).toBe(403);
  const host = await request.get('/', { headers: { Host: 'untrusted.example' } });
  expect(host.status()).toBe(403);
});

test('optional audio pause/resume uses the current step transcript (simulated audio)', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Models & narration' }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Close Settings' }).click();
  const wav = Buffer.alloc(44 + 16000);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + 16000, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(16000, 40);
  await page.route('**/api/speech', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.stepId).toMatch(/^step-/);
    expect(body.consent).toBe(true);
    await route.fulfill({ status: 200, contentType: 'audio/wav', body: wav });
  });
  await page.getByRole('button', { name: 'Generate narration for current step' }).click();
  const audio = page.locator('audio');
  await expect(audio).toBeVisible();
  await expect
    .poll(() => audio.evaluate((a) => Number.isFinite((a as HTMLAudioElement).duration)))
    .toBe(true);
  await audio.evaluate(async (a) => {
    await (a as HTMLAudioElement).play();
    (a as HTMLAudioElement).pause();
  });
  expect(await audio.evaluate((a) => (a as HTMLAudioElement).paused)).toBe(true);
  await audio.evaluate(async (a) => (a as HTMLAudioElement).play());
  expect(await audio.evaluate((a) => (a as HTMLAudioElement).paused)).toBe(false);
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(audio).toHaveCount(0);
});
test('switching repositories retains earlier saved tours and source bytes', async ({ page }) => {
  const { mkdtemp, writeFile, readFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const root = await mkdtemp(join(tmpdir(), 'nairrator-target-'));
  const source = 'export function RealFeature(){return <button>Test</button>}';
  await writeFile(join(root, 'Feature.tsx'), source);
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open a project', exact: false }).click();
    await page.getByLabel('Local repository directory').fill(root);
    await page.getByRole('button', { name: 'Open selected directory' }).click();
    await page.getByRole('button', { name: 'Confirm & build tour' }).click();
    await expect(page.getByRole('heading', { name: 'RealFeature', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Open a project', exact: true }).click();
    const menu = page.getByLabel('Reopen saved tour');
    const sample = await menu
      .locator('option')
      .filter({ hasText: 'waypoint / App' })
      .getAttribute('value');
    expect(sample).toBeTruthy();
    await menu.selectOption(sample!);
    await expect(page.locator('.sample-label')).toContainText('Sample project');
    await expect(page.locator('.hero-drawing .scene-drawing')).toBeVisible();
    expect(await readFile(join(root, 'Feature.tsx'), 'utf8')).toBe(source);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
