import ts from 'typescript';
import type { Analysis, ProjectReview, ReviewFinding } from '../types';
import { id } from './analysis';

/** Small source-based checks; findings are review prompts, never vulnerability verdicts. */
export function reviewProject(analysis: Analysis): ProjectReview {
  const findings: ReviewFinding[] = [];
  const seen = new Set<string>();
  for (const evidence of analysis.evidence) {
    const source = ts.createSourceFile(
      evidence.file,
      evidence.excerpt,
      ts.ScriptTarget.Latest,
      true,
    );
    const add = (
      node: ts.Node,
      rule: string,
      category: ReviewFinding['category'],
      title: string,
      observation: string,
      recommendation: string,
    ) => {
      const start = evidence.start + source.getLineAndCharacterOfPosition(node.getStart()).line;
      const key = `${evidence.file}:${start}:${rule}`;
      if (seen.has(key)) return;
      seen.add(key);
      findings.push({
        id: id('review', key),
        category,
        title,
        observation,
        recommendation,
        evidenceId: evidence.id,
        file: evidence.file,
        start,
        status: 'needs review',
      });
    };
    function guarded(node: ts.Node) {
      for (let parent = node.parent; parent; parent = parent.parent) {
        if (
          ts.isTryStatement(parent) &&
          parent.catchClause &&
          node.getStart() >= parent.tryBlock.getStart() &&
          node.getEnd() <= parent.tryBlock.getEnd()
        )
          return true;
        if (ts.isFunctionLike(parent)) return false;
      }
      return false;
    }
    function visit(node: ts.Node) {
      if (
        (ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === 'eval') ||
        (ts.isNewExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === 'Function')
      ) {
        add(
          node,
          'dynamic-code',
          'security',
          'Review dynamic code execution',
          'The source contains eval or a Function constructor. Whether untrusted input reaches it is unknown.',
          'Check where its input comes from. Prefer an explicit set of allowed operations when possible.',
        );
      }
      if (
        (ts.isJsxAttribute(node) && node.name.getText(source) === 'dangerouslySetInnerHTML') ||
        (ts.isBinaryExpression(node) &&
          node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          ts.isPropertyAccessExpression(node.left) &&
          node.left.name.text === 'innerHTML')
      ) {
        add(
          node,
          'html',
          'security',
          'Check the HTML trust boundary',
          'This source inserts HTML directly. This pattern alone does not establish an injection vulnerability.',
          'Trace the HTML input and verify appropriate sanitization before allowing untrusted content.',
        );
      }
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        ['localStorage', 'sessionStorage'].includes(node.expression.expression.text)
      ) {
        const method = node.expression.name.text;
        const key = node.arguments[0];
        if (
          method === 'setItem' &&
          key &&
          ts.isStringLiteral(key) &&
          /token|password|secret|credential|session/i.test(key.text)
        ) {
          add(
            node,
            'sensitive-storage',
            'security',
            'Review sensitive browser storage',
            'A browser-storage key suggests authentication or other sensitive data. The stored value and threat model need review.',
            'Confirm whether the value is sensitive and assess exposure to page scripts. Choose storage and session protections appropriate to the application.',
          );
        } else if (['setItem', 'getItem', 'removeItem'].includes(method) && !guarded(node)) {
          add(
            node,
            'storage-errors',
            'quality',
            'Plan for unavailable browser storage',
            'A browser-storage call has no catch block inside this inspected function. Callers may handle it elsewhere.',
            'Check the caller’s error handling. Consider how a denied or full storage area should affect saving and what the user should see.',
          );
        }
      }
      if (node.kind === ts.SyntaxKind.AnyKeyword)
        add(
          node,
          'any',
          'maintainability',
          'Check an untyped boundary',
          'An explicit any type appears in the inspected declaration. It may be intentional, but type checks provide less information here.',
          'Consider unknown with validation or a narrower type at this boundary when practical.',
        );
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  const ordered = findings.sort(
    (a, b) => (a.category === 'security' ? 0 : 1) - (b.category === 'security' ? 0 : 1),
  );
  return {
    analysisId: analysis.id,
    createdAt: new Date().toISOString(),
    reviewedDeclarations: analysis.evidence.length,
    findings: ordered.slice(0, 4),
    additionalFindings: Math.max(0, ordered.length - 4),
    limitations: [
      'A small static review of saved declaration excerpts, capped at 5,000 characters each. It does not inspect every project file.',
      'Tests, dependencies, authentication configuration, deployment, and runtime behavior were not assessed.',
      'These are review prompts, not verified vulnerabilities. No findings does not establish that the project is secure or complete.',
    ],
  };
}
