import { chromium } from 'playwright';
import ts from 'typescript';
import type { Analysis, Tour, PreviewCapture, PreviewTarget } from '../types';

// Only literal loopback hosts; normalize localhost to avoid DNS/proxy surprises.
export function previewAddress(value: string, ownOrigin: string): URL {
  const url = new URL(value);
  if (
    url.protocol !== 'http:' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.username ||
    url.password
  )
    throw new Error('Use an HTTP local preview address, such as http://127.0.0.1:5173.');
  if (url.hostname === 'localhost') url.hostname = '127.0.0.1';
  if (url.port === new URL(ownOrigin).port)
    throw new Error('Connect your app’s preview, not Nairrator’s own address.');
  url.hash = '';
  return url;
}

// A source event binding plus a unique visible label suggests a feature; never runtime proof.
export function suggestFeature(a: Analysis, tour: Tour, targets: PreviewTarget[]): string | null {
  const handlers = new Set(tour.steps.slice(1).map((s) => s.title));
  const entry = a.symbols.find((s) => s.id === tour.entryId);
  const excerpt = a.evidence.find((e) => e.id === entry?.evidenceId)?.excerpt ?? '';
  const source = ts.createSourceFile(
    'entry.tsx',
    excerpt,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const labels = new Set<string>();
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node)) {
      const attrs = node.openingElement.attributes.properties;
      const bound = attrs.some(
        (attr) =>
          ts.isJsxAttribute(attr) &&
          /^on[A-Z]/.test(attr.name.getText(source)) &&
          attr.initializer &&
          ts.isJsxExpression(attr.initializer) &&
          attr.initializer.expression &&
          ts.isIdentifier(attr.initializer.expression) &&
          handlers.has(attr.initializer.expression.text),
      );
      if (bound) {
        const aria = attrs.find(
          (attr) => ts.isJsxAttribute(attr) && attr.name.getText(source) === 'aria-label',
        );
        const label =
          aria &&
          ts.isJsxAttribute(aria) &&
          aria.initializer &&
          ts.isStringLiteral(aria.initializer)
            ? aria.initializer.text
            : node.children
                .filter(ts.isJsxText)
                .map((c) => c.text)
                .join(' ');
        if (label.trim()) labels.add(label.trim().replace(/\s+/g, ' ').toLowerCase());
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  const matches = targets.filter((t) => labels.has(t.label.toLowerCase()));
  return matches.length === 1 ? matches[0].id : null;
}
let capturing = false;
export async function capturePreview(
  value: string,
  ownOrigin: string,
  a: Analysis,
  tour: Tour,
): Promise<PreviewCapture> {
  const url = previewAddress(value, ownOrigin);
  if (capturing) throw new Error('A preview capture is already running. Try again shortly.');
  capturing = true;
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      chromiumSandbox: true,
      timeout: 15000,
      args: ['--no-proxy-server'],
    });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
      serviceWorkers: 'block',
      acceptDownloads: false,
      reducedMotion: 'reduce',
    });
    let blockedRequests = 0;
    await context.route('**/*', async (route) => {
      const request = route.request();
      if (
        new URL(request.url()).origin !== url.origin ||
        !['GET', 'HEAD'].includes(request.method())
      ) {
        blockedRequests++;
        await route.abort();
      } else {
        try {
          // Browser routing does not re-run for every HTTP redirect. Fetch without
          // following redirects, then reject them before any second origin is contacted.
          const response = await route.fetch({ maxRedirects: 0, timeout: 8000 });
          if (
            response.status() >= 300 &&
            response.status() < 400 &&
            response.headers()['location']
          ) {
            blockedRequests++;
            await route.abort();
          } else await route.fulfill({ response });
        } catch {
          await route.abort().catch(() => {});
        }
      }
    });
    await context.routeWebSocket('**/*', (socket) => {
      blockedRequests++;
      void socket.close();
    });
    const page = await context.newPage();
    context.on('page', (popup) => {
      if (popup !== page) void popup.close();
    });
    page.on('dialog', (dialog) => void dialog.dismiss());
    const deadline = setTimeout(() => {
      void context.close();
    }, 18000);
    try {
      const response = await page.goto(url.href, { waitUntil: 'load', timeout: 12000 });
      if (!response?.ok())
        throw new Error('The preview did not return a successful page. Check its address.');
      if (new URL(page.url()).origin !== url.origin)
        throw new Error('Preview redirects are not supported. Connect its final local address.');
      // A short bounded settling period covers initial client rendering without waiting for network-idle/HMR.
      await page.waitForTimeout(500);
      const targets = await page.evaluate(() => {
        const result: {
          id: string;
          label: string;
          x: number;
          y: number;
          width: number;
          height: number;
        }[] = [];
        for (const el of document.querySelectorAll<HTMLElement>(
          'button,a,input:not([type=hidden]),select,textarea,[role=button]',
        )) {
          const rect = el.getBoundingClientRect(),
            style = getComputedStyle(el);
          if (
            rect.width < 3 ||
            rect.height < 3 ||
            rect.bottom <= 0 ||
            rect.right <= 0 ||
            rect.top >= 800 ||
            rect.left >= 1280 ||
            style.visibility === 'hidden' ||
            style.display === 'none' ||
            style.opacity === '0'
          )
            continue;
          const label = (
            el.getAttribute('aria-label') ||
            el.innerText ||
            el.getAttribute('placeholder') ||
            el.getAttribute('name') ||
            el.tagName.toLowerCase()
          )
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 100);
          const x = Math.max(0, rect.left),
            y = Math.max(0, rect.top);
          result.push({
            id: `feature-${result.length}`,
            label,
            x,
            y,
            width: Math.min(1280, rect.right) - x,
            height: Math.min(800, rect.bottom) - y,
          });
          if (result.length >= 80) break;
        }
        return result;
      });
      const image = await page.screenshot({ type: 'png', animations: 'disabled', timeout: 4000 });
      if (new URL(page.url()).origin !== url.origin)
        throw new Error('The preview navigated away. Connect a stable local route.');
      if (image.length > 3 * 1024 * 1024)
        throw new Error('Preview image is too large. Try a simpler page.');
      return {
        url: page.url(),
        image: `data:image/png;base64,${image.toString('base64')}`,
        capturedAt: new Date().toISOString(),
        width: 1280,
        height: 800,
        targets,
        suggestedId: suggestFeature(a, tour, targets),
        blockedRequests,
      };
    } finally {
      clearTimeout(deadline);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Executable doesn’t exist'))
      throw new Error(
        'Preview capture needs Chromium. Run npx playwright install chromium, then reconnect.',
      );
    if (error instanceof Error && /net::|Timeout|closed/.test(error.message))
      throw new Error(
        'Could not capture the local preview. Check that it is running and reachable; other origins and write requests are blocked.',
      );
    throw error;
  } finally {
    try {
      await browser?.close();
    } finally {
      capturing = false;
    }
  }
}
