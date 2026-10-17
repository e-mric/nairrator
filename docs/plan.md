# Implementation plan

## Accepted scope

[PRD.md](PRD.md) is the supplied product brief and describes intent. Implement the first vertical slice before PRD comparison, Git comparisons, and pitch practice. Use a labeled sample until a user selects a target repository.

## 1. Source-to-tour vertical slice (implemented; live providers unverified)

Goal: select React/TypeScript sources, confirm an entry, follow source-linked diagram steps at four levels, and save/reopen a tour.
Context: new SvelteKit/TypeScript app with Svelte Flow, Node local server, compiler-based extraction, file persistence, optional model/voice adapters.
Constraints: target read-only; loopback; no automatic target script execution; server-side keys; opt-in cloud; local-only default; static paths are inference, never runtime proof.
Acceptance:

- Sample and real directory selection work; ignores, additional exclusions, secret candidates and symlinks are excluded.
- Entry confirmation yields a small graph with source excerpts, hashes and revisions.
- Level changes preserve position; navigation and saved progress work without a provider.
- Optional OpenAI/Ollama explanations validate step IDs and shape; failures preserve deterministic explanations.
- Optional ElevenLabs audio has native pause/resume, transcript, segment-to-step synchronization, and local cache.
- Sources changed or deleted since analysis are flagged stale; generation refuses stale evidence.
- Meaningful tests cover extraction, access boundaries, providers, model validation, navigation and persistence; build and type checks pass.
- Setup, data flow, licenses, and limitations are documented. Live provider behavior is labeled unverified when credentials/models are absent.

Validation: 15 automated source/provider/review tests and 9 production-browser tests pass; type checks, build, formatting, and dependency audit pass. Sample explanations were reviewed against source at all four levels. See [validation.md](validation.md) for evidence and limitations. Live provider quality evaluation remains open.

## 2. Intent and changes (pending)

Goal: compare selected requirements and explain selected changes with source evidence.
Context: builds on the first slice, not implemented yet.
Constraints: PRD intent is separate from implementation; missing evidence is not proof of missing behavior; no unsupported authorship claims.
Acceptance: requirement statuses match PRD; Git comparisons cover worktree vs HEAD and selected commit ranges; non-Git snapshot comparison works; meaningful tests verify comparison boundaries.

## 3. Optional practice and accumulated knowledge (pending)

Goal: optional audience-specific text pitch feedback and useful cross-session knowledge.
Context: extend only after the first journey works.
Constraints: factual accuracy separate from communication quality; generated prose remains derived interpretation.
Acceptance: feedback cites source evidence and marks unknowns. Add Markdown pages, index, update log, and incremental maintenance when cross-session needs justify them; structural checks remain distinct from factual review.

## Decisions and reconciliation

- 2026-10-16: Latest PRD supersedes the earlier immediate-wiki requirement. Start with JSON and saved tour explanations; `knowledge-schema.md` records the future wiki contract, not a prerequisite framework.
- OpenAI selected as hosted adapter for JSON Schema output; Ollama is a separate local adapter. Model IDs are configured by the user; no unevaluated local model is prescribed.
- No database, vector search, image generation, video generation, or local speech dependency.

Completion checks are maintained in [AGENTS.md](../AGENTS.md). Results and remaining limitations will be recorded in `validation.md`.

## Local session recovery — 2026-10-16 (complete)

Goal: recover an already-open page after a local server restart.
Context: the process token rotates while the browser retains its initial token; the sample action fails with an authorization banner.
Constraints: retain loopback, Origin and token checks; retry only an explicitly rejected expired-session request once; preserve page state.
Acceptance: restart regression opens the sample successfully without a banner; renewal is restricted to same-origin browser requests; malformed tokens fail safely; existing checks pass.

Result: automatic same-origin renewal retries only a rejected expired-session action once. Restart regression verifies sample opening and preserved tour depth/position; renewal rejects cross-origin or missing browser context and malformed token bytes fail safely. Full-file review used because Git remains unavailable.

## Storyboard design refresh — 2026-10-16 (complete)

