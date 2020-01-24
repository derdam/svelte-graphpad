<script>

   import { updateNode } from './GraphStore.js';

   export let node;

   $: { updateNode(node); }

</script>

{#if node}
<div>
 <p><input type="text" bind:value={node.nodeClass} placeholder="Classes"/></p>
  <p><textarea bind:value={node.label} placeholder="Label" /></p>
 
  <slot></slot>
</div>
{/if}