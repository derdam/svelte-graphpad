<script>
   
   import { graph, nodes, edges } from './GraphStore.js';

   export let storeName = "store";

   function store() {
      localStorage.setItem(storeName, JSON.stringify($graph));
   }

   function restore() { 
    var data = JSON.parse(localStorage.getItem(storeName));
    console.log(data);
    if (data) {
       nodes.clear();
       edges.clear();
       nodes.update(data.nodes);
       edges.update(data.edges);
    }
   }
  
</script>
<p><input type="text" bind:value={storeName}>Store name</p>
<p><button on:click={store}>Store</button></p>
<p><button on:click={restore}>Restore</button></p>
<p>{JSON.stringify($graph)}</p>