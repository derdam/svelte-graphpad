<script>
  //	import AudioPlayer, { stopAll } from './AudioPlayer.svelte';
	 import * as vis from 'vis-network'
   import { onMount } from 'svelte';
   import { nodes, edges, addNode, updateNode, addEdge, removeNode, removeEdge, updateEdge } from './GraphStore.js';
   import { buildNodeView } from './NodeView.js';
   import { buildEdgeView } from './EdgeView.js';
   import NodeEditor from './NodeEditor.svelte';
   import EdgeEditor from './EdgeEditor.svelte';
   import NodeEditorDocument from './NodeEditorDocument.svelte';
   import NodeEditorValidator from './NodeEditorValidator.svelte';
   import NodeEditorValidatorRejected from './NodeEditorValidatorRejected.svelte';
   import NodeEditorValidatorAccepted from './NodeEditorValidatorAccepted.svelte';
   import NodeEditorAudio from './NodeEditorAudio.svelte';
   import NodeEditorAddress from './NodeEditorAddress.svelte';
   import NodeEditorYoutube from './NodeEditorYoutube.svelte';
   import NodeEditorPerson from './NodeEditorPerson.svelte';
   
   import GraphData from './GraphData.svelte';
   import Tool from './Tool.svelte';


  let container = { 
     EdgeEditor: EdgeEditor,
     NodeEditor: NodeEditor,
     NodeEditorDocument: NodeEditorDocument,
     NodeEditorValidator: NodeEditorValidator,
     NodeEditorValidatorAccepted,NodeEditorValidatorAccepted,
     NodeEditorValidatorRejected: NodeEditorValidatorRejected,
     NodeEditorAudio:NodeEditorAudio,
     NodeEditorAddress:NodeEditorAddress,
     NodeEditorYoutube:NodeEditorYoutube,
     NodeEditorPerson:NodeEditorPerson
   }

   let selection = {nodes: [], edges: []};


   let nodeEditors = [NodeEditor];
      let edgeEditors = [EdgeEditor];

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

   let nodeChangeSignal = 0;

    $: {
    if (canEditNode) {
    
        let editor = null;
        let editors = [];

        // capture nodeChangeSignal property changes
        let trigger = nodeChangeSignal;

        //console.log("signal: ", trigger)
        //console.log("nodeEditor2 evaluated. nodeClass=" + node1[0].nodeClass);

        if (node1[0].nodeClass)
        {
          editor = container["NodeEditor"+node1[0].nodeClass]
          
          let tokens = node1[0].nodeClass.split(" ");
          console.log(tokens);

          tokens.forEach(t=> {
            let e = container["NodeEditor"+t];
            if (t!=="") {
              editors.push(e);
            }

          })
          
         
        } 
        
        nodeEditors = [...editors];
    }
  }

