import { DataSet } from "vis-network";
import { writable } from 'svelte/store';




export let nodes = new DataSet([]);
export let edges = new DataSet([]);

export let graph = new writable({})

export const updateNode = (node) => {nodes.update(node)};
export const updateEdge = (edge) => {edges.update(edge)};

export const addNode = (node) => {return nodes.add(node)};
export const addEdge = (edge) => {return edges.add(edge)};

export const removeNode = (node) => {nodes.remove(node)};
export const removeEdge = (edge) => {edges.remove(edge)};


nodes.on('*', function (event, properties, senderId) { 
   graph.set({  nodes: nodes.get(), edges: edges.get()});
});

edges.on('*', function (event, properties, senderId) {  
    graph.set({  nodes: nodes.get(), edges: edges.get()});
});

addNode({id:-1, label:"Start", color:"green"});
addNode({id:0, label:"Hello"});
addNode({id:2, label:"World"});

addEdge({from:-1, to:0} )
addEdge({from:0, to:2} )