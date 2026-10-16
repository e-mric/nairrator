# Validation — first vertical slice

2026-10-16. This report describes implemented behavior, not completion of the entire PRD.

## Automated checks

- `npm run check`: TypeScript/Svelte diagnostics, zero errors and warnings.
- `npm test`: 15 tests covering sample extraction and evidence, target read-only behavior, exclusions/credentials/symlinks, changed/deleted/added sources, nested ignore rules, external data location and persistence, local-only routing and consent, model-output IDs/shape, unavailable local models, compact function ownership and default exports, hosted adapter contract, and speech payload/cache.
- `npm run build`: production Node build.
- `npm run test:e2e`: 9 Chromium browser tests covering full sample navigation, source excerpts, diagram, explanation depth with preserved position, persisted progress on reload, visible transcript, desktop/mobile layout without horizontal overflow, session/Origin/Host rejection, simulated audio pause/resume and stop on navigation, and retention of prior tours when switching to a real temporary React directory. Target source bytes remain unchanged.
- `npm run format:check`: formatting check.
- `npm audit`: dependency metadata audit. This is not a full security audit.

Audio in browser tests is simulated local WAV data. Provider contract tests mock network responses. No hosted inference, live speech, or actual Ollama model was exercised; no API keys were requested or sent. Supported request formats and routing do not establish live provider compatibility, audio quality, or model factual accuracy.

## Source-grounded sample accuracy review

Compared all four explanation variants for each sample step against the same source evidence:

| Step        | Observed source                                                          | Interpretation limits retained at every level                                                                                                           |
| ----------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App         | `useState<string[]>([])`, JSX button `onClick={handleSave}`, mapped list | Declaration and event binding visible; no actual click/render test of target.                                                                           |
| handleSave  | Calls `addPlace(places, 'Lisbon')`, then `setPlaces(next)`               | Lisbon is fixed; no user destination input. Call order is source evidence, not successful execution.                                                    |
| addPlace    | Builds `[...places, place]`, calls `writePlaces`, returns array          | Appends without mutating input here; storage call is a side effect. No success guarantee.                                                               |
| writePlaces | `localStorage.setItem('waypoint.places', JSON.stringify(places))`        | Browser storage rather than an invented database; fixture has no restoration path or network request. Browser policies, quota, and durability untested. |

Reviewed fixture SHA-256 values:

- `src/App.tsx`: `63bce21551cbe55badca96bd723a463ffa71403bbdaf826a701d7e9261c22db6`
- `src/places.ts`: `9003fecd2bae8903f7db64b8d0b08035c4c0ee0ab13cd3cb99f3648bb924c80e`
- `src/storage.ts`: `a2f7051fbcdbd37115993c6d21f9f72bd9aa707316a30b8e7ecfa3183a1ef183`

Curated sample explanations require this exact file inventory and hashes; modified fixtures fall back to generic deterministic descriptions. The fixture is explicitly labeled and is not a running target app. Broader explanation quality on representative real projects and live models still needs evaluation.

## Review

Reviewed the complete new files because the workspace has no Git repository or commit baseline. Separate requirements and standards reviews identified and resolved: deletion of prior saved tours on project switch, line-based function misattribution, incorrect default import mapping, and missed new/ignored sources during freshness checks. Regression tests cover these cases. Visually inspected desktop and mobile browser screenshots; keyboard-operable navigation and native audio controls have browser coverage, but a full assistive-technology audit has not been performed.

Structural validation verifies parseable output and known step IDs; model output cannot introduce new graph IDs or source references. It does not prove explanations true. Human source comparison above is separate from structural checks and covers only the bundled sample.

## Remaining work

First-slice limitations are described in README. Major later increments are PRD comparison, Git and snapshot change explanations, optional pitch practice, and persistent Markdown knowledge maintenance. Local model quality/hardware evaluation, local speech setup/licensing, packaged distribution checks, and broad real-project extraction accuracy remain open. No offline narration or verified runtime feature path is claimed.

## Session restart regression — 2026-10-16

The initial process-scoped token expired after a server restart while the page retained its old token. A hydrated-page regression reproduced the exact screenshot message under the original rejection behavior, then passed with same-origin token renewal and a single retry. It also checks tour position/depth after another restart. Added checks reject renewal without same-origin browser context, foreign origins, and malformed multibyte tokens. The in-app browser was reloaded with the fix and the sample opened successfully. No diagnostic instrumentation or temporary baseline changes remain.

## Storyboard and final review — 2026-10-16