Goal: make a tour feel like a calm movie storyboard with light and dark themes.
Context: user requested Mobbin research and a minimal editor-inspired direction; the inspected references and product requirements are recorded in the PRD's interface section.
Constraints: preserve source-linked exploration, uncertainty, freshness, saved progress, accessibility, and privacy controls. Reveal secondary information on demand; add no media production features.
Acceptance: one central scene, horizontal scene strip, compact transport controls, on-demand evidence/settings, and consistent light/dark layouts. Theme preference follows system initially, persists explicit selection, and preserves tour position/depth. Verify both themes and responsive layouts, keyboard navigation, and existing tour behavior.
Result: implemented a focused scene stage, horizontal storyboard, compact transport, modal evidence/transcript/settings, and System/Light/Dark themes. Theme-only cookies preserve an explicit preference; scene and depth remain unchanged. Keyboard focus, Escape dismissal, narrow and medium widths, and both themes were checked. No media-production dependencies were added. Full files reviewed because Git remains unavailable.

Design clarification: apply the 80/20 teaching principle; default to a focused current scene and its immediate connections, with full path, evidence, transcript, and settings on demand. No percentage coverage claims.

## End-of-tour review — 2026-10-16 (complete)

Goal: finish the explanation with a small optional quality/security review and useful next steps.
Context: user clarified that the review belongs at the end of the storyboard, not throughout the tour.
Constraints: at most four source-linked review prompts; no security score, comprehensive-audit claim, external request, new scanner dependency, or execution of target scripts. The existing Apache-2.0 TypeScript parser supports the initial checks.
Acceptance: final scene offers a review; earlier scenes do not. Pattern matches for dynamic code, direct HTML, sensitive browser-storage keys, unguarded storage calls, and explicit any types link to evidence. Reports state unassessed scope, avoid declaring vulnerabilities, and remain honest when no patterns match. Meaningful rule tests and an end-of-tour browser test pass.

Review result: implemented five small source-pattern checks with at most four source-linked prompts. The final-scene control is optional. Sample review correctly notes unguarded browser storage and clearly states unassessed scope. Validation: 15 core tests and 9 browser tests, type checks, build, and formatting pass. Monetization remains an exploratory idea; no paid flow or paywall is implemented.

## Blueprint palette and dropdowns — 2026-10-16 (complete)

Goal: match the supplied blue palette and add a restrained blueprint feeling.
Context: user requested pale drafting paper/navy themes and showed unreadable native dark-mode explanation options.
Constraints: retain storyboard layout and low information density; no additional dependencies. Native menu fallback must remain legible, with a fully themed primary depth popup.
Acceptance: blue light/dark/system themes, subtle diagram grid and fine connectors, readable keyboard-operable depth choices, unchanged tour position, responsive layout, and passing relevant checks. Review final source changes directly because Git is unavailable.

Result: applied the supplied blue palette to both themes, a fine diagram grid and drafting corner marks, compact monospace labels, and a keyboard-operable themed explanation menu. Light fallback option colors keep native menus legible. Removed transitional node colors and shortened advanced edge labels. All 15 core tests and 9 browser tests pass, including popup contrast of at least 4.5:1, Escape/focus restoration, arrow-key selection, and preserved scene. Build and type checks pass. No dependency changes.

## Drawn storyboard — 2026-10-16

Goal: translate the approved image concept into a minimal, usable drawing storyboard in both themes.
Context: retain the source-driven tour and interactive graph while replacing schematic boxes with reusable drawn source-symbol illustrations.
Constraints: artwork is symbolic, never runtime evidence; no generated project screenshots, dependencies, or extra UI density. Preserve navigation, depth, evidence, theme preference, and mobile layouts.
Acceptance: paper texture, drawn frames and illustrations, editorial headings, illustrated scene strip; legible light/dark themes and responsive layouts; existing journey, accessibility, build and type checks pass. Review changed files directly while Git is unavailable.

Result: implemented reusable blue line illustrations for screen/function declarations in the interactive graph and scene strip, paper grain, drawn frames, and serif scene headings. The same source names, links, position and theme behavior remain available. Verified 15 core tests, 9 production browser tests, clean type checks and production build; inspected light/dark screenshots and responsive coverage. Reviewed changed files directly; Git is not initialized. Drawings are symbolic source illustrations rather than generated screenshots of arbitrary projects.

## Large scene drawings — 2026-10-16

Goal: bring the app closer to the approved storyboard concept with a large illustration for each scene.
Context: user found technical boxes, connections, chevrons and decorative dots too distracting.
Constraints: minimal light/dark interfaces; retain source evidence and optional technical connections; do not imply that symbolic drawings prove runtime behavior.
Acceptance: default scene shows one large drawing with matching thumbnail; connections appear only on request; decorative dots and chevrons removed; keyboard controls and existing journeys pass relevant checks.

