# Engineering reference

Reviewed: 2026-10-17 against `326544e` and the current working tree. Engineering rules live in [AGENTS.md](../AGENTS.md); current capability and handoff live in [project state](project-state.md).

## Architecture and feature ownership

Single-user SvelteKit/Svelte/TypeScript app with a Node loopback server, Svelte Flow and JSON/file persistence. Preserve these accepted seams incrementally; avoid a directory rewrite to satisfy a layering diagram.

| Feature                                         | Source owner                                                                                                             | Checks                                                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Extraction, containment, evidence hashes        | [analysis.ts](../src/lib/server/analysis.ts)                                                                             | [core](../tests/core.test.ts)                                                                      |
| Journey construction and reviewed sample text   | [tours.ts](../src/lib/server/tours.ts), [sample.ts](../src/lib/server/sample.ts)                                         | core, [journey](../tests/browser/journey.spec.ts)                                                  |
| Persistence, external data root, freshness      | [storage.ts](../src/lib/server/storage.ts)                                                                               | core, journey                                                                                      |
| Optional model and narration adapters           | [providers.ts](../src/lib/server/providers.ts)                                                                           | core mocks/contracts, browser simulated audio                                                      |
| Source-linked quality/security prompts          | [review.ts](../src/lib/server/review.ts)                                                                                 | [review tests](../tests/review.test.ts), storyboard                                                |
| Isolated preview and feature suggestions        | [local-preview.ts](../src/lib/server/local-preview.ts), [LocalPreview.svelte](../src/lib/components/LocalPreview.svelte) | [preview tests](../tests/local-preview.test.ts), [storyboard](../tests/browser/storyboard.spec.ts) |
| Session/Origin guards and request orchestration | [hooks](../src/hooks.server.ts), [actions](../src/routes/api/[action]/+server.ts)                                        | core, [restart regression](../tests/browser/session-recovery.spec.ts)                              |
| Canvas, themes, dialogs and input controls      | [page](../src/routes/+page.svelte), [components](../src/lib/components/), [styles](../src/app.css)                       | journey, storyboard                                                                                |

`src/lib/types.ts` defines shared records. `#lib/*` imports are the established alias. Server keys/network/filesystem logic stays under server-only modules; presentation calls the guarded actions. Keep extraction, tour/review decisions, provider/capture I/O and presentation independently understandable. Put new behavior beside its owning feature; split domain/application/infrastructure/presentation only when each has actual responsibilities. Keep small interfaces and explicit dependencies, especially around I/O and provider contracts. Known cleanup opportunity: the page and stylesheet have grown through design iterations; refactor only alongside a bounded behavior-preserving task with regression coverage.

## Verification

Commands are defined in [package.json](../package.json); setup and Chromium prerequisites are in [README](../README.md).

- `npm run verify:docs`: documentation paths/anchors/index coverage, then formatting. Use for documentation-only changes; separately compare factual claims to the source. No unrelated app tests are needed.
- `npm run verify`: docs check/formatting, Svelte/TypeScript checks, core/module tests, production build, then browser journeys. Install Chromium first with `npx playwright install chromium`; Linux may need `--with-deps`.
- There is no separate linter configured. Do not report formatting or type checks as lint/security/factual validation.
- [CI](../.github/workflows/verify.yml) runs the same full command on Node 24/Linux after installing Chromium/system dependencies, with read-only repository permissions and no provider secrets. Configured does not mean a hosted run has passed; check the actual GitHub run.
- Browser tests start a production server on loopback port 4189 and require that port to be available. They run serially and share a temporary data root; later storyboard tests use the sample created by the journey tests. Run the suite for reliable acceptance, not an isolated dependent test.
- Vitest owns extraction/domain decisions, access/persistence and provider contracts; preview tests use a real isolated local Chromium capture. Browser tests own wiring, themes, accessibility interactions and journeys. Add regressions for bugs at the narrowest meaningful level, plus journey coverage when wiring matters. Avoid tests that repeat code structure. Mock hosted services/time where needed; preserve a real local integration path.
- Label results as structural, mocked contract, local integration, live external system, source-based factual review or human user observation. A passing structural check cannot prove an explanation true. Record exact scope and failures in [validation](validation.md).

## Skill routing

Verified 2026-10-17: `codex plugin marketplace list` lists `mattpocock`; `codex plugin list` reports `mattpocock-skills@mattpocock` installed/enabled at 1.3.1. Matching local skill files exist. No installation or personal configuration change was needed. The installed version, not the upstream repository's current list, controls availability.

| Intent                                                                   | Select when useful |
| ------------------------------------------------------------------------ | ------------------ |
| Investigate a concrete question with preserved evidence                  | research           |
| Small module interfaces and testable seams                               | codebase-design    |
| Terminology or durable architecture decisions                            | domain-modeling    |
| A bounded experimental design question                                   | prototype          |
| Difficult failure or regression                                          | diagnosing-bugs    |
| Behavior benefiting from test-first work, or explicit test-first request | tdd                |
| Independent standards/spec review against an identified baseline         | code-review        |
| Pull-request description                                                 | pr                 |
| Agent guidance changes                                                   | writing-for-agents |

Those nine requested methods are available. Other discovered installed skills include implement, implement-spec, to-spec, to-tickets, wayfinder, triage, retro, wizard and productivity helpers; discovery is not a reason to invoke them. Read selected instructions at their actual installed path before use. Prefer one primary workflow per phase, with supporting skills only for distinct capability. Check overlap, ordering, output expectations and additional dependencies before combining methods. A method cannot authorize another chat message, production write or unrelated configuration change. Resolve priority/scope conflicts using AGENTS; if a material ambiguity remains, explain it and ask one focused question while continuing independent work.

If this plugin is absent on another host, use the requested install sequence and verify actual results:

```sh
codex plugin marketplace add mattpocock/skills
codex plugin add mattpocock-skills@mattpocock
```

Report unsupported commands as a blocker; do not infer installation from a successful download. Skills are developer tools, not runtime dependencies. Do not add plugins, custom skills or schedules merely to reproduce this document.

## Reference guidance and decisions

The [Codex best-practices guide](https://learn.chatgpt.com/guides/best-practices) was reread on 2026-10-17: use practical context, acceptance, concise reusable guidance and relevant verification. [Matt Pocock's upstream skills](https://github.com/mattpocock/skills) informs methods; the local instructions govern the selected method. Neither expands MVP scope. This setup applies writing-for-agents to the documentation; it does not impose a prototype, TDD cycle or independent-review ceremony on every change.

Accepted reconciliation: the developer wiki lives in Git for sharing between chats/worktrees. The product's generated knowledge about target projects remains local application data outside those targets; its future schema remains in [knowledge schema](knowledge-schema.md). No vector database, retrieval service or custom skill is introduced.
