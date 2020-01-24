<script>

   import { updateNode } from './GraphStore.js';

   export let node;

   $: { updateNode(node); }

</script>

{#if node}
<div>
 <p><input type="text" bind:value={node.address.street} placeholder="Street"/></p>
 <p><input type="text" bind:value={node.address.city} placeholder="City"/></p>

  <slot></slot>
</div>
{/if}