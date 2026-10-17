# Additional Nairrator requirements

Accepted: 2026-10-16. These supplement the product brief in [PRD.md](PRD.md). The PRD defines intent; implementation status and verification belong in the plan and validation report.

## Development

Development rules are maintained in [AGENTS.md](../AGENTS.md), with [engineering](engineering.md) covering feature ownership, verification and selectively applied skills. Start shared-context navigation at [index](index.md); current capability and handoff live in [project state](project-state.md). Current source evidence describes implementation; the PRD describes intent. Preserve discrepancies with references to both, rather than treating generated prose as authority.

## Persistent knowledge

Two distinct stores: the committed developer wiki in `docs/` shares this project's context across chats, following [index conventions](index.md#page-conventions-and-maintenance). The requirements below concern the product's derived knowledge about selected target repositories; its data remains outside those targets. The developer wiki does not implement the future product knowledge layer.

- Read selected files and documents without modifying them; persist source-linked explanations. Derive interlinked Markdown pages when an accumulated wiki is justified.
- Define conventions in a schema. Start with JSON and saved tour explanations; add Markdown pages, an index, and a chronological log when persistent cross-session knowledge justifies them (latest PRD supersedes the earlier immediate-wiki wording).
- Reuse knowledge and refresh only affected pages when selected sources change.
- Preserve contradictions and unknowns rather than guessing resolutions.
- Cover overview, features, requirements, architecture, technologies, and recent changes when evidence exists. Mark missing information explicitly.
- Store knowledge in Nairrator local project data outside the target repository by default.
- Bind evidence to revision identifiers and content hashes. Changed sources trigger revalidation; generated prose is navigation and synthesis, never stronger evidence than its sources.
- Retain structured JSON for graphs, evidence, and tour playback, linked to Markdown through stable IDs.

## Maintenance and verification

Introduce incremental ingestion and source-referenced answers with the core journey. Add contradiction, broken-reference, and orphan-page maintenance as the accumulated knowledge layer becomes necessary. Report deterministic structural checks separately from AI factual review; structural success cannot establish truth. Defer vector databases and other retrieval infrastructure until measured need justifies them.

## Reference guidance

Reference guidance reviewed on 2026-10-16; Codex guide and installed skills rechecked on 2026-10-17 (see [engineering](engineering.md#reference-guidance-and-decisions)):

- [OpenAI best practices](https://learn.chatgpt.com/guides/best-practices): use clear task context, practical repository guidance, incremental work, verification, and review.
- [Karpathy LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f): adapt immutable sources, accumulated Markdown knowledge, schema, ingest/query/maintenance workflows, index, and log.

These are guidance, not product requirements. Their optional tools and integrations are outside scope unless independently justified.
