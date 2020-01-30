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
  
  function download(filename, text) {
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', filename);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
  }

  function downloadCurrent() {
      download("GraphPad-"+storeName+".json",JSON.stringify($graph));
   }

    let files = [];
    const changed = (event)=>{
           
            files = event.target.files;

            // Setup file reading
            var reader = new FileReader();
            reader.onload = handleFileRead;

             function handleFileRead(event) {
                   // var save = JSON.parse(event.target.result);
                      localStorage.setItem(file.name, event.target.result);
                      storeGen++;
                      
                }
               let file = files[0];
               // console.log(file.name); 

                reader.readAsText(file); // fires onload when done.
        }

// Start file download.
//download("hello.txt","This is the content of my file :)");

</script>
<p>Store name</p><input type="text" bind:value={storeName}/>
<p>
   <button on:click={store}>Save</button>&nbsp;
   <button on:click={deleteEntry}>Delete</button>&nbsp;
   <button on:click={downloadCurrent}>Download</button>
  
</p>
 <input
      type="file"
      accept="application/JSON"
      class="w-full h-full cursor-pointer"
      bind:files
      on:change={changed}
      />
<!-- <p>{JSON.stringify($graph)}</p> -->
<p>Stores</p>
{#each storeKeys as key} 
   <button on:click={restore2(key)}>{key}</button>&nbsp;
{/each}






