<script lang="ts">
  import { onMount } from 'svelte';
  import type { PreviewCapture } from '#lib/types';
  import ScreenContext from './ScreenContext.svelte';
  let {
    sample,
    name,
    analysisId,
    tourId,
    fallbackImage,
    stale,
    request,
  }: {
    sample: boolean;
    name: string;
    analysisId: string;
    tourId: string;
    fallbackImage: string;
    stale: boolean;
    request: (action: string, body: unknown) => Promise<Response>;
  } = $props();
  let address = $state('');
  let capture = $state<PreviewCapture | null>(null);
  let selectedId = $state<string | null>(null);
  let manuallySelected = $state(false);
  let choosing = $state(false);
  let connecting = $state(false);
  let error = $state('');
  let expanded = $state(false);
  let mounted = true;
  let generation = 0;
  const selected = $derived(capture?.targets.find((target) => target.id === selectedId));
  const storageKey = $derived(`nairrator-preview:${analysisId}`);
  async function connect() {
    if (connecting || stale) return;
    connecting = true;
    const active = ++generation;
    const previousLabel = manuallySelected ? selected?.label : null;
    const previousUrl = capture?.url;
    error = '';
    try {
      const next: PreviewCapture = await (
        await request('capture-preview', { tourId, address })
      ).json();
      if (!mounted || active !== generation) return;
      capture = next;
      const matches =
        previousUrl === next.url && previousLabel
          ? next.targets.filter((target) => target.label === previousLabel)
          : [];
      selectedId =
        matches.length === 1
          ? matches[0].id
          : previousLabel && previousUrl === next.url
            ? null
            : next.suggestedId;
      manuallySelected = matches.length === 1;
      choosing = !selectedId;
      expanded = false;
      address = next.url;
      try {
        localStorage.setItem(storageKey, address);
      } catch {
        /* Capture still works without browser persistence. */
      }
    } catch (e) {
      if (mounted && active === generation)
        error = e instanceof Error ? e.message : 'Could not connect to the preview.';
    } finally {
      if (mounted && active === generation) connecting = false;
    }
  }
  function disconnect() {
    generation++;
    connecting = false;
    capture = null;
    selectedId = null;
    choosing = false;
    address = '';
    error = '';
    expanded = false;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* Optional browser preference. */
    }
  }
  onMount(() => {
    mounted = true;
    try {
      address = localStorage.getItem(storageKey) ?? '';
    } catch {
      /* Optional browser preference. */
    }
    if (address && !stale) void connect();
    return () => {
      mounted = false;
    };
  });
</script>

<div class="local-preview">
  {#if capture}
    <div
      class="captured-interface"
      class:choosing
      style:aspect-ratio={`${capture.width} / ${capture.height}`}
    >
      <img src={capture.image} alt={`Captured interface of ${name}`} />
      {#if selected}
        <div
          class="feature-highlight"
          aria-label={`Highlighted feature: ${selected.label}`}
          style:left={`${(selected.x / capture.width) * 100}%`}
          style:top={`${(selected.y / capture.height) * 100}%`}
          style:width={`${(selected.width / capture.width) * 100}%`}
          style:height={`${(selected.height / capture.height) * 100}%`}
        ></div>
      {/if}
      {#if choosing}
        {#each capture.targets as target}
          <button
            class="feature-target"
            aria-label={`Highlight ${target.label}`}
            title={target.label}
            style:left={`${(target.x / capture.width) * 100}%`}
            style:top={`${(target.y / capture.height) * 100}%`}
            style:width={`${(target.width / capture.width) * 100}%`}
            style:height={`${(target.height / capture.height) * 100}%`}
            onclick={() => {
              selectedId = target.id;
              manuallySelected = true;
              choosing = false;
            }}
          ></button>
        {/each}
      {/if}
    </div>
    <p class="preview-caption">
      {#if stale}Sources changed; feature mapping needs revalidation.
      {:else if selected}{manuallySelected ? 'Selected in preview' : 'Suggested from source'}: {selected.label}.
        Code link inferred.
      {:else}Select a visible feature to keep it in focus.{/if}
    </p>
    {#if choosing && capture.targets.length}
      <label class="feature-picker"
        >Feature
        <select
          aria-label="Feature to highlight"
          value={selectedId ?? ''}
          onchange={(e) => {
            selectedId = e.currentTarget.value || null;
            manuallySelected = true;
            choosing = false;
          }}
        >
          <option value="">Choose a feature</option>
          {#each capture.targets as target}<option value={target.id}>{target.label}</option>{/each}
        </select>
      </label>
    {:else if choosing}<p class="preview-caption">
        No supported visible controls found. Try the route containing your feature.
      </p>{/if}
    <div class="preview-actions">
      <button disabled={connecting || stale} onclick={() => void connect()}
        >{connecting ? 'Refreshing…' : 'Refresh preview'}</button
      >
      <button aria-pressed={choosing} onclick={() => (choosing = !choosing)}>Choose feature</button>
      <button onclick={() => (expanded = !expanded)}>Preview address</button>
    </div>
    <p class="preview-caption">
      Captured {new Date(capture.capturedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })} · {capture.width} × {capture.height} · not a live feed
    </p>
    {#if capture.blockedRequests}<p class="preview-caption">
        Some requests were blocked. Only this preview’s origin and read requests are allowed; the
        screen may be incomplete.
      </p>{/if}
  {:else}
    <ScreenContext {sample} {name} image={fallbackImage} />
  {/if}
  {#if !capture || expanded}
    <form
      class="preview-connect"
      onsubmit={(e) => {
        e.preventDefault();
        void connect();
      }}
    >
      <label
        >Running local preview<input
          aria-label="Local preview address"
          type="url"
          bind:value={address}
          placeholder="http://127.0.0.1:5173"
          required
          maxlength="2000"
        /></label
      >
      <button class="outline-button" disabled={connecting || stale}
        >{connecting ? 'Connecting…' : 'Connect preview'}</button
      >
    </form>
    <p class="preview-caption">
      Open your app first. An isolated local browser captures this route without clicking controls.
      No existing login session is shared.
    </p>
    {#if capture}<button class="quiet-button" onclick={disconnect}>Disconnect preview</button>{/if}
  {/if}
  {#if error}<p class="preview-error" role="alert">{error}</p>{/if}
</div>
