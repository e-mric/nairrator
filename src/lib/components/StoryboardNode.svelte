<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import SceneDrawing from './SceneDrawing.svelte';
  let { data }: NodeProps = $props();
</script>

<Handle type="target" position={Position.Left} />
<div class="drawn-node">
  <SceneDrawing screen={data.screen === true} />
  <span class="drawn-node-kind">{data.screen ? 'THE SCREEN' : 'BEHIND THE SCENES'}</span>
  <strong>{String(data.name)}</strong>
  {#if data.file}<small>{String(data.file)}</small>{/if}
</div>
<Handle type="source" position={Position.Right} />
