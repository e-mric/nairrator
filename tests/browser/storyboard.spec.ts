import { test, expect } from '@playwright/test';

test('storyboard themes follow system, persist preference, and preserve the scene', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.studio')).toHaveAttribute('data-theme', 'system');
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.locator('.studio')).toHaveAttribute('data-theme', 'light');
  const activeScene = await page
    .locator('.scene-card[aria-current="step"]')
    .getAttribute('aria-label');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('.studio')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.scene-card[aria-current="step"]')).toHaveAttribute(
    'aria-label',
    activeScene!,
  );
  await page.reload();
  await expect(page.locator('.studio')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.scene-card[aria-current="step"]')).toHaveAttribute(
    'aria-label',
    activeScene!,
  );
  await expect(page.locator('.code-block')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/storyboard-dark.png', fullPage: true });
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await page.screenshot({ path: 'test-results/storyboard-light.png', fullPage: true });
  // A scene card is a keyboard button; selecting it changes only the current scene.
  const first = page.getByRole('button', { name: 'Scene 1: App', exact: true });
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('aria-current', 'step');
  await page.getByRole('button', { name: 'View source' }).click();
  await expect(page.getByRole('dialog', { name: 'Source evidence' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'View source' })).toBeFocused();
  for (const width of [390, 932]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.screenshot({ path: 'test-results/storyboard-mobile-dark.png', fullPage: true });
  await page.getByRole('button', { name: 'Models & narration' }).click();
  await page.getByLabel('Theme', { exact: true }).selectOption('system');
  await page.getByRole('button', { name: 'Close Settings' }).click();
  await expect(page.locator('.studio')).toHaveAttribute('data-theme', 'system');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();
});

