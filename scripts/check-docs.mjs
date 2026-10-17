import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';

// Structural navigation check only; factual and external-source review stay separate.
const root = resolve(import.meta.dirname, '..');
async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : [];
    }),
  );
  return nested.flat();
}
const topics = await markdownFiles(resolve(root, 'docs'));
const files = [resolve(root, 'AGENTS.md'), resolve(root, 'README.md'), ...topics];
const texts = new Map(
  await Promise.all(files.map(async (file) => [file, await readFile(file, 'utf8')])),
);
function prose(text) {
  return text.replace(/^\s*```[^\n]*\n[\s\S]*?^\s*```/gm, '');
}
function anchors(text) {
  const seen = new Map();
  return new Set(
    [...prose(text).matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => {
      const slug = match[1]
        .toLowerCase()
        .replace(/[^\p{L}\p{N}_\-\s]/gu, '')
        .replace(/\s/g, '-');
      const count = seen.get(slug) ?? 0;
      seen.set(slug, count + 1);
      return count ? `${slug}-${count}` : slug;
    }),
  );
}
const errors = [];
const indexed = new Set();
for (const [file, text] of texts) {
  for (const match of prose(text).matchAll(/\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
    const href = match[1].replace(/^<|>$/g, '');
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) continue;
    const [pathname, fragment] = href.split('#');
    const target = pathname ? resolve(dirname(file), decodeURIComponent(pathname)) : file;
    try {
      await stat(target);
      if (file === resolve(root, 'docs/index.md')) indexed.add(target);
      if (fragment && target.endsWith('.md')) {
        const targetText = texts.get(target) ?? (await readFile(target, 'utf8'));
        if (!anchors(targetText).has(decodeURIComponent(fragment)))
          errors.push(`${relative(root, file)}: missing heading ${href}`);
      }
    } catch {
      errors.push(`${relative(root, file)}: broken local reference ${href}`);
    }
  }
}
for (const topic of topics) {
  if (topic !== resolve(root, 'docs/index.md') && !indexed.has(topic))
    errors.push(`docs/index.md: topic not indexed ${relative(root, topic)}`);
}
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else
  console.log(
    `Documentation structure passed (${files.length} files). Facts and external links require separate review.`,
  );
