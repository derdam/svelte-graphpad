<script>
   
   import { createEventDispatcher } from 'svelte';

    export let edge;

    const dispatch = createEventDispatcher();

    //  $: { updateNode(node); }

    function updateNode(node) {
    dispatch('message', {
            edge: edge
        });
    };

    function sayHello() {
        updateNode(edge)
    }

</script>

<p>Edge editor works</p>

{#if edge}
    <p>Edge.id : {edge.id}</p>
    <input type="text" bind:value={edge.label} />
    <p>New label: {edge.label}</p>
    <button on:click={sayHello}>Submit</button>
{/if}