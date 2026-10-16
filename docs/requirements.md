# Additional Nairrator requirements

Accepted: 2026-10-16. These supplement the product brief in [PRD.md](PRD.md). The PRD defines intent; implementation status and verification belong in the plan and validation report.

## Development

Use Codex best practices as the development foundation, with the practical workflow maintained in [AGENTS.md](../AGENTS.md). Apply relevant Matt Pocock skills selectively after reading each selected skill; avoid imposing every skill or workflow on every task.

Explicit project requirements take precedence over reference guidance and skill recommendations. Identify conflicts and choose the simplest approach that satisfies the task. Keep each instruction in one authoritative location and link to it elsewhere.

Current source evidence takes precedence when describing implementation. The PRD describes intended behavior. Generated knowledge is a derived interpretation, never an independent authority. If implementation and PRD differ, report the discrepancy with references to both rather than presenting intent as implemented behavior.

Matt Pocock skills are development tooling, never runtime dependencies. On 2026-10-16, installed version 1.3.1 was verified by reading writing-for-agents, codebase-design, and domain-modeling under the local Codex plugin cache. The catalog also exposes diagnosing-bugs, tdd, and code-review. No installation was necessary. If absent in a future environment, try `codex plugin marketplace add mattpocock/skills`, then `codex plugin add mattpocock-skills@mattpocock`; verify availability and report unsupported CLI commands honestly.

## Persistent knowledge

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

Read before planning on 2026-10-16:

- [OpenAI best practices](https://learn.chatgpt.com/guides/best-practices): use clear task context, practical repository guidance, incremental work, verification, and review.
- [Karpathy LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f): adapt immutable sources, accumulated Markdown knowledge, schema, ingest/query/maintenance workflows, index, and log.

These are guidance, not product requirements. Their optional tools and integrations are outside scope unless independently justified.
