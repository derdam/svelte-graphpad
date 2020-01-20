<script>

   import { updateNode, removeNode, addNode, addEdge } from './GraphStore.js';

   export let node;

    $: { updateNode(node); }

let reason;
    function acknowledge() {

      let subject = node.subject;
      console.log("subject:", subject);
      updateNode({...subject, image:'./contract-signing.png'})
      removeNode(node.reasonId);
      removeNode(node);

    }



</script>

{#if node}
  Label&nbsp;<input type="text" bind:value={node.label} />
  Class&nbsp;<input type="text" bind:value={node.nodeClass} />
  <p>
    <button on:click={acknowledge}>Acknowledge</button>
  </p>
   <!-- <button on:click={sayHello}>Submit</button> -->
{/if}