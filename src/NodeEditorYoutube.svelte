<script>
   
   import {  updateNode, addNode, addEdge } from './GraphStore.js';
   import YoutubeGenericPlayer from './YoutubeGenericPlayer.svelte';

    export let node;

    $: { updateNode(node); console.log("updateNode"); }

//let src = "https://www.youtube.com/embed/J8vz1D_L_OE";



 function setImageFromEmbeddedVideo() {
   let url = new URL(videoUrl);
    if (url) {


     let thumbUrl = "https://img.youtube.com/vi" + url.pathname+"/0.jpg"

     // node.image = thumbUrl;
     console.log("setImageFrom..Video", thumbUrl);

     node.image=thumbUrl;
     node.shape="circularImage";

    }
 }

 let videoUrl;



let srcUrl;

 $:  if (node && node.src){
   // node.src = embedCode;
   // TODO: extract url from embedCode
   let testUrl = node.src.match(/(https?:[^\s"]+)/);
    srcUrl = testUrl && testUrl[1];
  
       
 }




</script>

{#if node}
 
Embed URL  <input type="text" bind:value={node.src}/><br/>

  {#if node.image===undefined} 
  Video URL  <input type="text" bind:value={videoUrl}/>  <button on:click={setImageFromEmbeddedVideo}>Grab video thumbnail</button>
  {/if}

  <YoutubeGenericPlayer embedUrl={srcUrl}></YoutubeGenericPlayer>
{/if}
