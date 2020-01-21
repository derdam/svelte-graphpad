<script>

   import { updateNode } from './GraphStore.js';

   export let node;

    $: { updateNode(node); }

</script>

{#if node}
<div>
  <p><textarea bind:value={node.label} /></p>
  <p>Class&nbsp;<input type="text" bind:value={node.nodeClass} /></p>
  <slot></slot>
</div>
{/if}