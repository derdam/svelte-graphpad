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
      updateNode({id: node.id, label:"Rejected", nodeClass:"ValidatorRejected", reasonId:id});
      addEdge({label:'reason', from: node.id, to:id[0]})
    }


</script>

{#if node}
  Label&nbsp;<input type="text" bind:value={node.label} />
  Class&nbsp;<input type="text" bind:value={node.nodeClass} />
  <p>
    <button on:click={approve}>Approve</button>
    Reason: <input type="text" bind:value={reason}/><button on:click={reject}>Reject</button>
  </p>
   <!-- <button on:click={sayHello}>Submit</button> -->
{/if}