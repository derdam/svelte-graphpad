<script>
   
   import {  updateNode, addNode, addEdge } from './GraphStore.js';

    export let node;

    $: { updateNode(node); console.log("updateNode"); }

  let src = "https://www.youtube.com/embed/J8vz1D_L_OE";

</script>

{#if node}
  URL  <input type="text" bind:value={node.src}/>
   <iframe width="100%" height="315" src={node.src} frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

   

{/if}
