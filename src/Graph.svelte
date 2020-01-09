<script>
  //	import AudioPlayer, { stopAll } from './AudioPlayer.svelte';
	 import * as vis from 'vis-network'
   import { onMount } from 'svelte';
   //import { nodeSelection } from './GraphStore.js';
   import NodeEditor from './NodeEditor.svelte';
   import EdgeEditor from './EdgeEditor.svelte';
   import NodeEditorDocument from './NodeEditorDocument.svelte';


   let selection = {nodes: [], edges: []};

   let nodeEditor = NodeEditor;

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
        nodeEditor = node1[0].nodeEditor ? node1[0].nodeEditor : NodeEditor;
    }
  }


	 var nodes = new vis.DataSet([
    {id: 1, label: 'Node 1', shape: 'image',  nodeEditor:NodeEditorDocument, size:50, image: './Austrian_ID_card.jpg'},
    {id: 2, label: 'Node 2'},
    {id: 3, label: 'Node 3'},
    {id: 4, label: 'Node 4'},
    {id: 5, label: 'Node 5'}
  ]);

  // create an array with edges
  var edges = new vis.DataSet([
    {from: 1, to: 3},
    {from: 1, to: 2},
    {from: 2, to: 4},
    {from: 2, to: 5},
    {from: 3, to: 3}
  ]);

  var data = {
    nodes: nodes,
    edges: edges
  };

  var options = {
    interaction: { multiselect: true},
    nodes:{
     shapeProperties: {
            useBorderWithImage:true
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

  });
  

   function addNewEdge() {
    if (nodesSelected === 2) {
        edges.add({from: node1[0].id, to: node2[0].id, label: 'New edge'});
    }
   }

   function deleteEdge() {
       // alert(JSON.stringify(edge1));
        edges.remove(edge1[0]);
        selection.edges = []
   }

   function deleteNodes() {
     edges.remove(selection.edges);
     nodes.remove(selection.nodes);
   }

   function addNewNode(attr) {
     if (nodesSelected <= 1) {
      var newNode = nodes.add({label: 'New\nNode', ...attr});
      if (nodesSelected===1) {
        //alert("foo. "+JSON.stringify(node1.id);
        var newEdge = edges.add({from: node1[0].id, to: newNode[0], label: 'New edge'});
         selection.edges = []; 
      }
        selection.nodes = newNode;
        network.selectNodes(newNode);
     }
    };

    function addNewDocumentNode() {
      addNewNode({shape: 'image',  nodeEditor:NodeEditorDocument, size:50, image: './Austrian_ID_card.jpg'});
    }

    // Event handlers 

    function nodeUpdated(event) {
      nodes.update(event.detail.node);
    }

    function edgeUpdated(event) {
      edges.update(event.detail.edge);
    }

</script>

<style>
	.graph {
		width:100%;
		height:600px;
	}
</style>

<!-- link rel='stylesheet' href='/test.css' -->

<!-- <p>Selected nodes are {JSON.stringify(selection)}</p>

<p>Selected node 1 of {nodesSelected} {JSON.stringify(node1)}</p>

<p>Selected node 2 of {nodesSelected} {JSON.stringify(node2)}</p>

<p>Selected edge 1  {JSON.stringify(edge1)}</p>
-->

{#if canEditEdge}
  <EdgeEditor edge={edge1[0]} on:message={edgeUpdated}></EdgeEditor>
{/if}

{#if canEditNode}
  <!-- <NodeEditor node={node1[0]} on:message={nodeUpdated}></NodeEditor> -->
  <svelte:component this={nodeEditor} node={node1[0]} on:message={nodeUpdated}></svelte:component>
{/if}

{#if canAddNode}
  <button on:click={addNewNode}>New node</button>
   <button on:click={addNewDocumentNode}>New document node</button>
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

<div id ="mynet" class="graph">
</div>	