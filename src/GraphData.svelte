<script>
   
   import { graph, nodes, edges } from './GraphStore.js';

   export let storeName = "store";

   let storeGen = 0;
   let storeKeys = [];

   function store() {
      localStorage.setItem(storeName, JSON.stringify($graph));
      storeGen++;
   }

   $: {
      if (storeGen >0) {}; // trigger
      storeKeys = [];
      for (let i = 0; i < localStorage.length; i++){
         let key = localStorage.key(i);
         let value = localStorage.getItem(key);
         console.log(key, value);
         storeKeys.push(key);
      }
      storeKeys = storeKeys;
   }

   function deleteEntry() { 
    localStorage.removeItem(storeName)
    storeGen++;
   }

   function restore2(sn) { 
    var data = JSON.parse(localStorage.getItem(sn));
    storeName = sn;
    console.log(data);
    if (data) {
       nodes.clear();
       edges.clear();
       nodes.update(data.nodes);
       edges.update(data.edges);
    }
   }
  
  
</script>
<p>Store name</p><input type="text" bind:value={storeName}>
<p><button on:click={store}>Store</button>
<button on:click={deleteEntry}>Delete</button></p>
<!-- <p>{JSON.stringify($graph)}</p> -->
<p>Stores</p>
{#each storeKeys as key} 
   <button on:click={restore2(key)}>{key}</button>&nbsp;
{/each}
