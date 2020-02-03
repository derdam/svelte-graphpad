<script>
   
   import {  updateNode, addNode, addEdge } from './GraphStore.js';

    export let node;

    $: { updateNode(node); console.log("updateNode"); }

  let src = "https://www.youtube.com/embed/J8vz1D_L_OE";



/*
  $: if(videoUrl) {
    let url = new URL(videoUrl);
    if (url) {
      let startAt = url.searchParams.get("t");
   
      embedUrl = "https://www.youtube.com/embed" + url.pathname;

      thumbUrl = "https://img.youtube.com/vi" + url.pathname+"/0.jpg"

      node.image = thumbUrl;

      
      if (startAt) {
        embedUrl = embedUrl += "?start=" + startAt;
      }

      node.src = embedUrl;
    
    }
  }

  */

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


</script>

{#if node}
 

  Embed URL  <input type="text" bind:value={node.src}/><br/>

  {#if node.image===undefined} 
  Video URL  <input type="text" bind:value={videoUrl}/>  <button on:click={setImageFromEmbeddedVideo}>Grab video thumbnail</button>
  {/if}


   


   <iframe width="100%" height="315" src={node.src} frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

  

{/if}
