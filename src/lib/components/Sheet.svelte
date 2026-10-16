<script lang="ts">
  import type { Snippet } from 'svelte';
  let {
    open,
    title,
    onclose,
    children,
    error = '',
  }: {
    open: boolean;
    title: string;
    onclose: () => void;
    children: Snippet;
    error?: string;
  } = $props();
  let dialog: HTMLDialogElement;
  $effect(() => {
    if (dialog) {
      if (open && !dialog.open) dialog.showModal();
      else if (!open && dialog.open) dialog.close();
    }
  });
</script>

<dialog
  bind:this={dialog}
  class="sheet"
  aria-label={title}
  {onclose}
  onclick={(event) => {
    if (event.target === dialog) onclose();
  }}
>
  <div class="sheet-content">
    <header class="sheet-header">
      <span>{title}</span><button
        class="icon-button"
        aria-label={`Close ${title}`}
        onclick={onclose}>×</button
      >
    </header>
    <div class="sheet-body">
      {#if open && error}<div class="notice error" role="alert">
          {error}
        </div>{/if}{@render children()}
    </div>
  </div>
</dialog>
