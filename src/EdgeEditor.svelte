<script>
   
    import { updateEdge} from './GraphStore.js';

    export let edge;

    $: { updateEdge(edge); }



</script>



{#if edge}
   <p><input type="text" bind:value={edge.edgeClass} placeholder="Classes"/></p>
    <textarea bind:value={edge.label} placeholder="label"/>
    <input type="text" bind:value={edge.color} placeholder="color"/>
    <input type="text" bind:value={edge.value} placeholder="value"/>

  <!--  <button on:click={sayHello}>Submit</button> -->
{/if}