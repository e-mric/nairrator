import { it, expect } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { analyze } from '../src/lib/server/analysis';
import { reviewProject } from '../src/lib/server/review';

it('offers a source-linked storage recommendation without declaring a vulnerability', async () => {
  const a = await analyze(resolve('fixtures/waypoint'), true);
  const review = reviewProject(a);
  expect(review.findings).toHaveLength(1);
  expect(review.findings[0]).toMatchObject({
    category: 'quality',
    status: 'needs review',
    file: 'src/storage.ts',
  });
  expect(a.evidence.some((e) => e.id === review.findings[0].evidenceId)).toBe(true);
  expect(review.limitations.join(' ')).toContain('not verified vulnerabilities');
});
it('detects security patterns as review prompts and keeps the short report bounded', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nairrator-review-'));
  try {
    await writeFile(
      join(root, 'App.tsx'),
      `export function App({text}: {text:any}) {
   eval(text);
   localStorage.setItem('access_token',text);
   return <div dangerouslySetInnerHTML={{__html:text}}/>;
  }`,
    );
    const a = await analyze(root);
    const review = reviewProject(a);
    expect(review.findings).toHaveLength(4);
    expect(review.findings.filter((f) => f.category === 'security')).toHaveLength(3);
    expect(
      review.findings.every(
        (f) => f.status === 'needs review' && a.evidence.some((e) => e.id === f.evidenceId),
      ),
    ).toBe(true);
    expect(review.findings[0].recommendation).toContain('input');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
it('recognizes a local try/catch and makes no clean-health claim for unmatched patterns', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nairrator-review-'));
  try {
    await writeFile(
      join(root, 'save.ts'),
      `export function save(items:string[]){try{localStorage.setItem('items',JSON.stringify(items));}catch{console.error('save failed');}}`,
    );
    const review = reviewProject(await analyze(root));
    expect(review.findings).toHaveLength(0);
    expect(review.limitations.join(' ')).toContain('No findings does not establish');
    expect(review.limitations.join(' ')).toContain('runtime behavior were not assessed');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
