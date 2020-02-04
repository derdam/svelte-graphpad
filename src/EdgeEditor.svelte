<script>
   
    import { updateEdge} from './GraphStore.js';

    export let edge;

    $: { updateEdge(edge); }

</script>



{#if edge}

    <textarea bind:value={edge.label} placeholder="edge label"/>
    <input type="text" bind:value={edge.color} placeholder="edge color"/>
    

  <!--  <button on:click={sayHello}>Submit</button> -->
{/if}