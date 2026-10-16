# Nairrator development

## Layout and commands

- `docs/PRD.md`: product intent and scope; current implementation evidence takes precedence for behavior.
- `docs/requirements.md`: project requirements, guidance precedence, and reference guidance. Read before planning.
- `docs/plan.md`: tasks and acceptance criteria. Update for complex work.
- `docs/knowledge-schema.md`: knowledge conventions. Read before ingestion, source-based answers, or maintenance.
- `src/lib/server/`: analysis, evidence storage, providers, tours; `src/routes/`: local UI and endpoints; `fixtures/`: sample React sources; `tests/`: validation.
- Commands: `npm run dev`, `npm run check`, `npm test`, `npm run build`, `npm start`, `npm run test:e2e`. See README for setup.

## Development

- Use Codex best practices as the foundation. Define tasks by goal, context, constraints, and acceptance criteria; work in small, reviewable increments.
- When the user requests a product behavior change, update the PRD (including MVP scope where affected) and affected implementation plan as part of the work. Treat brainstorming and questions as exploration until the user accepts the change. Clarify only when intent or scope is ambiguous.
- Select Matt Pocock skills only when useful and read each selected skill before applying it. Available choices include codebase-design, domain-modeling, diagnosing-bugs, tdd, and code-review; no task requires all of them. They are development tools, not runtime dependencies.
- Keep guidance in one authoritative place; link to details. Record durable architectural decisions and correct outdated guidance. Package workflows as skills once proven repeatable.
- Follow explicit project requirements when guidance conflicts; identify the conflict and choose the simplest compliant approach.

## Completion

- Run relevant available checks, review changes against requirements and standards, update affected guidance, and report actual results and limitations.
- Review the Git diff before completion; until Git exists, review complete changed files and report that limitation.
