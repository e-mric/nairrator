import { levels, type Analysis, type Tour, type Step } from '../types';
import { id } from './analysis';
import { sampleVariants, isReviewedSample } from './sample';
export function makeTour(a: Analysis, entryId: string): Tour {
  const entry = a.symbols.find((s) => s.id === entryId && s.component);
  if (!entry) throw new Error('Confirm a detected React entry component.');
  const queue = [entry.id],
    seen = new Set<string>();
  while (queue.length && seen.size < 8) {
    const current = queue.shift()!;
    if (seen.has(current)) continue;
    seen.add(current);
    queue.push(...a.edges.filter((e) => e.from === current).map((e) => e.to));
  }
  const steps: Step[] = [...seen].map((sid, i) => {
    const symbol = a.symbols.find((s) => s.id === sid)!;
    const e = a.evidence.find((e) => e.id === symbol.evidenceId)!;
    const related = a.edges
      .filter((e) => e.from === sid)
      .map((e) => a.symbols.find((s) => s.id === e.to)?.name)
      .filter(Boolean)
      .join(', ');
    const simple = `${i === 0 ? 'Start here. ' : ''}The code names this ${symbol.component ? 'screen component' : 'function'} ${symbol.name}. ${related ? `It refers to ${related}. Follow the next steps to inspect those pieces.` : 'This is the end of the path detected by this scan.'} We have read the code; we have not run it.`;
    const beginner = `${symbol.name} is a ${symbol.kind} in ${symbol.file}. A function groups instructions under a name. ${related ? `The parser found references to ${related}.` : 'No further supported direct references were found.'} References suggest a path, but do not prove what happens after a click.`;
    const experienced = `${symbol.name} is declared at ${symbol.file}:${e.start}–${e.end}. ${related ? `Static identifier references connect it to ${related}.` : 'No outgoing relationships were resolved by the current adapter.'} Inspect the excerpt for control flow and side effects; runtime behavior remains unverified.`;
    const expert = `TypeScript AST extraction identifies ${symbol.kind} ${symbol.name}, lines ${e.start}–${e.end}, SHA-256 ${e.hash.slice(0, 12)}. ${related ? `Syntactic outgoing references: ${related}.` : 'No resolved syntactic outgoing edges.'} No type checker, alias resolution, reachability proof, or runtime instrumentation was used.`;
    return {
      id: id('step', `${entryId}:${sid}`),
      nodeId: sid,
      title: symbol.name,
      evidenceIds: [e.id],
      status: 'fact',
      explanations:
        (a.sample && isReviewedSample(a.files) ? sampleVariants(symbol.name, e.excerpt) : null) ??
        ({
          [levels[0]]: simple,
          [levels[1]]: beginner,
          [levels[2]]: experienced,
          [levels[3]]: expert,
        } as Step['explanations']),
    };
  });
  return {
    id: id('tour', `${a.id}:${entryId}`),
    analysisId: a.id,
    title: `${a.name} / ${entry.name} · source journey`,
    entryId,
    steps,
    position: 0,
    level: levels[0],
    createdAt: new Date().toISOString(),
    origin: 'deterministic',
  };
}