let edgeChangeSignal = 0;

   $: {
    if (canEditEdge) {
    
        let editor = null;
        let editors = [];

        // capture nodeChangeSignal property changes
        let trigger = edgeChangeSignal;

        //console.log("signal: ", trigger)
        //console.log("nodeEditor2 evaluated. nodeClass=" + node1[0].nodeClass);

        if (edge1[0].nodeClass)
        {
          editor = container["EdgeEditor"+edge1[0].edgeClass]
          
          let tokens = edge1[0].edgeClass.split(" ");
          console.log(tokens);

          tokens.forEach(t=> {
            let e = container["EdgeEditor"+t];
            if (t!=="") {
              editors.push(e);
            }

          })
          
        } 
        
        edgeEditors = [...editors];
    }
  }

  let inh;
  let inw;



  var data = {
    nodes: nodes,
    edges: edges
  };

  let options = {
    physics:{
    enabled: true,
  /*  barnesHut: {
      gravitationalConstant: -2000,
      centralGravity: 0.3,
      springLength: 95,
      springConstant: 0.04,
      damping: 0.09,
      avoidOverlap: 0.0
    }
    */
    }, 
   autoResize: true,
            height: '100%',
            width: '100%',
    interaction: { multiselect: true },
    nodes:{
      font: {color: '#ffffff'},
      shapeProperties: {
              useBorderWithImage:false,
              interpolation:true
      },
      //color:'#0077C8' 
      color: '#33333333'
    }, edges: {
      color: "0077C8"
      ,smooth: { enabled: true}
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
       //  console.log("node.on update: "+JSON.stringify(properties));
        nodeUpdating = true;
         let view = buildNodeView(properties.data[0]);
     
        let node = {...properties.data[0], ...view};
       
       updateNode(node);

       nodeChangeSignal++;
       // alert(JSON.stringify(node));
     
       nodeUpdating = false;
     }
    });

   
 let edgeUpdating = false;
    edges.on('update', function (event, properties, senderId) { 
     if (!edgeUpdating) {
       //  console.log("node.on update: "+JSON.stringify(properties));
        edgeUpdating = true;
         let view = buildEdgeView(properties.data[0]);
     
        let edge = {...properties.data[0], ...view};
       
       updateEdge(edge);

       edgeChangeSignal++;
       // alert(JSON.stringify(node));
     
       edgeUpdating = false;
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
     // return {shape: 'image', size:45, image: './Austrian_ID_card.jpg'}
      return {nodeClass:'Document'}
    }


    function sampleIdDocumentNode() {
      return {shape: 'image', size:45, image: './Austrian_ID_card.jpg'}
    }


    function sampleLegalDocumentNode() {
      return {shape: 'image',   size:45, image: './example-document.jpg'}
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
        {id: "sa_np1_id", label: "ID Card", nodeClass:"Document", ...sampleIdDocumentNode()},
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
      left:82%;
      width:18%;
     
      z-index:99; 
      opacity:0.8; 
    }

    .graph {
      position: absolute;
      top: -2px;
      left:-2px;
      width: 101%;
      height:400px;
    }
</style>


<svelte:window bind:innerHeight={inh} innerWidth={inw}/>

<div class="l0 editZone">

<Tool title="View">
  <button on:click={fit}>Center</button>
</Tool>



<!-- <GraphData></GraphData> -->
{#if canAddNode && !canEditEdge}
  <Tool title="Graph">
   <button on:click={addNewNode}>+ Node</button>
  {#if canDeleteNodes}
    <button on:click={deleteNodes}>Delete node{ nodesSelected > 1 ? '(s)':''}</button>
  {/if}

  
  </Tool>
 {/if}

{#if canAddEdge | canEditEdge | canDeleteEdge}
 <Tool title="Graph">
 {#if canAddEdge}
    <button on:click={addNewEdge}>Add Edge</button>
  {/if}

  {#if canDeleteEdge}
    <button on:click={deleteEdge}>Delete Edge</button>
  {/if}


  {#if canEditEdge}
    <Tool title = "Edge">
      <EdgeEditor edge={edge1[0]}></EdgeEditor>
      {#each edgeEditors as editor}
         <svelte:component this={editor} edge={edge1[0]} ></svelte:component>
   
      {/each}
    </Tool>
  {/if}
  </Tool>
{/if}
  {#if canEditNode}
    <Tool title = "Node">
      <!-- <NodeEditor node={node1[0]} on:message={nodeUpdated}></NodeEditor> -->
      <NodeEditor node={node1[0]} >
      <!-- {#if nodeEditor2 !==null}
      <svelte:component this={nodeEditor2} node={node1[0]} ></svelte:component>
      {/if}
      -->
      {#each nodeEditors as editor}
         <svelte:component this={editor} node={node1[0]} ></svelte:component>
   
      {/each}
      </NodeEditor>
    </Tool>
  {/if}

  

  {#if !canEditNode && !canEditEdge} 
   
    <button on:click={addNewDocumentNode}>+ Document</button>
    <button on:click={addNewSingleAccount}>+ Single account</button> 

  {/if}
 <Tool title="Data">
      <GraphData network={network}></GraphData>
    </Tool>
</div>
<div id ="mynet" class="graph" style="height:{inh+3}px">
</div>	
