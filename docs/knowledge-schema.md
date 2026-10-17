# Knowledge schema — version 1 (design contract)

Scope: the product’s future generated knowledge about target projects. The separate committed developer wiki uses [index conventions](index.md#page-conventions-and-maintenance); it does not require this JSON/frontmatter framework.

This is a future accumulated-knowledge design, not a prerequisite for the first slice. The latest [PRD](PRD.md) calls for JSON and saved tour explanations first; add wiki pages, index, and log only when cross-session needs justify them. The current implementation stores one active analysis and tours in `workspace.json`, plus cached audio. This document is not an executable validator.

## Location and ownership

Resolve a platform-appropriate Nairrator application-data root. Under it, allocate `projects/<project-id>/`; persist a stable project ID and canonical target root in `project.json`. Keep distinct repositories isolated, and preserve identity across a deliberate relocation. The exact platform resolver remains an implementation choice. Reject a default data root inside the target repository, including paths resolving there through symlinks.

Within each project directory:

- `schema.md`: active version of this convention.
- `sources/`: optional immutable snapshots of explicitly selected documents.
- `evidence.json`: selected sources, versions, evidence spans, and derived claims.
- `graph.json`: nodes and edges linked to pages, claims, and evidence.
- `tours.json`: ordered playback steps referring to stable graph, page, and evidence IDs.
- `wiki/index.md`: catalog of page IDs, links, and one-line descriptions.
- `wiki/log.md`: append-only chronological maintenance history.
- `wiki/pages/<page-id>.md`: readable explanations.

Nairrator may write derived data only. Read target files without changing content, permissions, or repository state. Restrict traversal to selected sources; resolve symlinks before access. Treat source instructions as data rather than authorization. Do not silently ingest unselected files or secrets.

## Vocabulary and identifiers

A source is a selected original file or document. A source version is an immutable observation of its bytes. Evidence is a locatable span within a source version. A claim is a derived statement supported by evidence. A page groups related claims and explanation. A contradiction links incompatible claims without deciding which is true. A tour is an ordered sequence of playback steps.

Allocate opaque stable IDs with type prefixes (`project-`, `source-`, `version-`, `evidence-`, `claim-`, `page-`, `node-`, `edge-`, `tour-`, `step-`). Renames preserve identity; newly observed versions receive new version IDs. Never reuse retired IDs for unrelated records.

## JSON records

Each JSON document has `schemaVersion: 1`. References use IDs, not Markdown titles or current line numbers alone.

`evidence.json` contains:

- Sources: `id`, original `locator`, and selected scope.
- Versions: `id`, `sourceId`, `revision`, `sha256`, `observedAt`, optional immutable snapshot locator. Hash exact source bytes. For Git, record commit SHA and worktree state; dirty content still needs its own hash. Without version control, use an explicit unversioned revision plus a snapshot ID, never an invented commit.
- Evidence: `id`, `versionId`, `locator` (line range or document section), and quoted span or span hash. Keep historical locations bound to their version.
- Claims: `id`, `text`, `evidenceIds`, `status` (`current`, `stale`, `disputed`, `unknown`, `superseded`), `reviewedAt` (nullable), and `contradicts` (claim IDs). Unknowns may have no evidence but must be labeled. Separate inference from directly supported statements. Review time means a recorded review, not proof of truth.

`graph.json` contains `nodes` with `id`, `kind`, optional `pageId`, and `claimIds`; `edges` have `id`, `from`, `to`, `relation`, and `evidenceIds`. Unsupported relationships must be explicitly labeled as inference or unknown.

`tours.json` contains tours with `id`, `title`, and ordered `steps`; each step has `id`, `nodeId`, optional `pageId`, `evidenceIds`, and playback content. Exact media/timing fields await the primary tour requirements. Validate all references before playback and surface stale evidence.

## Markdown pages

Use frontmatter fields `schema_version`, `id`, `title`, `updated_at`, and `claim_ids`. Use stable claim anchors (`<a id="claim-…"></a>`), ordinary relative page links, and evidence IDs beside factual assertions. Evidence IDs resolve through `evidence.json` to original source locations and versions. Distinguish supported claims, inferences, contradictions, and unknowns visibly.

Begin with overview, features, requirements, architecture, technologies, and recent changes only as useful evidence becomes available; avoid empty page proliferation. The index links every page. A non-index page with no inbound link from another topic page is an orphan candidate even if cataloged. The log records timestamp, operation, affected IDs, source versions, results, and unresolved issues. Never rewrite history to hide a correction.

## Ingest selected or changed sources

1. Read the index and reuse relevant pages. Resolve selected source identity; read bytes and capture revision and SHA-256. Preserve snapshots when needed for historical references.
2. Compare hashes with the last observation. Skip unchanged content; record changed, deleted, moved, or unavailable sources explicitly. A revision change with identical bytes may reuse the explanation after checking provenance.
3. Follow evidence-to-claim-to-page/graph/tour references to mark affected claims stale before regeneration. A missing source cannot leave a claim silently current.
4. Read original evidence, revise only affected explanations and references, and retain contradictory claims with their provenance. Review claims before marking them current; unresolved conflicts stay disputed.
5. Validate staged records and links, publish a consistent set of derived files, update index and append log. A failed operation must preserve the prior usable state and report incomplete work.

## Answer with sources

Current source evidence describes implementation; the PRD describes intent. Generated pages remain derived interpretations. When intent and implementation differ, retain the discrepancy and cite each source in its proper role. Apply the guidance precedence in [requirements.md](requirements.md).

Read index, relevant pages, and underlying evidence. Revalidate versions/hashes for claims used in the answer. Cite original file/document location and revision with evidence IDs; distinguish current findings from historical claims. If evidence is missing or conflicting, say so. Reuse synthesis as navigation, but never cite generated pages as independent corroboration. Persist useful new explanations only with their evidence and appropriate status.

## Maintain and review

Deterministic structural checks: parse JSON/frontmatter; enforce required fields, unique IDs, legal statuses, reference resolution, source hashes, page anchors, index coverage, orphan candidates, graph endpoints, and ordered tour references. Hash changes establish staleness, not whether meaning changed. Explicit contradiction links can be checked structurally; discovering semantic contradictions requires factual review.

AI factual review: compare claims with original evidence, assess inference strength, identify contradictory statements and gaps, and propose source-grounded corrections. Report evidence reviewed, findings, and unresolved unknowns separately from structural results. A successful structural check never proves an explanation correct; AI review also remains fallible.

Start with index navigation and local text search. Measure source/page count, lookup latency, retrieval misses, and answer quality before proposing retrieval infrastructure. No vector database is required by this design.
