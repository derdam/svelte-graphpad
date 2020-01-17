import { DataSet } from "vis-network";
import { writable } from 'svelte/store';

export let nodes = new DataSet([]);

export let edges = new DataSet([]);

export let graph = new writable({})

export const updateNode = (node) => {nodes.update(node)};
export const updateEdge = (edge) => {edges.update(edge)};


nodes.on('*', function (event, properties, senderId) { 
    graph.set({  nodes: nodes.get(), edges: edges.get()});
});

edges.on('*', function (event, properties, senderId) {  
    graph.set({  nodes: nodes.get(), edges: edges.get()});
});

nodes.add({id:0, label:"Hello"});
nodes.add({id:2, label:"World"});

edges.add({from:0, to:2} )