<script>
   
   import {  updateNode, addNode, addEdge } from './GraphStore.js';

    export let node;

    $: { updateNode(node); console.log("updateNode"); }


function toDataURL(src, callback, outputFormat) {
  var img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function() {
    var canvas = document.createElement('CANVAS');
    var ctx = canvas.getContext('2d');
    var dataURL;
    canvas.height = this.naturalHeight;
    canvas.width = this.naturalWidth;
    ctx.drawImage(this, 0, 0);
    dataURL = canvas.toDataURL(outputFormat);
    callback(dataURL);
    document.deleteElement('CANVAS');
  };
  img.src = src;
  if (img.complete || img.complete === undefined) {
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    img.src = src;
  }
}

    let files = [];
    const changed = (event)=>{
           
            files = event.target.files;
            node.image = window.URL.createObjectURL(files[0]);

      toDataURL(
        node.image,
        function(dataUrl) {
          node.image = dataUrl;
        }
      )

           
            /*
            let newNode = addNode({label:'Validate', nodeClass:'Validator', subject:node});
              console.log('added' , newNode)
             let newEdge = addEdge({ from: node.id, to: newNode[0]});
             */
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

{/if}