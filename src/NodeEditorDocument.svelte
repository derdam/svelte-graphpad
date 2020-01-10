<script>
   
   import { createEventDispatcher } from 'svelte';

  let files = [];
  const changed = (event)=>{
		console.log('changed', event)
        files = event.target.files;
        node.image = window.URL.createObjectURL(files[0]);
	}

    export let node;

    const dispatch = createEventDispatcher();

    //  $: { updateNode(node); }

    function updateNode(node) {
    dispatch('message', {
            node: node
        });
    };

    function sayHello() {
        updateNode(node)
    }

      $: { updateNode(node); }

</script>



{#if node}
    <p>Node.id : {node.id}</p>
    <input type="text" bind:value={node.label} />
     <input type="text" bind:value={node.image} />
    <p>New label: {node.label}</p>
<input
		type="file"
		accept="image/*"
		class="w-full h-full cursor-pointer"
		bind:files
		on:change={changed}
/>
   <!-- <button on:click={sayHello}>Submit</button> -->

   
{/if}