The presentation now focuses on one scene with immediate source connections, a bottom scene strip, compact transport, and on-demand source/transcript/settings dialogs. Full-path expansion remains optional. Light and dark themes use the same layout; System follows OS changes and explicit choices persist in a theme-only cookie. Browser coverage verifies unchanged scene/depth across theme changes and reload, keyboard scene selection, Escape dismissal with focus restoration, and no horizontal document overflow at 390 px and 932 px. Desktop light/dark and mobile dark screenshots were visually inspected. Secondary light-theme text tokens were checked against the light background for at least 4.5:1 contrast; this is not a complete accessibility audit.

The final scene offers a short local review. Three core tests verify source-linked storage advice, dynamic-code/HTML/sensitive-storage patterns with no vulnerability verdict, report bounds, and guarded storage/no-match limits. A browser test verifies that the review is absent earlier, opens at the final scene, and links to the correct source. This does not establish scanner completeness or runtime security. The TypeScript parser is reused under its existing Apache-2.0 license; no new scanner dependency or external request was introduced.

This implementation follows the 80/20 teaching goal by reducing the default visible detail, not by claiming measured coverage of a project. Potential paid follow-up is exploratory and outside this implementation. Changed files were reviewed directly because Git is unavailable.

## Blueprint palette and readable depth menu — 2026-10-16

Applied the user-supplied navy/blue/Alice Blue palette with a faint grid only in the diagram stage, fine connectors, drafting corner marks, and compact technical labels. The storyboard's information hierarchy is unchanged. The primary explanation-level control now has a themed listbox rather than relying on platform-dependent native popup colors. Native options use explicit readable fallback colors.

The added production-browser test checks all four options in light and dark system modes, normal and selected text contrast of at least 4.5:1, Escape dismissal with focus restoration, Home/arrow/Enter selection, and unchanged current scene. Existing navigation and restart tests now exercise the themed depth control. Desktop light/dark screenshots with the popup open were visually inspected. Node color interpolation was removed to avoid temporarily low contrast during a theme switch. This is a focused control/visual review, not a full cross-platform assistive-technology audit. Total results: 15 core tests and 9 browser tests pass, with build, type, and formatting checks. Changed files reviewed directly because Git remains unavailable.

## Drawn storyboard refresh — 2026-10-16

15 core tests and 9 production browser tests pass; Svelte check reports zero errors/warnings and production build succeeds. Light/dark screenshots inspected, including illustrated graph nodes and storyboard strip. Existing mobile, keyboard, theme persistence, source evidence and session recovery checks pass. No new runtime dependencies. Full changed files reviewed because this directory has no Git repository. Illustrations are deliberately symbolic; they do not depict verified runtime execution.

## Large scene illustration refinement — 2026-10-16

Default scenes now show a single large drawing; the graph is available through View connections. Updated journey checks verify the drawing default and optional four-node graph. All 15 core and 9 browser tests pass; production build and type checks pass. Inspected light and dark screenshots for the larger drawings and removal of decorative dots/chevrons. Existing mobile and keyboard regressions pass. Symbolic artwork remains an interpretation of sources, not a runtime screenshot. Full-file review used because Git is unavailable.

## Screen-first layers and bundled fonts — 2026-10-16

15 core and 10 browser tests pass, including screenshot attachment, retained screen context across deeper steps, and return navigation. Production build and type checks pass. Inspected light/dark layouts with Newsreader, DM Sans and Caveat served locally. Sample interface is a labeled reconstruction; arbitrary projects need a screenshot, which is held in the tab and lost on reload. No target code execution or automatic screen-to-source mapping. Image CSP allows local blob images; provider and filesystem boundaries remain covered by existing tests. Full-file review used because Git is unavailable.

## Infinite blueprint workspace — 2026-10-16

Production build and type checks pass; 11 browser tests pass, covering screen context, source journey, themes, keyboard controls, mobile layout, and new canvas pan/zoom/reset behavior. Light, dark and mobile screenshots inspected. No dependencies or source-analysis changes. Full changed files reviewed because Git is unavailable. This is a guided spatial canvas with the interface and current layer; it does not automatically capture an arbitrary app preview or establish screen-to-source mappings.

## Running-preview capture — 2026-10-16

18 core/module tests and 12 production-browser tests pass. New coverage exercises real isolated browser capture, source-bound unique control matching, ambiguity, URL policy, rejection of redirects and cross-origin/write requests, feature selection through deeper layers, refresh, automatic address reconnect, disconnect and invalid-address recovery. Build, type checks and formatting pass. Chromium is available on this development host; fresh installations must run the documented installer. Captures do not share the user's browser session and may be incomplete when the app requires blocked requests. Source-to-feature relationships remain inferred; the selected feature is visual context and does not rebuild the source tour. Git was initialized for the requested initial publication; staged changes are reviewed before committing.
