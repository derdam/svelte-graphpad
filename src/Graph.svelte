<script>
  //	import AudioPlayer, { stopAll } from './AudioPlayer.svelte';
	 import * as vis from 'vis-network'
   import { onMount } from 'svelte';
   import { nodes, edges, addNode, updateNode, addEdge, removeNode, removeEdge } from './GraphStore.js';
   import { buildNodeView } from './NodeView.js';
   import NodeEditor from './NodeEditor.svelte';
   import EdgeEditor from './EdgeEditor.svelte';
   import NodeEditorDocument from './NodeEditorDocument.svelte';
   import NodeEditorValidator from './NodeEditorValidator.svelte';
   import NodeEditorValidatorRejected from './NodeEditorValidatorRejected.svelte';
   import GraphData from './GraphData.svelte';


  let container = { 
     EdgeEditor: EdgeEditor,
     NodeEditor: NodeEditor,
     NodeEditorDocument: NodeEditorDocument,
     NodeEditorValidator: NodeEditorValidator,
     NodeEditorValidatorRejected: NodeEditorValidatorRejected
   }

   let selection = {nodes: [], edges: []};


   let nodeEditor2 = NodeEditor;

   $: nodesSelected = selection.nodes.length;
   $: node1 = nodes.get(selection.nodes.slice(0,1));
   $: node2 = nodes.get(selection.nodes.slice(1,2));
   $: edge1 = edges.get(selection.edges.slice(0,1));

   $: canAddEdge = selection.nodes.length === 2;
   $: canDeleteEdge = selection.nodes.length === 0 && selection.edges.length === 1;
   $: canDeleteNodes = selection.nodes.length > 0;
   $: canAddNode = selection.nodes.length <= 1;
   $: canEditNode = selection.nodes.length === 1;
   $: canEditEdge = selection.edges.length === 1 && !canEditNode;



    $: {
    if (canEditNode) {
    
        let editor = NodeEditor;

        if (node1[0].nodeClass)
        {
           editor = container["NodeEditor"+node1[0].nodeClass]
        } 
        
        nodeEditor2 = editor;
    }
  }

  let inh;
  let inw;



  var data = {
    nodes: nodes,
    edges: edges
  };

  var options = {
   physics: true,
   autoResize: true,
            height: '100%',
            width: '100%',
    interaction: { multiselect: true},
    nodes:{
     shapeProperties: {
            useBorderWithImage:true,
            interpolation:true
          }
    }
  };


  let network;

  onMount(async () => {
    // create a network
    var container = document.getElementById('mynet');
    network = new vis.Network(container, data, options);    
    network.on("select", function (params) {
      // nodeSelection.selectNode(params.nodes[0]);
        selection = params;
    });

    let nodeUpdating = false;
    nodes.on('update', function (event, properties, senderId) { 
     if (!nodeUpdating) {
        // alert(JSON.stringify(properties));
        nodeUpdating = true;
         let view = buildNodeView(properties.data[0]);
     
        let node = {...properties.data[0], ...view};
       
       updateNode(node);
       // alert(JSON.stringify(node));
     
       nodeUpdating = false;
     }
    });

    


    setTimeout(() => {
          network.fit();
        }, 1000);
  
  });
  

   function addNewEdge() {
    if (nodesSelected === 2) {
        addEdge({from: node1[0].id, to: node2[0].id, label: ''});
    }
   }

   function deleteEdge() {
       // alert(JSON.stringify(edge1));
        removeEdge(edge1[0]);
        selection.edges = []
   }

   function deleteNodes() {
     removeEdge(selection.edges);
     removeNode(selection.nodes);
   }

   function addNewNode(attr, edgeattr) {
     if (nodesSelected <= 1) {
      var newNode = addNode({label: 'New\nNode', ...attr});
      if (nodesSelected===1) {
        //alert("foo. "+JSON.stringify(node1.id);
        var newEdge = addEdge({from: node1[0].id, to: newNode[0], label: '', ...edgeattr});
         selection.edges = []; 
      }
        selection.nodes = newNode;
        network.selectNodes(newNode);
     }
    };

    function sampleDocumentNode() {
      return {shape: 'image', size:45, image: './Austrian_ID_card.jpg'}
    }
     function sampleLegalDocumentNode() {
      return {shape: 'image',   size:45, image: './contract-signing.png'}
    }

    function addNewDocumentNode() {
      addNewNode({...sampleDocumentNode(), nodeClass:"Document"},
      {});
    }


    function addNewSingleAccount() {
      nodes.clear();
      edges.clear();
    //  let x = `${someone} was looking for ${something} in the general vicinity of ${somewhere}`;
      addNode([
        {id: "sa_mandate", label: "Single\nAccount"},
        {id: "sa_ah1", label: "Account\nHolder"},
        {id: "sa_bo1", label: "Beneficial\nOwner"},
        {id: "sa_np1", label: "Natural\nPerson"},
        {id: "sa_np1_id", label: "ID Card", nodeClass:"Document", ...sampleDocumentNode()},
        {id: "sa_ah1_doc0", label: "Form 0", nodeClass:"Document", ...sampleLegalDocumentNode()},
        {id: "sa_bo1_doc4", label: "Form 4",nodeClass:"Document", ...sampleLegalDocumentNode()},
       
        
      ]);
      addEdge([
        {from: "sa_mandate", to:"sa_ah1"},
        {from: "sa_mandate", to:"sa_bo1"},
        {from: "sa_ah1", to:"sa_np1"},
        {from: "sa_bo1", to:"sa_np1"},
        {from: "sa_np1", to:"sa_np1_id"},
        {from: "sa_ah1", to:"sa_ah1_doc0"},
        {from: "sa_bo1", to:"sa_bo1_doc4"},
      ]);

    }

    // Event handlers 
    function fit() {
      network.fit();
    }

</script>

<style>
  .editZone {
      position:absolute;
      width:100%;
    
      z-index:99; 
      opacity:0.8; 
    }

    .graph {
      position: absolute;
      top: 0px;
      left:-2px;
      width: 101%;
      height:400px;
    }
</style>


<svelte:window bind:innerHeight={inh} innerWidth={inw}/>

<div class="l0 editZone">

<button on:click={fit}>Center</button>

<!-- <GraphData></GraphData> -->
{#if canAddNode}
  <button on:click={addNewNode}>New node</button>
  <button on:click={addNewDocumentNode}>New document node</button>
  <button on:click={addNewSingleAccount}>New Single Account</button> 
{/if}

{#if canDeleteNodes}
  <button on:click={deleteNodes}>Delete node{ nodesSelected > 1 ? '(s)':''}</button>
{/if}

{#if canAddEdge}
  <button on:click={addNewEdge}>Add Edge</button>
{/if}

{#if canDeleteEdge}
  <button on:click={deleteEdge}>Delete Edge</button>
{/if}
<br/>
{#if canEditEdge}
  <EdgeEditor edge={edge1[0]}></EdgeEditor>
{/if}

{#if canEditNode}
  <!-- <NodeEditor node={node1[0]} on:message={nodeUpdated}></NodeEditor> -->
  <svelte:component this={nodeEditor2} node={node1[0]} ></svelte:component>
{/if}

</div>

<div id ="mynet" class="graph" style="height:{inh+1}px">
</div>	
