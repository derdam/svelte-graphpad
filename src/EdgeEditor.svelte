<script>
   
    import { updateEdge} from './GraphStore.js';

    export let edge;

    $: { updateEdge(edge); }

</script>



{#if edge}
Label
    <textarea bind:value={edge.label} />
  <!--  <button on:click={sayHello}>Submit</button> -->
{/if}