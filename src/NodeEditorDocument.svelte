<script>
   
   import {  updateNode, addNode, addEdge } from './GraphStore.js';

    export let node;

    $: { updateNode(node); console.log("updateNode"); }

    let files = [];
    const changed = (event)=>{
           
            files = event.target.files;
            node.image = window.URL.createObjectURL(files[0]);
           

            let newNode = addNode({label:'Validate'});
              console.log('added' , newNode)
             let newEdge = addEdge({ from: node.id, to: newNode[0]});
        }



</script>

{#if node}
    <input
		type="file"
		accept="image/*"
		class="w-full h-full cursor-pointer"
		bind:files
		on:change={changed}
    />
    <input type=range bind:value={node.size} min=45 max=200 step=5><span>&nbsp;{node.size}</span>
    <input type="text" bind:value={node.label} />
      Class&nbsp;<input type="text" bind:value={node.nodeClass} />
{/if}