# Nairrator development

A local, source-linked guide helping people understand software built with AI. Teach the essential journey first; reveal detail on demand.

## Start and shared context

- At task start, read this file, [docs/index.md](docs/index.md) and [docs/project-state.md](docs/project-state.md). Follow the index only to relevant topics; inspect current source and `git status` before relying on prior claims.
- Before complex work, read [requirements](docs/requirements.md) and record goal, context, constraints, observable acceptance, checkpoints and verification in [plan](docs/plan.md).
- Re-read shared pages immediately before editing. Update affected facts and the current handoff after meaningful changes; preserve concurrent and unrelated work. Chats share committed files, not transcripts. Commit shared foundations before overlapping worktrees diverge; messages to other chats require user authorization.

## Engineering and constraints

- Feature ownership and testing strategy: [engineering](docs/engineering.md). Sources are in `src/lib/server/`, presentation in `src/routes/` and `src/lib/components/`, sample in `fixtures/`, checks in `tests/` and `scripts/`.
- Keep target files read-only, data outside targets, keys server-side, loopback/session protections, explicit cloud consent and local-only defaults. Only explicitly connected previews render in isolated browsers; never start target scripts automatically. Source links and runtime paths remain distinct; static inference is not runtime proof.
- Preserve small module interfaces and the current SvelteKit architecture. Organize new business behavior by feature; add domain/application/infrastructure/presentation layers only where they contain meaningful behavior. Conventions and exceptions: [engineering](docs/engineering.md).
- Accepted product behavior changes update [PRD](docs/PRD.md) and the affected plan. Brainstorming remains a proposal until accepted. Current source describes implementation; the PRD describes intent.
- Select a primary skill for the current phase, read it first, and add supporting skills only for distinct needs. [Skill routing](docs/engineering.md#skill-routing) records verified availability and conflict handling. Explicit project requirements take precedence over discretionary guidance; higher-priority instructions always apply. Explain material unresolved conflicts; ask only when the answer affects scope or correctness.

## Commands and completion

- Setup/dev: [README](README.md). Main commands: `npm run dev`, `npm run check`, `npm test`, `npm run build`, `npm start`, `npm run test:e2e`.
- Full verification: `npm run verify`. Documentation-only: `npm run verify:docs`. Exact scopes and browser prerequisites are in [engineering](docs/engineering.md#verification).
- Add meaningful regressions for bugs and exercise affected behavior. Review the final Git diff against acceptance criteria and these conventions. Report actual checks and limitations, separating mocks, local integration, live providers and human observations.
- Keep engineering rules here, reusable methods in skills, and project facts/decisions in linked docs. Update [project state](docs/project-state.md) with an actionable handoff when work remains. Add a custom skill only after a repeated workflow proves useful.
