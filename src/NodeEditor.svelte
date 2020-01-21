<script>

   import { updateNode } from './GraphStore.js';

   export let node;

    $: { updateNode(node); }

</script>

{#if node}
<div>
  Label&nbsp;<textarea bind:value={node.label} />
  Class&nbsp;<input type="text" bind:value={node.nodeClass} />
  <slot></slot>
</div>
{/if}