Result: one large symbolic scene illustration is the default, with matching thumbnails; the complete interactive graph is optional. Removed header/status/selection dots and dropdown chevrons while retaining accessible labels, focus and selection states. Verified 15 core and 9 browser tests, production build, zero type-check errors/warnings, and inspected light/dark screenshots. Reviewed changed source files directly because Git is unavailable.

## Screen-first layers and local fonts — 2026-10-16

Goal: anchor the source journey in an app interface, retaining that context while going deeper.
Context: accepted screen-first design and Newsreader/DM Sans/Caveat pairing.
Constraints: no target execution, screenshot upload or automatic source mapping claims. Sample reconstruction is labeled. User screenshots are tab-local, bounded to 5 MB and common raster types. Fonts are bundled with OFL licenses.
Acceptance: interface first, Go deeper advances through actual source steps, deeper steps retain the original screen and a return control, final layer opens evidence. Both themes, keyboard navigation, existing tour persistence and provider restrictions remain intact; relevant checks pass.

Result: implemented the reconstructed sample interface and tab-local screenshot attachment, compact original-screen context on deeper source steps, Go deeper/return controls and source access at the end. Bundled all three font families and OFL texts locally. Screenshot blob URLs are permitted by image CSP only; no target execution or screenshot transmission added. Validation: 15 core and 10 browser tests pass, build succeeds, type checks report zero errors/warnings. New browser coverage verifies screenshot attachment and retained context across layers and return. Light/dark screenshots reviewed; full changed files reviewed because Git remains unavailable. Real projects require a user screenshot for their actual interface; automatic source-to-screen mapping is not implemented.

## Handwritten marginal labels — 2026-10-16

Goal: extend the drawn style to selected short labels, including the local-status text shown by the user.
Constraints: use the existing locally bundled Caveat font; retain readable instructional text and controls, responsive layouts, and both themes.
Acceptance: local status and a few storyboard notes use handwriting; explanations and controls retain DM Sans; build and relevant layout checks pass.

Result: applied Caveat to local status, scene topic, storyboard heading and closing note, with responsive sizes. Retained existing font/color contrast for instructional content. Type checks and build pass; all 10 browser regressions pass, including light/dark and mobile layouts. Screenshot inspected and changed files reviewed directly; Git remains unavailable.

## Infinite blueprint workspace — 2026-10-16

Goal: implement the approved continuous blueprint concept with the interface as an anchor and progressively revealed source layers.
Context: retain the existing source tour, screen context and locally bundled fonts; remove the dashboard-like stage and thumbnail strip.
Constraints: no auto-execution, live-preview capture or fabricated feature mapping; preserve evidence, uncertainty, privacy and accessibility. No new dependencies.
Acceptance: full-page grid surface; large interface anchor alongside current layer; Go deeper and return actions; drag to pan, zoom/reset controls; quiet step navigation; light/dark and mobile layouts; existing journeys and new canvas behavior checked. Review changed files directly while Git is unavailable.

Result: replaced the boxed stage with a continuous drafting surface, large persistent interface anchor, a progressively revealed current layer, handwritten notes and quiet text step navigation. Added pointer pan, bounded zoom and reset/return controls without changing source tour semantics. Narrow screens stack the two areas. Sample reconstruction circles its known feature; arbitrary screenshots remain unannotated visual context. Build and type checks pass; 11 browser tests pass, including a new pan/zoom/reset regression and existing light/dark/mobile coverage. Inspected screenshots and reviewed changed files directly; Git remains unavailable. Automatic preview capture remains unimplemented.

## Running local preview capture — 2026-10-16

Goal: replace required screenshots with automatic capture of an explicitly connected running preview, retaining a feature highlight through deeper layers.
Context: use one isolated Playwright browser capture module, keeping the existing source analysis independent. This accepted requirement supersedes source-only wording for an explicitly connected browser preview: the page’s browser JavaScript renders, while repository scripts are never started.
Constraints: literal HTTP loopback address, separate port from Nairrator, exact preview-origin GET/HEAD requests only, service workers/popups/downloads/websockets blocked, isolated session, bounded capture, no automated clicks or provider transmission. Capture and feature choice remain in tab memory; remember only the chosen address per analysis in browser storage. Source-to-control label matches are suggestions, never confirmed runtime links.
Acceptance: connect once and automatically capture on reopening; actual interface and selected/suggested feature remain visible across layers; ambiguous matches allow keyboard/manual selection; refresh/error/disconnect flows; stale-source label; tests cover URL restrictions, cross-origin redirects/subresources, unique vs ambiguous suggestions, capture and browser journey. Document Chromium setup and isolated-session limitations. Review changed files directly while Git is unavailable.

