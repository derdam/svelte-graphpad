<script>

   import { updateNode, removeNode, addNode, addEdge } from './GraphStore.js';

    export let node;
    $: { updateNode(node); }
   
    let reason;
    function approve() {
      var id = addNode({label:reason, nodeClass:"ValidatorAccepted"})
      node.validator_accepted = true;
      node.validator_reason = reason;
      //updateNode({id: node.id,  nodeClass:"ValidatorRejected", reasonId:id});
      addEdge({label:'approved', from: node.id, to:id[0]})
    }

    function reject() {
      var id = addNode({label:reason, nodeClass:"ValidatorRejected"})
      node.validator_accepted = false;
      node.validator_reason = reason;
      //updateNode({id: node.id,  nodeClass:"ValidatorRejected", reasonId:id});
      addEdge({label:'rejected', from: node.id, to:id[0]})
    }

function remove() {
    removeNode(node);
}

</script>

{#if node}

  <p><input type="text" bind:value={reason} placeholder="Reason" /></p>
    <button on:click={approve}>Approve</button>
    <button on:click={reject}>Reject</button>
  <button on:click={remove}>Remove</button>

   <!-- <button on:click={sayHello}>Submit</button> -->
{/if}