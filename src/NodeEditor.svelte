<script>
   
   import { createEventDispatcher } from 'svelte';

    export let node;

    const dispatch = createEventDispatcher();

    //  $: { updateNode(node); }

    function updateNode(node) {
    dispatch('message', {
            node: node
        });
    };

    function sayHello() {
        updateNode(node)
    }

</script>

<p>Node editor works</p>

{#if node}
    <p>Node.id : {node.id}</p>
    <input type="text" bind:value={node.label} />
    <p>New label: {node.label}</p>
    <button on:click={sayHello}>Submit</button>
{/if}