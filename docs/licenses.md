# Licenses and integration references

Nairrator code: MIT (see root LICENSE). Direct package licenses verified from installed package metadata on 2026-10-16: SvelteKit, Svelte, adapter-node, Vite plugin, Vite, Svelte Flow, ignore, Zod, svelte-check, Prettier and its Svelte plugin: MIT; TypeScript, Vitest, Playwright: Apache-2.0; Node types: MIT. The lockfile records exact installed dependency versions and transitive package metadata. Review the complete dependency tree and notices before distributing a bundled release; this preview is not a packaged distribution.

No local model or voice weights are included. Ollama model licenses depend on the operator's chosen model. ElevenLabs is an optional hosted service subject to its service/voice rights and account terms; availability is not a redistribution license. No offline narration or bundled voice model is claimed. Review voice rights and model licensing before distribution.

Official integration documentation consulted:

- [SvelteKit Node adapter](https://svelte.dev/docs/kit/adapter-node) and [SvelteKit 3 migration](https://svelte.dev/docs/kit/migrating-to-sveltekit-3).
- [Svelte Flow](https://svelteflow.dev/learn).
- [TypeScript compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API).
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs): selected for the hosted adapter's JSON Schema support. The operator chooses a compatible model; no model benchmark was conducted.
- [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs).
- [ElevenLabs speech conversion](https://elevenlabs.io/docs/api-reference/text-to-speech/convert).
- [ignore](https://github.com/kaelzhang/node-ignore), [Zod](https://zod.dev/), [Prettier](https://prettier.io/docs/install), [Svelte formatting plugin](https://github.com/sveltejs/prettier-plugin-svelte).

The end-of-tour static review reuses the installed Apache-2.0 TypeScript parser. No additional scanner or scanner-rule package is bundled; any future external analyzer requires a separate license and execution review.

## Bundled typography

Newsreader, DM Sans and Caveat are distributed under the SIL Open Font License 1.1. Font files and their individual license texts are in `static/fonts/`, sourced from the Google Fonts repository (`google/fonts`, `ofl/newsreader`, `ofl/dmsans`, `ofl/caveat`). Fonts are served locally; no Google Fonts service is contacted at runtime.

Local preview capture uses Playwright 1.64.1 (Apache-2.0) as a runtime dependency. Chromium is installed separately with Playwright's installer and has its own bundled licenses/notices; it is not committed into this repository. No screenshot or capture data is included in the distributed source.
