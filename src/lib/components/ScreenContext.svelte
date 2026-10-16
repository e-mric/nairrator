<script lang="ts">
  let { sample, name, image = '' }: { sample: boolean; name: string; image?: string } = $props();
</script>

<div class="screen-context">
  {#if image}
    <img src={image} alt={`Original interface of ${name}`} />
  {:else if sample}
    <div class="interface-reconstruction">
      <h3>Waypoint</h3>
      <span class="interface-action">Save a place</span>
      <p>Your saved places appear here.</p>
    </div>
  {:else}
    <div class="interface-reconstruction">
      <h3>{name}</h3>
      <p>Add a screenshot to start with your app’s interface.</p>
    </div>
  {/if}
  <small
    >{image
      ? 'Your screenshot · visual context'
      : sample
        ? 'Reconstructed sample interface · not a live preview'
        : 'Interface screenshot not provided'}</small
  >
</div>
