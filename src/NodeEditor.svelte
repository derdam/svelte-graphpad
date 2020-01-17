<script>

   import { updateNode } from './GraphStore.js';

   export let node;

    $: { updateNode(node); }

</script>

{#if node}
  Label&nbsp;<input type="text" bind:value={node.label} />
  Class&nbsp;<input type="text" bind:value={node.nodeClass} />
   <!-- <button on:click={sayHello}>Submit</button> -->
{/if}