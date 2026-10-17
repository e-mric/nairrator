# Nairrator

Understand what you built. A locally running, source-linked guide to React/TypeScript projects, built with SvelteKit and Svelte Flow.

## Run

Requires Node 22.17+ (Node 24 recommended) and npm.

```sh
npm ci
npm run dev
```

Open the loopback URL printed by Vite (usually http://127.0.0.1:5173). For a production build:

```sh
npm run build
npm start
```

Open http://127.0.0.1:4173. `PORT` can select another port. Always use the supplied start script; it binds to loopback and supplies the correct protocol to SvelteKit. Run one process per data directory.

Choose **Explore the sample project**, confirm `App` as the feature entry, then follow `App → handleSave → addPlace → writePlaces`. Choose a different explanation level at any step. Select a diagram node or source reference to inspect its evidence. Progress saves automatically. Reload or open the project menu and use **Saved tours** to reopen a journey. Open a real local React/TypeScript directory when ready; an entire directory selection approves eligible source files in it, subject to ignore rules and exclusions.

The workspace is a blueprint canvas: the app interface stays anchored beside one revealed layer, with quiet step navigation and compact playback controls. Drag empty canvas space to pan; use zoom/reset or Back to the screen to restore context. Choose **View source** or **Read transcript** for more detail; **View connections** opens the technical graph. The top-right sun/moon switches themes. **Settings → Theme** offers System, Light, or Dark; an explicit choice is saved in a theme-only browser cookie. Theme changes preserve the scene and explanation level.

The visual theme uses a restrained blueprint palette: pale Alice Blue in light mode, deep navy in dark mode, a faint diagram grid, and selective blue highlights. Explanation-level choices use a readable, keyboard-operable themed menu.

The final scene offers **Finish with a quick review**. This optional local review presents up to four quality, security, or maintainability prompts with source evidence and recommendations. It checks selected static patterns in saved declaration excerpts; it is not a vulnerability scan, completeness verdict, or security audit. Dependencies, tests, deployment, and runtime security remain unassessed. No external processing or new scanner installation is required.

The sample is a labeled, non-running source fixture. No target scripts are executed. The app works without a model: the sample has reviewed explanations; other projects get deterministic declaration/reference descriptions. New AI explanations require a configured provider.

## Connect a running preview

Install the optional capture browser once:

```sh
npx playwright install chromium
```

Start your target app yourself. Enter its **Running local preview** address (for example `http://127.0.0.1:3000`) and choose **Connect preview**. Nairrator captures the actual rendered interface automatically and remembers the address per analyzed project in this browser. It recaptures when that project is reopened. **Refresh preview** takes a fresh snapshot; this is not a live feed. Captures and feature selection stay in tab memory and are never included in model payloads or written to the tour store. **Preview address → Disconnect preview** forgets the connection.

A unique visible control label associated with a source event handler can produce a suggested highlight. It remains an inferred code link. Use **Choose feature** to pick a control in the captured image or the keyboard-accessible list. The highlight stays with the interface while **Go deeper** follows the selected source journey; choosing another control does not rebuild that journey. A capture does not prove which runtime functions run.

Capture uses a fresh isolated browser, without your existing login session. Only HTTP literal loopback addresses on a different port from Nairrator are supported. Requests are restricted to that exact origin and GET/HEAD; redirects, other origins, write requests, WebSockets, service workers, downloads and popups are blocked. Use the final route address directly. Pages needing remote assets, another backend origin, authentication, or POST-based initialization may be incomplete. The initial viewport is 1280 × 800; offscreen controls, iframe/shadow-root controls, live interaction, runtime instrumentation, automatic project startup and automatic route discovery are not implemented. Page scripts render in the capture browser, so connect a preview you trust; GET requests can still have app-defined side effects. No project build/dev scripts are launched by Nairrator.

A labeled sample reconstruction and optional screenshot fallback remain available without Chromium or a running preview.

## Providers

Keys are server-only environment variables. Set them in your shell or a protected file outside both Nairrator and target repositories, then start the server from that environment. Never put them in browser storage, project source, exported tours, or logs. The UI reports configuration presence only.

| Variable                                    | Purpose                                                                                                                                                         |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NAIRRATOR_LOCAL_ONLY`                      | Defaults to `true`. Only literal `false` enables external provider requests.                                                                                    |
| `NAIRRATOR_DATA_DIR`                        | Optional absolute local data directory outside target repositories. Default: `~/.local/share/nairrator`.                                                        |
| `OPENAI_API_KEY`, `OPENAI_MODEL`            | Hosted explanation adapter. Choose a model supporting Responses structured JSON Schema output. No default model is assumed.                                     |
| `OLLAMA_MODEL`                              | An already installed model on the local Ollama server at `127.0.0.1:11434`. Evaluate quality, memory, speed, and license yourself; no model is auto-downloaded. |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | Optional narration using `eleven_multilingual_v2`.                                                                                                              |

Open **Models & narration**, preview the exact explanation payload, select a provider, and generate. External processing also requires checking the explicit consent box. Local-only mode blocks OpenAI and ElevenLabs before network access; Ollama has no cloud fallback. Keep Ollama itself configured for local execution; Nairrator does not audit Ollama's server configuration.

For narration, enable external processing, configure ElevenLabs, opt in, then press the current step's listen button. Native audio controls support pause/resume. The transcript remains readable without audio. Navigation and level changes stop old audio and highlight the new step; synchronization is at segment boundaries, not word timestamps. Audio is cached locally. Local/offline narration is not implemented.

## Development context

Start new development chats with [AGENTS.md](AGENTS.md), [wiki index](docs/index.md) and [current state](docs/project-state.md). Use the [five chat starters](docs/chat-starters.md) for focused work. Shared conclusions travel through committed files/worktree revisions, not assumed chat history.

## Checks

```sh
npx playwright install chromium
npm run verify
```

For documentation-only work, run `npm run verify:docs` and review the affected factual claims against current source. [Engineering](docs/engineering.md#verification) explains check scopes, CI and limitations. There is no separate lint command.

Browser tests start their own production server and need a current build. They use temporary external data directories, simulated speech, and no real API keys. See [validation](docs/validation.md) for results and accuracy review; a passing structural check does not establish factual correctness.

## Scope and limits

This is the first vertical slice, not the full product brief. Supports named function/arrow React components with JSX and direct syntactic references between functions, including relative imports. It does not type-check target projects, resolve tsconfig aliases, analyze framework routes, prove runtime reachability, or trace arbitrary API/database calls. Graph edges are inferences. Excerpts are capped at 5,000 characters per declaration; scans at 150 eligible files / 3 MB / 5,000 visited entries. Narrow the selected directory for larger projects.

Root and nested `.gitignore` files, built-in exclusions, and user exclusion patterns limit scans. Symlinks are skipped. Secret detection is conservative and cannot guarantee discovery of every embedded credential: review excerpts before external processing. Unsupported and absent relationships remain unknown; no missing-functionality conclusions are drawn.

Freshness checks compare current selected source inventories and hashes on load, focus, every 30 seconds while visible, and before generation. New/changed/deleted/excluded files mark the saved analysis stale. The UI offers manual checking; reopen the directory to re-analyze. Existing snapshots and saved tours are retained. Whole-analysis re-extraction is currently bounded and deterministic; page-level incremental AI regeneration and a Markdown wiki remain future work.

Later increments: selected PRD comparison, Git change explanations, snapshot comparisons, optional text pitch practice. Deferred: arbitrary screen picking, voice input, video export, collaboration, broad framework support, local speech, and accumulated wiki maintenance. See [PRD](docs/PRD.md), [plan](docs/plan.md), [data flow](docs/data-flow.md), and [licenses](docs/licenses.md).

MIT licensed. No Matt Pocock plugin is needed to run Nairrator.
