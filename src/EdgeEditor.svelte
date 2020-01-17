<script>
   
    import { updateEdge} from './GraphStore.js';

    export let edge;

    $: { updateEdge(edge); }

</script>



{#if edge}
    <input type="text" bind:value={edge.label} />
  <!--  <button on:click={sayHello}>Submit</button> -->
{/if}