Result: implemented isolated local-preview capture with actual interface snapshots, unique source-label suggestions, manual/keyboard feature selection, persistent context across deeper layers, refresh with unique manual-selection preservation, per-analysis address reconnect and disconnect. Captures stay in tab memory and are excluded from provider payloads. Added Playwright runtime dependency and Chromium setup docs. URL-policy, foreign-origin/write/redirect rejection, ambiguous matching and real capture tests pass; the browser regression covers connect, highlight, deeper navigation, refresh, automatic reconnect, disconnect and invalid-address recovery. Limitations: snapshot not live feed, no shared login, fixed viewport, same-origin GET/HEAD only, mapping inferred. Existing target-startup prohibition is preserved; explicitly connected page scripts render in an isolated browser.

## Initial Git publication — 2026-10-16

Goal: commit the completed local project and push to the user-specified `https://github.com/e-mric/nairrator.git`.
Context: remote inspected and empty; Git initialized locally on main. This is the first commit, so it contains the existing MVP as well as the preview increment.
Constraints: retain local project data, credentials, build outputs and test artifacts outside Git; no force push.
Acceptance: inspect staged diff and checks, create initial commit, push main, and verify matching local/remote commit and clean worktree.

Publication readiness: remote was confirmed empty; initial staged diff reviewed. Credentials, local project data, browser downloads, builds and test artifacts are excluded. Upstream font licenses retain their original formatting. Final checks: 18 core/module tests, 12 browser tests, production build, zero-error/zero-warning type checks and formatting pass. Browser coverage includes highlight aspect-ratio alignment, light/dark rendering and narrow layouts.

## Preview natural sizing — 2026-10-17

Goal: remove the internal preview scrollbar without hiding content.
Context: fixed canvas/anchor heights and `overflow-y: auto` caused a nested scroll region around the connected preview.
Constraints: retain image/highlight alignment, all capture controls, pan/zoom and responsive light/dark layouts.
Acceptance: intrinsic canvas/anchor heights accommodate the preview and expanded connection controls; no nested scrollbar or clipped anchor at default zoom; light/dark desktop/mobile regression checks pass.

Result: removed the preview's scroll container and fixed percentage heights, allowing the sheet to grow from its content. Preserved image/overlay sizing and a dedicated height for the optional technical graph. Type checks and build pass; all 12 browser tests pass, including expanded preview controls in light/dark at 1280 × 720 and 390 × 844 with no nested scrolling, clipping or horizontal page overflow. Screenshot inspected and Git diff reviewed.

## Shared development context — 2026-10-17

Goal: establish proportionate shared guidance, a lightweight developer wiki and repeatable verification without expanding runtime product scope.
Context: Codex guidance and the installed Matt Pocock 1.3.1 plugin; existing architecture/docs and the unrelated uncommitted preview-sizing fix are preserved.
Constraints: one authority per topic; original sources/private data remain intact; no personal config changes, extra plugins, custom skills, automatic chats or schedules. Developer wiki is committed context; product-generated knowledge remains outside targets.
Checkpoints: inspect current source and plugin evidence; revise concise AGENTS and topic navigation/state/engineering; add five starter prompts and local documentation checks/full verification/CI; review docs/diff and exercise the new commands.
Acceptance: new chats have explicit startup and handoff paths, current facts and gaps cite source/verification, skills are selectively routed and verified, docs navigation passes, and CI uses the same working verification command. Hosted CI is unverified until pushed and executed.

Result: concise startup/maintenance guidance, a linked developer index/current-state handoff/engineering reference, five focused starter prompts, a structural docs checker, aggregate verification and a read-only CI job are implemented. Existing topic docs were reused and developer/product wiki scopes clarified. Installed Matt Pocock marketplace/plugin verified without installation or personal-config edits. `npm run verify` passed all local checks (18 module + 12 browser tests); negative docs navigation cases were rejected. Final documents and Git diff reviewed; unrelated preview-sizing work preserved. Hosted CI remains unverified until this workflow is committed, pushed and run. The next recommended product decision is the scope/success criteria for a real-user screen-to-source comprehension study, still a proposal.