test('a short source-linked review is offered only at the end of the tour', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Scene 1: App', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Finish with a quick review' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Scene 4: writePlaces', exact: true }).click();
  await page.getByRole('button', { name: 'Finish with a quick review' }).click();
  await expect(page.getByRole('dialog', { name: 'A quick project review' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Plan for unavailable browser storage' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'View source · src/storage.ts' }).click();
  await expect(page.locator('.code-block')).toContainText('localStorage.setItem');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('blueprint depth menu remains readable and keyboard-operable in both themes', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const depth = page.getByRole('combobox', { name: 'EXPLANATION LEVEL' });
  const before = await page.locator('.scene-card[aria-current=step]').getAttribute('aria-label');
  for (const scheme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await depth.click();
    const popup = page.getByRole('listbox', { name: 'Explanation levels' });
    await expect(popup).toBeVisible();
    await expect(popup.getByRole('option')).toHaveCount(4);
    const colors = await popup.evaluate((el) => ({
      bg: getComputedStyle(el).backgroundColor,
      fg: getComputedStyle(el).color,
    }));
    expect(colors.bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(colors.bg).not.toBe(colors.fg);
    const contrast = await popup.evaluate((el) => {
      function luminance(rgb: string) {
        const values = rgb
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number)
          .map((v) => v / 255)
          .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
        return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
      }
      function ratio(element: Element) {
        const style = getComputedStyle(element);
        const a = luminance(style.color),
          b = luminance(style.backgroundColor);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      }
      return [ratio(el), ratio(el.querySelector('[aria-selected=true]')!)];
    });
    expect(Math.min(...contrast)).toBeGreaterThanOrEqual(4.5);

    await page.screenshot({ path: `test-results/blueprint-menu-${scheme}.png`, fullPage: true });
    await page.keyboard.press('Escape');
    await expect(popup).toHaveCount(0);
    await expect(depth).toBeFocused();
  }
  await depth.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(depth).toContainText('Beginner developer');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(page.locator('.scene-card[aria-current=step]')).toHaveAttribute(
    'aria-label',
    before!,
  );
});

test('screen context stays visible while exploring deeper source layers', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Scene 1: App', exact: true }).click();
  await expect(page.locator('.interface-stage')).toContainText('Reconstructed sample interface');
  await page.getByText('Use a screenshot instead', { exact: true }).click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'screen.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5x8AAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(page.locator('.interface-stage img')).toHaveAttribute('src', /^blob:/);
  await page.getByRole('button', { name: 'Go deeper', exact: true }).click();
  await expect(page.locator('.original-screen img')).toBeVisible();
  await expect(page.locator('.hero-drawing')).toBeVisible();
  await page.getByRole('button', { name: 'Go deeper', exact: true }).click();
  await expect(page.locator('.original-screen img')).toBeVisible();
  await page.getByRole('button', { name: 'Back to the screen', exact: true }).click();
  await expect(page.locator('.interface-stage img')).toBeVisible();
  await expect(page.locator('.tour-pagination')).toContainText('1 of 4');
});

test('blueprint canvas zoom and pan preserve the journey and reset cleanly', async ({ page }) => {
  await page.goto('/');
  const selected = await page
    .locator('.scene-card[aria-current="step"]')
    .getAttribute('aria-label');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reset canvas view' })).toHaveText('110%');
  const canvas = page.getByRole('region', { name: 'Blueprint canvas; drag empty space to pan' });
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 5, box.y + 8);
  await page.mouse.down();
  await page.mouse.move(box.x + 85, box.y + 38);
  await page.mouse.up();
  await expect(page.locator('.scene-content')).toHaveAttribute('style', /translate\(80px, 30px\)/);
  await expect(page.locator('.scene-card[aria-current="step"]')).toHaveAttribute(
    'aria-label',
    selected!,
  );
  await page.getByRole('button', { name: 'Reset canvas view' }).click();
  await expect(page.locator('.scene-content')).toHaveAttribute(
    'style',
    /translate\(0px, 0px\) scale\(1\)/,
  );
  await expect(page.locator('.interface-stage .screen-context')).toBeVisible();
});

test('local preview captures automatically and keeps a chosen feature highlighted through layers', async ({
  page,
}) => {
  const { createServer } = await import('node:http');
  const server = createServer((_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(
      '<html><body style="padding:40px;font-family:sans-serif"><h1>Running Waypoint</h1><button style="padding:20px">Save a place</button><button style="padding:20px;margin-left:30px">Search</button></body></html>',
    );
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as import('node:net').AddressInfo;
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Scene 1: App', exact: true }).click();
    await page
      .getByRole('textbox', { name: 'Local preview address' })
      .fill(`http://127.0.0.1:${address.port}`);
    await page.getByRole('button', { name: 'Connect preview', exact: true }).click();
    await expect(page.locator('.captured-interface img')).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel('Highlighted feature: Save a place')).toBeVisible();
    const imageBox = (await page.locator('.captured-interface img').boundingBox())!;
    expect(imageBox.width / imageBox.height).toBeCloseTo(1280 / 800, 2);
    await expect(page.locator('.preview-caption').first()).toContainText('Code link inferred');
    const bounds = await page.locator('.feature-highlight').getAttribute('style');
    await page.getByRole('button', { name: 'Go deeper', exact: true }).click();
    await expect(page.locator('.feature-highlight')).toHaveAttribute('style', bounds!);
    await page.getByRole('button', { name: 'Choose feature', exact: true }).click();
    await page
      .getByRole('combobox', { name: 'Feature to highlight' })
      .selectOption({ label: 'Search' });
    await expect(page.getByLabel('Highlighted feature: Search')).toBeVisible();
    await page.getByRole('button', { name: 'Go deeper', exact: true }).click();
    await expect(page.getByLabel('Highlighted feature: Search')).toBeVisible();
    await page.getByRole('button', { name: 'Refresh preview', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Refresh preview', exact: true })).toBeEnabled({
      timeout: 15000,
    });
    await expect(page.getByLabel('Highlighted feature: Search')).toBeVisible();
    await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
    await expect(page.getByLabel('Highlighted feature: Search')).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByLabel('Highlighted feature: Search')).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.screenshot({ path: 'test-results/local-preview-highlight.png', fullPage: true });
    await page.reload();
    await expect(page.locator('.captured-interface img')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Preview address', exact: true }).click();
    await page.getByRole('button', { name: 'Disconnect preview', exact: true }).click();
    await expect(page.locator('.captured-interface')).toHaveCount(0);
    await page.getByRole('textbox', { name: 'Local preview address' }).fill('https://example.com');
    await page.getByRole('button', { name: 'Connect preview', exact: true }).click();
    await expect(page.locator('.preview-error')).toContainText('HTTP local preview');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
