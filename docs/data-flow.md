# Data flow and trust

## Local path

The browser sends an explicitly selected directory and optional exclusions to the loopback Node server. Filesystem endpoints require a random process-session token supplied only to the same-origin page; host and Origin checks reject foreign origins. After a server restart, the page may renew a stale token through a same-origin browser-only POST and retry the explicitly rejected action once. Renewal requires matching Origin and same-origin Fetch Metadata; it does not relax filesystem or cross-origin guards. Tokens stay in page memory. The server reads eligible source files through realpath containment checks, skips symlinks, dependencies, generated output and likely secrets, and never executes target scripts. A read-only Git revision query disables optional locks and fsmonitor. Git history comparison is not implemented.

The React/TypeScript adapter uses the TypeScript parser without loading target compiler plugins or executing target code. It extracts declarations and inferred references. SHA-256 identifies exact file content; evidence binds excerpts and line ranges to that content, a revision marker, and an analysis snapshot. Commit IDs identify HEAD, while the worktree marker makes clear that current file content may differ; hashes identify the analyzed bytes.

The browser receives extracted symbols, relationships, bounded source excerpts, and explanations. Source/model text is rendered as escaped text, never arbitrary HTML. Svelte Flow handles diagram rendering. Nodes, steps, source evidence, explanation variants and audio requests share stable IDs. Tour traversal is bounded to eight reachable declarations. Native audio is attached to the current step; moving steps stops playback.

## Storage

`NAIRRATOR_DATA_DIR` defaults to `~/.local/share/nairrator`, outside the target. It contains `workspace.json` (schema version 1, current analysis, saved analysis snapshots, tours, levels and progress) and `audio/<hash>.mp3`. Data and audio writes use temporary files and rename; state writes are serialized within one process. Files use mode 0600 and newly created data directories 0700. Retention is local and manual: stop the server before backing up or removing the data directory. There is no cloud sync or export endpoint.

This first slice retains a set of saved snapshots in one data directory; it does not yet implement the future per-project wiki layout. It re-extracts the bounded source set for freshness rather than relying on cached claims. New AI variants replace that tour's existing text after structural validation; the original evidence remains available. There is no factual verification verdict attached to model output.

## Provider paths

- **OpenAI:** only the explicitly previewable task, selected step IDs/titles, file-relative locations, and supporting excerpts are sent to `api.openai.com/v1/responses`, with `store:false` and JSON Schema formatting. Absolute roots, other files, API keys and full analysis graphs are not included. Provider policies still apply; `store:false` is not a zero-retention promise.
- **Ollama:** the same bounded payload goes to `127.0.0.1:11434/api/chat`; selected model is operator-configured. No automatic cloud fallback or model installation.
- **ElevenLabs:** only narration text and the speech model go to the configured voice endpoint; no source files or source references are sent. Returned audio is locally cached. Model/explanation and voice adapters are independent.

Local-only mode is server-enforced and defaults on. External requests require both startup configuration and per-request consent. Preview and generation revalidate freshness so newly excluded or changed sources cannot be deliberately sent from an outdated snapshot. As with any filesystem reader, concurrent edits can occur between validation and use; excerpts remain tied to their captured hashes.

## Limits

This is a single-user local tool, not a multi-user or remotely hosted service. Browser authorization does not protect against another process running as the same OS user. Ignore rules and secret heuristics reduce exposure but cannot classify every credential. Selected source excerpts and generated audio can be sensitive even when stored locally. Repository content is untrusted input to prompts; schema validation constrains output structure and identifiers but cannot prove factual truth or prevent every misleading explanation.

## Presentation preferences and final review

A theme-only `nairrator-theme` cookie stores System/Light/Dark preferences, with SameSite=Strict and a one-year lifetime. It contains no source data or API key. The server uses it to render the chosen theme; CSS follows the OS when System is selected. Scene and explanation progress remain in the local tour store.

The optional final review uses the existing TypeScript parser locally over saved declaration excerpts. Deterministic patterns produce at most four review prompts linked to existing evidence IDs; no additional filesystem scope, command execution, scanner installation, or provider request occurs. Its scope does not include tests, dependency vulnerabilities, deployment, or runtime verification. Findings are not confirmed vulnerabilities, and no match is not a clean-health verdict. The review is displayed on demand and is not persisted as authoritative knowledge.

## Explicit local preview capture

`capture-preview` uses the same loopback/session/Origin guard as source actions and validates a saved tour and fresh source analysis. `local-preview.ts` validates a literal HTTP loopback address and excludes Nairrator's port, then launches an isolated nonpersistent Chromium browser with sandbox enabled. Target JavaScript renders in that browser; repository scripts are never launched. Context routing permits only exact-origin GET/HEAD, fetches with redirects disabled and rejects redirect responses. This accounts for [Playwright's routing behavior](https://playwright.dev/docs/api/class-browsercontext#browser-context-route), which does not rerun the route handler for every redirect. Service workers, WebSockets, popups, downloads and dialogs are blocked/dismissed. Requests have bounded timeouts and the browser closes after capture or failure; one capture runs per process at a time. These restrictions may prevent complete rendering. This is not a guarantee that a target app's GET handlers have no side effects.

The browser returns a 1280 × 800 PNG, bounded visible-control rectangles/labels, capture timestamp and blocked-request count. It does not return input values, page HTML or browser credentials. Screens can still contain private visual content. A unique JSX event-binding label match is a suggestion, not runtime proof. Manual selection remains an inferred link to the source tour. Screenshots and rectangles stay in Nairrator tab memory; only the connected URL is stored per analysis in localStorage for recapture on reopen, and disconnect removes it. No screenshot data enters saved JSON, model payloads, voice requests or external services. Freshness gates capture; an old displayed snapshot remains labeled if sources change.
