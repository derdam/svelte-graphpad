<script>
   
   import {  updateNode, addNode, addEdge } from './GraphStore.js';

   import AudioPlayer from './AudioPlayer.svelte';

    export let node;

    $: { updateNode(node); console.log("updateNode"); }

   

</script>

{#if node}
  
  <AudioPlayer
	src="test.mp3"
	title="Brown Paper Bag"
	composer="Reprazent"
	performer=""
/>

{/if}