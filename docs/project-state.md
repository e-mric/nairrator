# Current project state

Reviewed: 2026-10-17. Implementation baseline: `326544e` plus the preview-sizing fix and workflow setup in this publication. Recheck `git status` and current source; this page is a derived snapshot.

## Purpose and milestone

**Accepted intent:** help vibe coders understand and explain what they built, starting with the useful 80/20 journey. Experienced developers exploring unfamiliar React/TypeScript projects are a secondary audience. See [PRD](PRD.md).

**Source facts:** a working local vertical slice exists: read-only React/TypeScript source analysis, inferred source tours, four explanation levels, saved progress/evidence freshness, blueprint canvas with themes and deeper layers, optional end review, isolated running-preview capture and feature highlighting. Hosted/local model adapters and hosted speech exist, with explicit opt-in; live quality remains unverified. Evidence: [analysis](../src/lib/server/analysis.ts), [tours](../src/lib/server/tours.ts), [preview capture](../src/lib/server/local-preview.ts), [providers](../src/lib/server/providers.ts), [review](../src/lib/server/review.ts), [UI](../src/routes/+page.svelte).

## Current work and verification

- **Completed:** preview naturally sizes inside the canvas instead of creating an internal scrollbar. Evidence: [CSS](../src/app.css) and [browser regressions](../tests/browser/storyboard.spec.ts). On 2026-10-17, build/type checks and all 12 browser tests passed, including expanded controls at desktop/mobile sizes in both themes. See [validation](validation.md#natural-preview-sizing--2026-10-17).
- **Workflow setup:** developer wiki, focused chat prompts, documentation checks, aggregate verification and CI configuration are included in this publication. `npm run verify` passed on 2026-10-17: documentation structure/formatting, zero-error/zero-warning type checks, 18 module tests, production build and 12 browser tests. Evidence and scope are recorded in [validation](validation.md#shared-workflow-verification--2026-10-17).
- **Revision handoff:** `326544e` is the prior baseline. Use this publication’s commit or a newer reconciled revision for new worktrees; the older baseline lacks the sizing fix and shared workflow. Inspect Git state before sharing foundations.

## Gaps and open decisions

- **Unknown:** can target users accurately explain a real feature after the guided tour? No structured external-user study is recorded. Passing tests are not comprehension evidence.
- **Known limits:** source extraction is bounded and syntactic, feature mapping inferred, preview a 1280 × 800 snapshot rather than live interaction. Same-origin GET/HEAD capture may be incomplete; authentication sharing, offscreen/iframe/shadow-root picking and runtime instrumentation are absent. See [README](../README.md#scope-and-limits) and [data flow](data-flow.md#explicit-local-preview-capture).
- **Unverified:** live OpenAI/Ollama/ElevenLabs quality, assistive-technology audit, cross-platform packaged distribution, and GitHub-hosted CI execution. Local automated checks cover mocks and local browser/server integrations.
- **Pending accepted later scope:** PRD comparison, Git/snapshot change explanations, optional pitch practice and the product's accumulated Markdown wiki. The committed developer wiki does not implement that product feature.
- **Proposal, not accepted scope:** deeper paid assistance after the review. No billing, paywall or business-model decision exists.

## Recommended next decision

**Proposal:** prioritize validating one screen-to-source journey with a few target users before adding another explanation feature. Decide which single representative React/TypeScript app and feature to test, and define success as the user explaining its screen action, main logic and data destination in their own words. The number of participants and success threshold remain a product decision, not an established requirement.

## Actionable handoff

Goal: finish and share the preview-sizing fix and workflow foundation, then choose a bounded validation milestone.
Completed: local implementation and layout checks; workflow documents/checks/CI prepared; full verification and local diff review passed.
Remaining: verify this publication on the remote and inspect the hosted CI run, then agree the feature and criteria for external testing using [chat starters](chat-starters.md).
Relevant files: `src/app.css`, `tests/browser/`, `AGENTS.md`, `docs/`, `scripts/check-docs.mjs`, `package.json`, `.github/workflows/verify.yml`.
Blockers: no local implementation blocker known. Live provider evaluation requires a configured model/key and explicit consent; hosted CI status must be checked after this publication. Temporary local preview processes and addresses are session state, not a reproducible release setup.
