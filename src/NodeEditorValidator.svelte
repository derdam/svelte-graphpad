<script>

   import { updateNode, removeNode, addNode, addEdge } from './GraphStore.js';

   export let node;

    $: { updateNode(node); }

let reason;
    function approve() {
      removeNode(node);
    }

      function reject() {
      var id = addNode({label:reason})
      updateNode({id: node.id, label: node.label+"\n"+"rejected", nodeClass:"ValidatorRejected", reasonId:id});
      addEdge({label:'reason', from: node.id, to:id[0]})
    }


</script>

{#if node}
  <p><input type="text" bind:value={reason} placeholder="Reason" /></p>
    <button on:click={approve}>Approve</button>
    <button on:click={reject}>Reject</button>

   <!-- <button on:click={sayHello}>Submit</button> -->
{/if}