# Nairrator shared context

Read this page and [project state](project-state.md) at task start, following [AGENTS.md](../AGENTS.md). This is a developer-maintained wiki committed with Nairrator; it is separate from the product's future generated knowledge about target projects.

| Need                                                    | Authoritative location                  |
| ------------------------------------------------------- | --------------------------------------- |
| Current milestone, blockers, decisions to make, handoff | [Project state](project-state.md)       |
| Engineering rules and task completion                   | [AGENTS.md](../AGENTS.md)               |
| Accepted product intent and audience                    | [PRD](PRD.md)                           |
| Supplemental requirements and reference guidance        | [Requirements](requirements.md)         |
| Feature ownership, verification, skill routing          | [Engineering](engineering.md)           |
| Task acceptance and implementation checkpoints          | [Plan](plan.md)                         |
| Dated verification evidence and limitations             | [Validation](validation.md)             |
| Privacy, storage, providers and capture trust           | [Data flow](data-flow.md)               |
| Product's future accumulated-knowledge schema           | [Knowledge schema](knowledge-schema.md) |
| Dependency and font licenses                            | [Licenses](licenses.md)                 |
| Five focused chat starter prompts                       | [Chat starters](chat-starters.md)       |
| Running locally and user-facing limits                  | [README](../README.md)                  |

## Page conventions and maintenance

- Keep one authority per topic; link rather than repeat rules. Give derived facts source-file links and a review date/revision. Distinguish **source fact**, **accepted decision**, **hypothesis**, **proposal** and **unknown**. Generated text is navigation and interpretation, never independent evidence.
- Project state is a short current snapshot, not a diary. Use Git for ordinary history; keep dated test evidence in validation and task acceptance in plan. Historical verification sections describe their dates, not today's guarantees.
- For a changed source or accepted decision, read its current evidence and refresh only affected pages. Preserve contradictions with links to both sources until resolved. Keep original research/source documents intact and secrets, private captures and user data outside this public wiki.
- Re-read shared pages before editing, resolve concurrent changes, and update the index when adding/removing a substantive topic. Avoid empty pages and speculative structure.
- `npm run check:docs` checks local paths, anchors and index coverage. It cannot verify factual accuracy, discover semantic contradictions or validate external URLs. Factual review compares affected claims to source separately; record unresolved unknowns.
- Useful research belongs on a substantive topic page with primary sources, date, limitations and implications. New maintenance automation, retrieval infrastructure and custom skills require demonstrated need; schedules require a user request.

## Handoff shape

For unfinished work, update project state with: goal, completed work, remaining steps, relevant files/revision, blockers or access needed, and exact verification scope. Never assume the next chat can retrieve this chat's transcript. Worktrees receive the wiki version in their checked-out commit; merge or explicitly transfer later accepted conclusions before relying on them.
