<script>
   
   import { createEventDispatcher } from 'svelte';

    export let edge;

    const dispatch = createEventDispatcher();

    //  $: { updateNode(node); }

    function updateEdge(node) {
    dispatch('message', {
            edge: edge
        });
    };

    function sayHello() {
        updateEdge(edge)
    }

      $: { updateEdge(edge); }

</script>

<p>Edge editor works</p>

{#if edge}
    <p>Edge.id : {edge.id}</p>
    <input type="text" bind:value={edge.label} />
    <p>New label: {edge.label}</p>
    <button on:click={sayHello}>Submit</button>
{/if}