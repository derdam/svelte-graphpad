<script>

   import { updateNode } from './GraphStore.js';

   export let node;

   $: { updateNode(node); }

   $: {
      let names = "";
      if (node.person_firstName) {
         names = node.person_firstName;
      }
      if (node.person_lastName) {
         names = node.person_firstName + " " + node.person_lastName
      }

     let props = [node.person_title, names, node.person_dob, node.person_nationality];
     let label = props.join("\n");
      if (label) {
         node.label = label;
      } ;

      console.log("label", node.label)

      if (node.label==="\n\n\n") {
         node.label = "🔵 Fill Person"
      }
   }

</script>

{#if node}
<div>
 <p><input type="text" bind:value={node.person_title} placeholder="Title"/></p>
 <p><input type="text" bind:value={node.person_firstName} placeholder="First Name"/>
 <input type="text" bind:value={node.person_lastName} placeholder="Last Name"/></p>
 <p><input type="text" bind:value={node.person_dob} placeholder="Dob"/></p>
 <p><input type="text" bind:value={node.person_nationality} placeholder="Nationality"/></p>
 
  <slot></slot>
</div>
{/if}