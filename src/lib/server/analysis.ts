import ts from 'typescript';
import { createHash } from 'node:crypto';
import { readFile, readdir, realpath, lstat } from 'node:fs/promises';
import { resolve, relative, extname, dirname, basename, isAbsolute } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ignore from 'ignore';
import type { Analysis, Evidence, Relationship, SymbolFact } from '../types';
export const hash = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
export const id = (type: string, value: string) => `${type}-${hash(value).slice(0, 20)}`;
export function inside(root: string, path: string) {
  const rel = relative(root, path);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}
const excluded =
  /(^|\/)(node_modules|\.git|dist|build|coverage|\.next|\.svelte-kit|vendor|\.cache|\.venv|__pycache__)(\/|$)|(^|\/)(\.env[^/]*|[^/]*(secret|credential|private[-_]?key)[^/]*|id_rsa|id_ed25519)(\/|$)|\.(pem|key|p12|pfx|map|min\.js)$/i;
export async function safeRead(root: string, file: string) {
  const absolute = resolve(root, file);
  if (!inside(root, absolute) || excluded.test(file))
    throw new Error('Source is outside the selected scope.');
  const actual = await realpath(absolute);
  if (!inside(root, actual) || actual !== absolute)
    throw new Error('Symlink sources are excluded.');
  const stat = await lstat(actual);
  if (!stat.isFile() || stat.size > 200_000)
    throw new Error('Source is unavailable or exceeds 200 KB.');
  return readFile(actual, 'utf8');
}
function containsJsx(node: ts.Node): boolean {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node))
    return true;
  return ts.forEachChild(node, containsJsx) ?? false;
}
export async function analyze(
  input: string,
  sample = false,
  exclusions: string[] = [],
): Promise<Analysis> {
  const root = await realpath(resolve(input));
  if (!(await lstat(root)).isDirectory()) throw new Error('Select a repository directory.');
  const ig = ignore().add(exclusions);
  try {
    ig.add(await safeRead(root, '.gitignore'));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT')
      throw new Error('Cannot safely read the selected repository ignore rules.');
  }
  const files: { path: string; hash: string }[] = [],
    evidence: Evidence[] = [],
    symbols: SymbolFact[] = [],
    edges: Relationship[] = [],
    warnings: string[] = [];
  const trees = new Map<string, ts.SourceFile>();
  const ranges = new Map<string, { start: number; end: number }>();
  const defaults = new Map<string, string>();
  let revision = 'unversioned';
  try {
    const { stdout } = await promisify(execFile)(
      'git',
      ['--no-optional-locks', '-c', 'core.fsmonitor=false', '-C', root, 'rev-parse', 'HEAD'],
      { timeout: 5000 },
    );
    revision = `${stdout.trim()} (worktree snapshot)`;
  } catch {
    /* honest unversioned marker */
  }
  let visited = 0,
    totalBytes = 0;
  async function walk(
    dir: string,
    inherited: { base: string; matcher: ReturnType<typeof ignore> }[] = [],
  ) {
    const rules = [...inherited];
    if (dir) {
      try {
        rules.push({
          base: `${dir}/`,
          matcher: ignore().add(await safeRead(root, `${dir}/.gitignore`)),
        });
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT')
          throw new Error(`Cannot safely read ignore rules in ${dir}.`);
      }
    }
    if (visited > 5000 || files.length >= 150 || totalBytes > 3_000_000) return;
    let entries = await readdir(resolve(root, dir), { withFileTypes: true });
    entries = entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      if (visited >= 5000) break;
      visited++;
      const path = dir ? `${dir}/${e.name}` : e.name;
      if (
        excluded.test(path) ||
        ig.ignores(path) ||
        rules.some((r) => r.matcher.ignores(path.slice(r.base.length))) ||
        e.isSymbolicLink()
      )
        continue;
      if (e.isDirectory()) {
        if (!ig.ignores(`${path}/`)) await walk(path, rules);
        continue;
      }
      if (!/\.(tsx?|jsx?)$/.test(path) || /\.(test|spec|d)\.[tj]sx?$/.test(path)) continue;
      if (files.length >= 150 || totalBytes > 3_000_000) break;
      let source: string;
      try {
        source = await safeRead(root, path);
      } catch {
        warnings.push(`Skipped unavailable or large file: ${path}`);
        continue;
      }
      // Conservative exclusion: never expose a file that appears to contain a credential literal.
      if (
        /(?:sk-(?:proj-)?[\w-]{16,}|AKIA[A-Z0-9]{16}|-----BEGIN .*PRIVATE KEY|(?:api[_-]?key|password|secret|token)\s*[:=]\s*['"][^'"\n]{8,})/i.test(
          source,
        )
      ) {
        warnings.push(`Skipped possible credentials: ${path}`);
        continue;
      }
      totalBytes += Buffer.byteLength(source);
      const contentHash = hash(source);
      files.push({ path, hash: contentHash });
      const sf = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
      trees.set(path, sf);
      function visit(n: ts.Node) {
        let name: string | undefined;
        if (ts.isFunctionDeclaration(n) || ts.isClassDeclaration(n)) name = n.name?.text;
        if (
          ts.isVariableDeclaration(n) &&
          ts.isIdentifier(n.name) &&
          n.initializer &&
          (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer))
        )
          name = n.name.text;
        if (name && symbols.length < 500) {
          const start = sf.getLineAndCharacterOfPosition(n.getStart()).line + 1,
            end = sf.getLineAndCharacterOfPosition(n.getEnd()).line + 1;
          const eid = id('evidence', `${path}:${contentHash}:${n.getStart()}:${n.getEnd()}`);
          evidence.push({
            id: eid,
            file: path,
            hash: contentHash,
            revision,
            start,
            end,
            excerpt: source.slice(n.getStart(), n.getEnd()).slice(0, 5000),
            method: 'typescript-ast',
          });
          const sid = id('symbol', `${path}:${name}:${n.getStart()}`);
          ranges.set(sid, { start: n.getStart(), end: n.getEnd() });
          if (
            ts.canHaveModifiers(n) &&
            ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
          )
            defaults.set(path, name);
          symbols.push({
            id: sid,
            name,
            file: path,
            kind: ts.isClassDeclaration(n) ? 'class' : 'function',
            evidenceId: eid,
            component: /^[A-Z]/.test(name) && containsJsx(n),
          });
        }
        ts.forEachChild(n, visit);
      }
      visit(sf);
      for (const statement of sf.statements)
        if (ts.isExportAssignment(statement) && ts.isIdentifier(statement.expression))
          defaults.set(path, statement.expression.text);
    }
  }
  await walk('');
  if (visited > 5000 || files.length >= 150 || totalBytes > 3_000_000)
    warnings.push(
      'Scan limit reached: 150 files, 3 MB, or 5,000 directory entries. Narrow the selection if needed.',
    );
  for (const [file, sf] of trees) {
    const imports = new Map<string, { file: string; name: string }>();
    for (const statement of sf.statements)
      if (
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteral(statement.moduleSpecifier) &&
        statement.moduleSpecifier.text.startsWith('.')
      ) {
        const base = resolve(dirname(resolve(root, file)), statement.moduleSpecifier.text);
        const target = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx']
          .map((s) => relative(root, base + s))
          .find((p) => trees.has(p));
        if (!target) continue;
        const clause = statement.importClause;
        if (clause?.name) imports.set(clause.name.text, { file: target, name: 'default' });
        if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings))
          for (const el of clause.namedBindings.elements)
            imports.set(el.name.text, {
              file: target,
              name: el.propertyName?.text ?? el.name.text,
            });
      }
    function visit(n: ts.Node) {
      const owners = symbols
        .filter(
          (s) =>
            s.file === file &&
            ranges.get(s.id)!.start <= n.getStart() &&
            ranges.get(s.id)!.end >= n.getEnd(),
        )
        .sort(
          (a, b) =>
            ranges.get(b.id)!.end -
            ranges.get(b.id)!.start -
            (ranges.get(a.id)!.end - ranges.get(a.id)!.start),
        );
      const owner = owners.at(-1);
      if (
        owner &&
        ts.isIdentifier(n) &&
        ((ts.isCallExpression(n.parent) && n.parent.expression === n) ||
          (ts.isJsxExpression(n.parent) && ts.isJsxAttribute(n.parent.parent)) ||
          ((ts.isJsxOpeningElement(n.parent) || ts.isJsxSelfClosingElement(n.parent)) &&
            n.parent.tagName === n))
      ) {
        const imported = imports.get(n.text);
        const target = imported
          ? symbols.find(
              (s) =>
                s.file === imported.file &&
                s.name ===
                  (imported.name === 'default' ? defaults.get(imported.file) : imported.name),
            )
          : symbols.find((s) => s.file === file && s.name === n.text && s.id !== owner.id);
        if (target && !edges.some((e) => e.from === owner.id && e.to === target.id))
          edges.push({
            id: id('edge', `${owner.id}:${target.id}`),
            from: owner.id,
            to: target.id,
            label: ts.isCallExpression(n.parent)
              ? 'references call'
              : ts.isJsxExpression(n.parent)
                ? 'event binding'
                : 'renders component',
            status: 'inference',
            evidenceIds: [owner.evidenceId, target.evidenceId],
          });
      }
      ts.forEachChild(n, visit);
    }
    visit(sf);
  }
  warnings.push(
    'Static React/TypeScript inspection only. Paths are inferred from direct identifier references; aliases, dynamic dispatch, framework routing, API and storage behavior need review or runtime verification.',
  );
  return {
    id: id('analysis', `${root}:${JSON.stringify(files)}`),
    name: basename(root),
    root,
    sample,
    exclusions,
    revision,
    createdAt: new Date().toISOString(),
    files,
    symbols,
    edges,
    evidence,
    warnings,
  };
}
