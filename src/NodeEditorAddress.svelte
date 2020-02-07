<script>

   import { updateNode } from './GraphStore.js';

   export let node;

   $: { updateNode(node); }

   $: {
      let loc = "";
      if (node.address_zip) {
         loc = node.address_zip;
      }
      if (node.address_city) {
         loc = node.address_zip + " " + node.address_city
      }

     let props = [node.address_street, loc, node.address_country];
     let label = props.join("\n");
      if (label) {
         node.label = label;
      } ;

      console.log("label", node.label)

      if (node.label==="\n") {
         node.label = "🔴 Fill Address"
      }
   }

</script>

{#if node}
<div>
 <p><input type="text" bind:value={node.address_street} placeholder="Street"/></p>
 <p><input type="text" bind:value={node.address_zip} placeholder="Zip"/>
 <input type="text" bind:value={node.address_city} placeholder="City"/></p>
 <p><input type="text" bind:value={node.address_country} placeholder="Country"/></p>
  <slot></slot>
</div>
{/if}