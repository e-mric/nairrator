<script lang="ts">
  import { untrack, onMount } from 'svelte';
  import { SvelteFlow, Controls, MarkerType, Position, type Node, type Edge } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import { levels, type Workspace, type Tour, type Level, type ProjectReview } from '#lib/types';
  import '../app.css';
  import Sheet from '#lib/components/Sheet.svelte';
  import StoryboardNode from '#lib/components/StoryboardNode.svelte';
  import LocalPreview from '#lib/components/LocalPreview.svelte';
  import SceneDrawing from '#lib/components/SceneDrawing.svelte';
  const nodeTypes = { storyboard: StoryboardNode };
  import DepthChoice from '#lib/components/DepthChoice.svelte';
  let { data } = $props();
  let sessionToken = untrack(() => data.token);
  let renewal: Promise<string> | null = null;
  let workspace = $state<Workspace | null>(untrack(() => data.workspace));
  let path = $state('');
  let exclusions = $state('');
  let busy = $state('');
  let error = $state('');
  let entry = $state(
    untrack(
      () =>
        workspace?.tour?.entryId ?? workspace?.analysis.symbols.find((s) => s.component)?.id ?? '',
    ),
  );
  let showOpen = $state(false);
  let showProviders = $state(false);
  let preview = $state('');
  let consent = $state(false);
  let provider = $state<'openai' | 'ollama'>('ollama');
  let audioUrl = $state('');
  let canvasWidth = $state(0);
  let audio = $state<HTMLAudioElement>();
  let position = $state(untrack(() => workspace?.tour?.position ?? 0));
  let level = $state<Level>(untrack(() => workspace?.tour?.level ?? levels[0]));
  let selectedEvidence = $state('');
  let panel = $state<'evidence' | 'transcript' | 'limits' | 'review' | null>(null);
  let review = $state<ProjectReview | null>(null);
  let fullPath = $state(false);
  let canvasZoom = $state(1);
  let canvasX = $state(0);
  let canvasY = $state(0);
  let drag: { x: number; y: number; startX: number; startY: number } | null = null;
  function resetCanvas() {
    canvasZoom = 1;
    canvasX = 0;
    canvasY = 0;
  }
  function panStart(event: PointerEvent) {
    if (
      event.button !== 0 ||
      (event.target as HTMLElement).closest(
        'button,input,label,select,textarea,summary,details,a,.svelte-flow',
      )
    )
      return;
    drag = { x: event.clientX, y: event.clientY, startX: canvasX, startY: canvasY };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  function panMove(event: PointerEvent) {
    if (!drag) return;
    canvasX = drag.startX + event.clientX - drag.x;
    canvasY = drag.startY + event.clientY - drag.y;
  }
  function returnToScreen() {
    resetCanvas();
    void progress(0);
  }

  let screenImage = $state('');
  let screenAnalysis = $state('');
  const currentScreenImage = $derived(screenAnalysis === workspace?.analysis.id ? screenImage : '');
  function attachScreen(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      error = 'Choose a PNG, JPEG or WebP screenshot under 5 MB.';
      input.value = '';
      return;
    }
    if (screenImage) URL.revokeObjectURL(screenImage);
    screenImage = URL.createObjectURL(file);
    screenAnalysis = workspace?.analysis.id ?? '';
    input.value = '';
  }
  let theme = $state<'system' | 'light' | 'dark'>(untrack(() => data.theme));
  let systemDark = $state(false);
  let playing = $state(false);
  const resolvedTheme = $derived(theme === 'system' ? (systemDark ? 'dark' : 'light') : theme);
  function setTheme(next: 'system' | 'light' | 'dark') {
    theme = next;
    document.cookie = `nairrator-theme=${next}; Path=/; Max-Age=31536000; SameSite=Strict`;
  }
  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }
  function keyboard(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (
      !tour ||
      showOpen ||
      showProviders ||
      panel ||
      target.closest(
        'input,select,textarea,button,a,audio,[role=dialog],[role=application],.svelte-flow,[role=button]',
      )
    )
      return;
    if (event.key === 'ArrowRight' && position < tour.steps.length - 1) {
      event.preventDefault();
      progress(position + 1);
    }
    if (event.key === 'ArrowLeft' && position > 0) {
      event.preventDefault();
      progress(position - 1);
    }
  }

  const tour = $derived(workspace?.tour);
  const step = $derived(tour?.steps[position]);
  const displayedEvidenceIds = $derived(
    selectedEvidence ? [selectedEvidence] : (step?.evidenceIds ?? []),
  );
  const evidence = $derived(
    workspace?.analysis.evidence.find((e) => e.id === (selectedEvidence || step?.evidenceIds[0])),
  );
  const visibleIds = $derived(
    new Set(
      tour
        ? (fullPath ? tour.steps : tour.steps.slice(Math.max(0, position - 1), position + 2)).map(
            (s) => s.nodeId,
          )
        : (workspace?.analysis.symbols
            .filter((s) => s.component)
            .slice(0, 4)
            .map((s) => s.id) ?? []),
    ),
  );
  const visibleSymbols = $derived(
    workspace?.analysis.symbols.filter((s) => visibleIds.has(s.id)) ?? [],
  );
  const nodes = $derived<Node[]>(
    visibleSymbols.map((s, i) => ({
      id: s.id,
      position: {
        x: fullPath ? (i % 3) * 280 : i * 280,
        y: fullPath ? Math.floor(i / 3) * 165 : 0,
      },
      data: {
        name: s.name,
        screen: s.component,
        file: level === levels[0] ? '' : s.file,
      },
      selected: step?.nodeId === s.id,
      type: 'storyboard',
      style: 'width:210px;background:transparent;border:0',
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    })),
  );
  const edges = $derived<Edge[]>(
    (
      workspace?.analysis.edges.filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to)) ?? []
    ).map((e) => ({
      id: e.id,
      source: e.from,
      target: e.to,
      type: 'smoothstep',
      label:
        level === levels[0]
          ? undefined
          : e.label === 'references call'
            ? 'call'
            : e.label === 'event binding'
              ? 'event'
              : e.label === 'renders component'
                ? 'renders'
                : e.label,
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--edge)' },
      style: 'stroke:var(--edge);stroke-width:1.2;stroke-dasharray:4 4',
      labelStyle: 'font-size:10px;fill:var(--muted)',
      labelBgStyle: 'fill:var(--stage)',
    })),
  );
  onMount(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    systemDark = media.matches;
    const syncTheme = () => {
      systemDark = media.matches;
    };
    media.addEventListener('change', syncTheme);
    const refresh = async () => {
      if (!workspace || busy || document.hidden) return;
      try {
        workspace = { ...workspace, freshness: await (await api('freshness')).json() };
      } catch {
        /* Explicit check reports errors to the user. */
      }
    };
    const timer = setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    return () => {
      media.removeEventListener('change', syncTheme);
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      stopAudio();
    };
  });
  async function renewSession(): Promise<string> {
    if (!renewal)
      renewal = (async () => {
        const response = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });
        if (!response.ok)
          throw new Error(
            'Could not reconnect to the local server. Refresh this page to try again.',
          );
        const result = await response.json();
        if (typeof result.token !== 'string' || !/^[a-f0-9]{64}$/.test(result.token))
          throw new Error('The local server returned an invalid session. Refresh this page.');
        sessionToken = result.token;
        return sessionToken;
      })().finally(() => {
        renewal = null;
      });
    return renewal;
  }
  async function api(action: string, body: unknown = {}) {
    const send = () =>
      fetch(`/api/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-nairrator-token': sessionToken },
        body: JSON.stringify(body),
      });
    let response = await send();
    if (response.status === 401 && (await response.clone().json()).code === 'session_expired') {
      await renewSession();
      response = await send();
    }
    if (!response.ok) {
      const type = response.headers.get('content-type') ?? '';
      const message = type.includes('application/json')
        ? (await response.json()).error
        : await response.text();
      throw new Error(message || 'Request failed');
    }
    return response;
  }
  async function task(label: string, fn: () => Promise<void>) {
    busy = label;
    error = '';
    try {
      await fn();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Something went wrong';
    } finally {
      busy = '';
    }
  }
  function stopAudio() {
    playing = false;
    audio?.pause();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = '';
  }
  function adopt(t: Tour) {
    resetCanvas();
    stopAudio();
    if (workspace) workspace = { ...workspace, tour: t };
    position = t.position;
    level = t.level;
    selectedEvidence = '';
    fullPath = false;
  }
  async function open(sample: boolean) {
    await task('Reading selected sources', async () => {
      stopAudio();
      workspace = await (
        await api('open', { sample, path, exclusions: exclusions.split('\n').filter(Boolean) })
      ).json();
      entry = workspace?.analysis.symbols.find((s) => s.component)?.id ?? '';
      position = 0;
      selectedEvidence = '';
      showOpen = false;
    });
  }
  async function generate() {
    await task('Building your journey', async () => {
      const t = await (await api('tour', { entryId: entry })).json();
      adopt(t);
      if (workspace)
        workspace = {
          ...workspace,
          tours: [...workspace.tours.filter((x) => x.id !== t.id), { id: t.id, title: t.title }],
        };
    });
  }
  function progress(next: number, nextLevel = level) {
    if (!tour) return;
    stopAudio();
    position = next;
    level = nextLevel;
    selectedEvidence = '';
    const tourId = tour.id;
    void task('Saving progress', async () => {
      await api('progress', { tourId, position: next, level: nextLevel });
    });
  }
  async function checkFresh() {
    await task('Checking source freshness', async () => {
      if (workspace) workspace = { ...workspace, freshness: await (await api('freshness')).json() };
    });
  }
  async function loadSpeech() {
    if (!tour || !step) return;
    await task('Preparing narration', async () => {
      stopAudio();
      const segment = { tourId: tour.id, stepId: step.id, level, consent };
      const response = await api('speech', segment);
      const blob = await response.blob();
      if (tour?.id === segment.tourId && step?.id === segment.stepId && level === segment.level)
        audioUrl = URL.createObjectURL(blob);
    });
  }
</script>

<svelte:head
  ><title>Nairrator — Understand what you built</title><meta
    name="description"
    content="Your project, explained one scene at a time."
  /></svelte:head
>
<svelte:window onkeydown={keyboard} />

<div class="studio" data-theme={theme}>
  <header class="studio-header">
    <a class="brand" href="/" aria-label="Nairrator home"
      ><span class="brand-mark">n<span>↗</span></span>nairrator</a
    >
    <button class="project-switch" aria-label="Open a project" onclick={() => (showOpen = true)}
      ><span class="project-symbol">◈</span><span
        >{workspace?.analysis.sample
          ? 'Waypoint'
          : (workspace?.analysis.name ?? 'Open a project')}</span
      ></button
    >
    {#if workspace?.analysis.sample}<span class="sample-label">Sample project</span>{/if}
    <div class="header-actions">
      <span class="privacy">{data.providers.localOnly ? 'Local only' : 'Local workspace'}</span>
      <button
        class="icon-button"
        aria-label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        title={resolvedTheme === 'dark' ? 'Light theme' : 'Dark theme'}
        onclick={toggleTheme}>{resolvedTheme === 'dark' ? '☀' : '☾'}</button
      >
      <button
        class="icon-button"
        aria-label="Models & narration"
        title="Settings"
        onclick={() => (showProviders = true)}>⚙</button
      >
    </div>
  </header>

  <main class="workspace" class:canvas-workspace={!!step}>
    {#if error && !showOpen && !showProviders && !panel}<div class="notice error" role="alert">
        <span>{error}</span><button
          class="icon-button"
          aria-label="Dismiss error"
          onclick={() => (error = '')}>×</button
        >
      </div>{/if}
    {#if workspace?.freshness.stale}<div class="notice warning" role="status">
        <span>Sources changed. This tour describes an earlier snapshot.</span><button
          onclick={() => (showOpen = true)}>Refresh project →</button
        >
      </div>{/if}
    {#if busy}<div class="activity" role="status">{busy}…</div>{/if}

    {#if workspace}
      <div class="workspace-heading">
        <div>
          <span class="eyebrow"
            >{tour ? 'THE STORY BEHIND YOUR PROJECT' : 'LET’S FIND YOUR STARTING POINT'}</span
          >
          <h1>{tour ? 'A little context. A clearer picture.' : 'Every feature has a story.'}</h1>
        </div>
        {#if tour}<div class="depth-control">
            <span>Explain it</span><DepthChoice
              value={level}
              onchange={(next) => progress(position, next)}
            />
          </div>{/if}
      </div>
      {#if !tour}
        <section class="entry-stage">
          <span class="entry-glyph">⌘</span>
          <h2>Choose where the story starts.</h2>
          <p>
            Confirm the screen behind a feature. We’ll follow its main connections, one scene at a
            time.
          </p>
          <label
            >Confirm feature entry component<select id="entry" bind:value={entry}
              ><option value="" disabled>Select a component</option
              >{#each workspace.analysis.symbols.filter((s) => s.component) as s}<option
                  value={s.id}>{s.name} · {s.file}</option
                >{/each}</select
            ></label
          >
          <button class="primary" disabled={!entry || !!busy} onclick={generate}
            >Confirm & build tour →</button
          >
          {#if !workspace.analysis.symbols.some((s) => s.component)}<p class="small-copy">
              No supported React component found. Choose a React/TypeScript directory or try the
              sample.
            </p>{/if}
        </section>
      {:else if step}
        <section class="scene-stage canvas-sheet" aria-label="Current storyboard scene">
          <div class="scene-topline">
            <span class="scene-number"
              >SCENE {String(position + 1).padStart(2, '0')}
              <span>/ {String(tour.steps.length).padStart(2, '0')}</span></span
            ><span class="scene-topic"
              >{position === 0 ? 'The screen' : `Layer ${position} · Behind the screen`}</span
            ><button
              class="quiet-button"
              aria-pressed={fullPath}
              onclick={() => (fullPath = !fullPath)}
              >{fullPath ? 'Back to the scene' : 'View connections'}</button
            >
          </div>
          <div
            class="canvas-viewport"
            role="region"
            aria-label="Blueprint canvas; drag empty space to pan"
            onpointerdown={panStart}
            onpointermove={panMove}
            onpointerup={() => (drag = null)}
            onpointercancel={() => (drag = null)}
          >
            <div
              class="scene-content"
              style:transform={`translate(${canvasX}px, ${canvasY}px) scale(${canvasZoom})`}
            >
              <div
                class="visual-stage"
                aria-label={fullPath ? 'Interactive source diagram' : 'Storyboard illustration'}
                bind:clientWidth={canvasWidth}
              >
                {#if fullPath}
                  {#key `${Math.round(canvasWidth)}:${tour.id}:${fullPath}:${position}:${level}`}
                    <SvelteFlow
                      {nodes}
                      {nodeTypes}
                      {edges}
                      colorMode={theme}
                      fitView
                      minZoom={0.15}
                      fitViewOptions={{ padding: 0.25, minZoom: 0.15, maxZoom: 1.1 }}
                      nodesDraggable={false}
                      nodesConnectable={false}
                      elementsSelectable={true}
                      onnodeclick={({ node }) => {
                        const i = tour.steps.findIndex((s) => s.nodeId === node.id);
                        if (i >= 0) progress(i);
                      }}
                    >
                      <Controls showLock={false} />
                    </SvelteFlow>
                  {/key}
                {:else}
                  <div class="interface-stage" class:original-screen={position > 0}>
                    <span class="anchor-note">Start with what you see.</span>
                    {#key `${workspace.analysis.id}:${tour.entryId}`}
                      <LocalPreview
                        sample={workspace.analysis.sample}
                        name={workspace.analysis.name}
                        analysisId={workspace.analysis.id}
                        tourId={tour.id}
                        fallbackImage={currentScreenImage}
                        stale={workspace.freshness.stale}
                        request={api}
                      />
                    {/key}
                    <details class="screenshot-fallback">
                      <summary>Use a screenshot instead</summary>
                      <label class="screenshot-control"
                        >{currentScreenImage ? 'Replace screenshot' : 'Add your screenshot'}<input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onchange={attachScreen}
                        /></label
                      >
                      <small class="screenshot-note">Stays in this tab. Never uploaded.</small>
                    </details>
                  </div>
                {/if}
                {#if fullPath || position > 0}<span class="visual-caption"
                    ><i></i>
                    {fullPath
                      ? 'The source journey'
                      : 'A source-inspired illustration; runtime unverified'}</span
                  >
                {/if}
              </div>
              <div class="scene-explanation">
                {#if position > 0}
                  <span class="layer-note">Follow one idea.</span>
                  <div class="hero-drawing" aria-label={`Illustration of ${step.title}`}>
                    <SceneDrawing scene={position} />
                  </div>
                {/if}
                <span class="scene-kind"
                  >{tour.origin === 'deterministic'
                    ? 'SOURCE EXPLORATION'
                    : 'AI INTERPRETATION'}</span
                >
                <h2>{step.title === 'App' ? 'Where the journey begins' : step.title}</h2>
                <p class="explanation-text">{step.explanations[level]}</p>
                <button class="source-button" onclick={() => (panel = 'evidence')}
                  >⌘ View source <span>↗</span></button
                >
                <button
                  class="deeper-button"
                  disabled={!!busy}
                  onclick={() =>
                    position < tour.steps.length - 1
                      ? progress(position + 1)
                      : (panel = 'evidence')}
                  >{position < tour.steps.length - 1 ? 'Go deeper' : 'Explore the source'}</button
                >
                <div class="scene-trust">Declaration found; path inferred</div>
              </div>
            </div>
          </div>
          <div class="canvas-tools" aria-label="Canvas controls">
            <button class="quiet-button" onclick={returnToScreen}>Back to the screen</button>
            <div>
              <button
                aria-label="Zoom out"
                disabled={canvasZoom <= 0.6}
                onclick={() => (canvasZoom = Math.max(0.6, canvasZoom - 0.1))}>−</button
              >
              <button aria-label="Reset canvas view" onclick={resetCanvas}
                >{Math.round(canvasZoom * 100)}%</button
              >
              <button
                aria-label="Zoom in"
                disabled={canvasZoom >= 1.5}
                onclick={() => (canvasZoom = Math.min(1.5, canvasZoom + 0.1))}>+</button
              >
            </div>
          </div>
          <div class="scene-bottomline">
            <span>Source inspection · runtime behavior unverified</span><button
              class="quiet-button"
              onclick={() => (panel = 'limits')}>About this analysis ⓘ</button
            >
          </div>
        </section>

        {#if position === tour.steps.length - 1}
          <div class="end-review">
            <span>You’ve connected the main pieces.</span><button
              class="quiet-button"
              disabled={!!busy || workspace.freshness.stale}
              onclick={() =>
                task('Preparing a short review', async () => {
                  review = await (await api('review', { tourId: tour.id })).json();
                  panel = 'review';
                })}>Finish with a quick review →</button
            >
          </div>
        {/if}
        <section class="transport" aria-label="Tour playback">
          <div class="transport-note">
            {audioUrl
              ? 'Narration ready'
              : data.providers.speech && !data.providers.localOnly
                ? 'Narration available'
                : 'Go at your own pace'}
          </div>
          <div class="tour-pagination">
            <button
              class="transport-button"
              aria-label="Previous step"
              title="Previous scene"
              disabled={position === 0}
              onclick={() => progress(position - 1)}>←</button
            ><button
              class="play-button"
              aria-label={audioUrl
                ? playing
                  ? 'Pause narration'
                  : 'Play narration'
                : 'Generate narration for current step'}
              title={audioUrl
                ? 'Play or pause narration'
                : 'Narration requires a configured voice and consent in settings'}
              disabled={!audioUrl &&
                (!data.providers.speech || !consent || data.providers.localOnly || !!busy)}
              onclick={() => {
                if (audioUrl) {
                  if (playing) audio?.pause();
                  else
                    void audio
                      ?.play()
                      .catch(() => (error = 'Could not play narration. Try the audio controls.'));
                } else void loadSpeech();
              }}>{playing ? 'Ⅱ' : '▶'}</button
            ><button
              class="transport-button"
              aria-label="Next step"
              title="Next scene"
              disabled={position === tour.steps.length - 1}
              onclick={() => progress(position + 1)}>→</button
            ><span class="position-label">{position + 1} of {tour.steps.length}</span>
          </div>
          <button class="quiet-button transcript-trigger" onclick={() => (panel = 'transcript')}
            >Read transcript <span>≡</span></button
          >
        </section>
        {#if audioUrl}<div class="audio-controls">
            <audio
              bind:this={audio}
              src={audioUrl}
              controls
              aria-label="Narration playback"
              onplay={() => (playing = true)}
              onpause={() => (playing = false)}
              onended={() => (playing = false)}
            ></audio>
          </div>{/if}

        <section class="storyboard" aria-label="Tour scenes">
          <div class="storyboard-label">
            <span>YOUR STORYBOARD</span><span
              >{tour.steps.length} scenes · explore at your pace</span
            >
          </div>
          <nav class="scene-strip" aria-label="Tour steps">
            {#each tour.steps as s, i}<button
                class="scene-card"
                class:current={i === position}
                aria-current={i === position ? 'step' : undefined}
                aria-label={`Scene ${i + 1}: ${s.title}`}
                onclick={() => progress(i)}
                ><div class="scene-thumbnail">
                  <span class="card-index">{String(i + 1).padStart(2, '0')}</span>
                  <SceneDrawing
                    scene={i}
                    screen={workspace.analysis.symbols.find((symbol) => symbol.id === s.nodeId)
                      ?.component ?? false}
                  />
                </div>
                <div class="scene-card-caption">
                  <span>{s.title}</span>
                </div></button
              >{/each}
          </nav>
        </section>
        <footer class="workspace-footer">
          <span>You don’t need to know everything. Just how it connects.</span><button
            onclick={checkFresh}
            >{workspace.freshness.stale ? 'Stale snapshot' : 'Check freshness'} ↻</button
          >
        </footer>
      {/if}
    {:else}
      <section class="welcome">
        <span class="eyebrow">UNDERSTAND WHAT YOU BUILT</span>
        <div class="welcome-frames" aria-hidden="true">
          <span>01<br /><i>◈</i></span><span>02<br /><i>⌘</i></span><span>03<br /><i>↗</i></span>
        </div>
        <h1>Your project.<br />One clear story.</h1>
        <p>
          The big picture, the key connections, and what happens behind the scenes. A little
          understanding goes a long way.
        </p>
        <div class="welcome-actions">
          <button class="primary" disabled={!!busy} onclick={() => (showOpen = true)}
            >Open a project ↗</button
          ><button class="quiet-button" disabled={!!busy} onclick={() => open(true)}
            >Explore the sample project →</button
          >
        </div>
        <small>Local by default. Your source stays yours.</small>
      </section>
    {/if}
  </main>

  <Sheet {error} open={showOpen} title="Your projects" onclose={() => (showOpen = false)}>
    <h2>Start with a project</h2>
    <p>
      Nairrator reads selected source files. It never starts project scripts or edits your project.
    </p>
    <div class="form-stack">
      <label
        >Local repository directory<input
          bind:value={path}
          placeholder="/Users/you/projects/your-app"
        /></label
      >
      <details>
        <summary>Exclude additional files</summary><label
          >Additional exclusions (one ignore pattern per line)<textarea
            bind:value={exclusions}
            rows="3"
            placeholder="private/**"></textarea></label
        >
      </details>
      <button class="primary" disabled={!!busy || !path} onclick={() => open(false)}
        >Open selected directory</button
      ><button class="outline-button" disabled={!!busy} onclick={() => open(true)}
        >Try the Waypoint sample ↗</button
      >{#if workspace?.tours.length}<div class="form-divider"></div>
        <label
          >Saved tours<select
            aria-label="Reopen saved tour"
            onchange={(e) => {
              const tourId = e.currentTarget.value;
              if (tourId)
                void task('Reopening tour', async () => {
                  const next = await (await api('reopen', { tourId })).json();
                  workspace = next;
                  adopt(next.tour);
                  entry = next.tour.entryId;
                  showOpen = false;
                });
            }}
            ><option value="">Reopen a journey</option>{#each workspace.tours as t}<option
                value={t.id}>{t.title}</option
              >{/each}</select
          ></label
        >{/if}
    </div>
  </Sheet>

  <Sheet {error} open={showProviders} title="Settings" onclose={() => (showProviders = false)}>
    <div class="form-stack">
      <label
        >Theme<select
          aria-label="Theme"
          value={theme}
          onchange={(e) => setTheme(e.currentTarget.value as typeof theme)}
          ><option value="system">System</option><option value="light">Light</option><option
            value="dark">Dark</option
          ></select
        ></label
      >
      <div class="form-divider"></div>
      <h2>Models & narration</h2>
      <p>
        {data.providers.localOnly
          ? 'Local-only mode is on. External inference and speech are blocked.'
          : 'External requests require your explicit consent.'}
      </p>
      <p class="small-copy">
        OpenAI {data.providers.openai ? '· key configured' : '· not configured'}<br />Ollama {data
          .providers.ollama
          ? '· model configured'
          : '· not configured'}<br />ElevenLabs {data.providers.speech
          ? '· configured'
          : '· not configured'}
      </p>
      <label
        >Explanation provider<select bind:value={provider}
          ><option value="ollama">Ollama · local</option><option
            value="openai"
            disabled={data.providers.localOnly}>OpenAI · external</option
          ></select
        ></label
      >{#if tour}<button
          class="quiet-button"
          onclick={() =>
            task('Preparing data preview', async () => {
              preview = JSON.stringify(
                await (await api('preview', { tourId: tour.id })).json(),
                null,
                2,
              );
            })}>Preview exact explanation payload ↗</button
        >{/if}{#if preview}<pre class="payload">{preview}</pre>{/if}<label class="check-label"
        ><input type="checkbox" bind:checked={consent} disabled={data.providers.localOnly} /><span
          >I allow external processing for requests I initiate. OpenAI receives the previewed
          excerpts. ElevenLabs receives only the current transcript.</span
        ></label
      ><button
        class="primary"
        disabled={!tour ||
          !!busy ||
          (provider === 'openai' && (!consent || data.providers.localOnly))}
        onclick={() =>
          task('Generating explanations', async () => {
            if (tour)
              adopt(await (await api('explain', { tourId: tour.id, provider, consent })).json());
          })}>Generate AI explanations</button
      >
      <p class="small-copy">
        Keys are configured on the server, outside repositories. No provider fallback. AI output is
        a source-based interpretation.
      </p>
    </div>
  </Sheet>

  <Sheet
    open={panel !== null}
    title={panel === 'review'
      ? 'A quick project review'
      : panel === 'evidence'
        ? 'Source evidence'
        : panel === 'transcript'
          ? 'Transcript'
          : 'About this analysis'}
    onclose={() => (panel = null)}
  >
    {#if panel === 'evidence' && evidence}<div class="evidence-tabs">
        {#each displayedEvidenceIds as eid}{@const e = workspace?.analysis.evidence.find(
            (e) => e.id === eid,
          )}{#if e}<button class="quiet-button" onclick={() => (selectedEvidence = eid)}
              >{e.file}:{e.start}–{e.end}</button
            >{/if}{/each}
      </div>
      <p class="evidence-location">
        {evidence.file}:{evidence.start}–{evidence.end}<span>Read only</span>
      </p>
      <pre class="code-block">{evidence.excerpt
          .split('\n')
          .map((line, i) => `${String(evidence.start + i).padStart(3, ' ')}  ${line}`)
          .join('\n')}</pre>
      <div class="source-meta">
        TypeScript AST · SHA-256 {evidence.hash.slice(0, 16)}<br />Revision: {evidence.revision}<br
        />{workspace?.freshness.stale
          ? 'Stale snapshot'
          : 'Saved source snapshot; check freshness to revalidate.'}
      </div>
      <p>
        Declarations are parser facts. Connected paths are inferred. Code inspection does not prove
        successful runtime behavior.
      </p>{:else if panel === 'transcript' && step}<details class="transcript" open>
        <summary>Scene {position + 1} · {step.title}</summary>
        <p>{step.explanations[level]}</p>
      </details>{:else if panel === 'review' && review}
      <div class="review-intro">
        <span class="eyebrow">A FEW THINGS WORTH A LOOK</span>
        <h2>A small next step.</h2>
        <p>
          A source-based review to help you prioritize. These observations need your judgment; this
          is not a security audit.
        </p>
      </div>
      {#if workspace?.freshness.stale}<div class="notice warning">
          Sources changed after this review. Refresh the project before relying on it.
        </div>{/if}
      {#if review.findings.length === 0}<p>
          No selected patterns matched in these excerpts. This does not prove that quality or
          security issues are absent.
        </p>{/if}
      {#each review.findings as finding, i}<article class="review-finding">
          <div class="review-kicker">
            {String(i + 1).padStart(2, '0')} · {finding.category} · needs review
          </div>
          <h3>{finding.title}</h3>
          <p>{finding.observation}</p>
          <p class="recommendation">{finding.recommendation}</p>
          <button
            class="quiet-button"
            onclick={() => {
              selectedEvidence = finding.evidenceId;
              panel = 'evidence';
            }}>View source · {finding.file}:{finding.start} ↗</button
          >
        </article>{/each}
      {#if review.additionalFindings}<p class="small-copy">
          {review.additionalFindings} additional pattern matches are outside this short review.
        </p>{/if}
      <details class="review-scope">
        <summary>What this review covers</summary>
        <p>{review.reviewedDeclarations} declaration excerpts checked.</p>
        {#each review.limitations as limit}<p>{limit}</p>{/each}
      </details>
    {:else if panel === 'limits'}<h2>Enough context to connect the dots.</h2>
      <p>
        This tour focuses on the current feature’s main connections. Deeper evidence is always
        available through View source.
      </p>
      {#each workspace?.analysis.warnings ?? [] as warning}<p>{warning}</p>{/each}
      <p>
        PRD comparison, Git change explanations, pitch practice, automatic screen picking, and local
        speech remain future work. No authorship is inferred.
      </p>{/if}
  </Sheet>
</div>
