<script lang="ts">
  import { tick } from 'svelte';
  import { levels, type Level } from '#lib/types';
  let { value, onchange }: { value: Level; onchange: (value: Level) => void } = $props();
  const uid = $props.id();
  let open = $state(false);
  let trigger: HTMLButtonElement;
  let container: HTMLDivElement;
  let list = $state<HTMLDivElement>();
  async function reveal(index: number) {
    open = true;
    await tick();
    list?.querySelectorAll<HTMLButtonElement>('[role=option]')[index]?.focus();
  }
  function choose(level: Level) {
    onchange(level);
    open = false;
    trigger?.focus();
  }
  function key(event: KeyboardEvent) {
    const selected = levels.indexOf(value);
    const focused = Array.from(list?.querySelectorAll('[role=option]') ?? []).indexOf(
      document.activeElement!,
    );
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      open = false;
      trigger?.focus();
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      const next = open
        ? Math.max(0, Math.min(levels.length - 1, focused + (event.key === 'ArrowDown' ? 1 : -1)))
        : selected;
      void reveal(next);
    }
    if (event.key === 'Home' && open) {
      event.preventDefault();
      void reveal(0);
    }
    if (event.key === 'End' && open) {
      event.preventDefault();
      void reveal(levels.length - 1);
    }
    if (event.key === 'Tab') {
      open = false;
      trigger?.focus();
    }
  }
</script>

<svelte:window
  onpointerdown={(event) => {
    if (open && !container?.contains(event.target as Node)) open = false;
  }}
/>
<div
  class="depth-choice"
  bind:this={container}
  onfocusout={(event) => {
    if (!container?.contains(event.relatedTarget as Node)) open = false;
  }}
>
  <button
    bind:this={trigger}
    type="button"
    role="combobox"
    aria-label="EXPLANATION LEVEL"
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={`${uid}-options`}
    onclick={() => {
      if (open) open = false;
      else void reveal(levels.indexOf(value));
    }}
    onkeydown={key}>{value}</button
  >
  {#if open}<div
      class="depth-options"
      role="listbox"
      aria-label="Explanation levels"
      id={`${uid}-options`}
      bind:this={list}
      onkeydown={key}
      tabindex="-1"
    >
      {#each levels as level}<button
          type="button"
          role="option"
          aria-selected={value === level}
          tabindex={value === level ? 0 : -1}
          onclick={() => choose(level)}
          >{level}<span aria-hidden="true">{value === level ? '✓' : ''}</span></button
        >{/each}
    </div>{/if}
</div>
